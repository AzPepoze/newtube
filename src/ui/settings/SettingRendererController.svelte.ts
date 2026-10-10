import { createUniqueId } from "@/core/shared/utilities";
import { executeScriptString } from "@core/runtime/controller";
import { createError } from "@core/shared/notifications";
import { logger } from "@core/shared/webPageLogger";
import { getFromStorage, getRootValue, saveToStorage } from "@core/storage/manager";
import {
	deactivateSetting,
	evaluateCondition,
	registerSettingListener,
	unregisterSettingListener,
} from "@settings/engine/functions";
import { getSettingsList, removeSetting } from "@settings/registry/items";
import type { Setting } from "@settings/types/styleshiftTypes";
import { startQuickCustomize } from "@ui/highlight/quickCustomizeService";
import KeyboardShortcuts from "@ui/settings/views/developer/KeyboardShortcuts.svelte";
import { settingsUi } from "@ui/settings/settingsApi";
import { removeConfigUi, showConfigUi } from "@ui/window/config";
import { showUserConfirmation } from "@ui/window/windowFactory";
import { SvelteMap } from "svelte/reactivity";

export class SettingRendererController {
	// Raw, not deep: a deep proxy keeps edits in its own signals and never reaches the stored object.
	setting = $state.raw<Setting>();
	value = $state<any>(null);
	#developerModeOn = $state(false);
	isDeveloperMode = $derived(this.#developerModeOn && (this.setting?.editable ?? false));
	requirementsMet = $state(true);
	conditionsMet = $state(true);
	requiredSettings = $state<Record<string, { name: string; value: any; type: string; options?: any }>>({});
	listeners = new SvelteMap<string, (val: any) => void>();

	#onDeveloperModeChange = (enabled: boolean) => {
		this.#developerModeOn = Boolean(enabled);
	};

	constructor(setting: Setting) {
		this.setting = setting;
		registerSettingListener("developerMode", this.#onDeveloperModeChange);
		this.init();
	}

	async init() {
		if (!this.setting) return;
		try {
			this.#developerModeOn = Boolean(await getRootValue("developerMode"));
			if ("id" in this.setting && this.setting.id) {
				this.value = await getFromStorage(this.setting.id);
			} else if ("value" in this.setting) {
				this.value = (this.setting as any).value;
			}

			if (this.setting.require && Object.keys(this.setting.require).length > 0) {
				const allSettings = getSettingsList();
				for (const reqId in this.setting.require) {
					const reqSetting = allSettings[reqId];
					if (reqSetting) {
						const reqValue = await getFromStorage(reqId);
						this.requiredSettings[reqId] = {
							name: (reqSetting as any).name || reqId,
							value: reqValue,
							type: reqSetting.type,
							options: (reqSetting as any).options,
						};

						const listener = (newVal: any) => {
							this.requiredSettings[reqId].value = newVal;
							this.checkRequirements();
						};
						this.listeners.set(reqId, listener);
						registerSettingListener(reqId, listener);
					}
				}
				this.checkRequirements();
			}

			if (this.setting.type === "conditionSetting" && this.setting.condition) {
				const allSettings = getSettingsList();
				for (const id in this.setting.condition) {
					if (!this.requiredSettings[id]) {
						const reqSetting = allSettings[id];
						if (reqSetting) {
							const reqValue = await getFromStorage(id);
							this.requiredSettings[id] = {
								name: (reqSetting as any).name || id,
								value: reqValue,
								type: reqSetting.type,
								options: (reqSetting as any).options,
							};

							const listener = (newVal: any) => {
								if (this.requiredSettings[id]) {
									this.requiredSettings[id].value = newVal;
									this.checkConditions();
								}
							};
							this.listeners.set(id, listener);
							registerSettingListener(id, listener);
						}
					}
				}
				this.checkConditions();
			}
		} catch (error) {
			createError(`Failed to initialize setting "${this.setting.id || this.setting.type}".`);
			logger.error("settings", `Init error for ${this.setting.id}:`, error);
		}
	}

	checkRequirements() {
		if (this.setting) {
			this.requirementsMet = evaluateCondition(this.setting.require, this.requiredSettings);
		}
	}

	checkConditions() {
		if (this.setting) {
			this.conditionsMet = evaluateCondition(
				this.setting.type === "conditionSetting" ? this.setting.condition : undefined,
				this.requiredSettings,
			);
		}
	}

	destroy() {
		unregisterSettingListener("developerMode", this.#onDeveloperModeChange);
		this.listeners.forEach((listener, id) => {
			unregisterSettingListener(id, listener);
		});
	}

	async handleEdit() {
		if (!this.setting) return;
		showConfigUi(async (parent: HTMLElement) => {
			settingsUi.configEditorRenderer(
				{
					setting: this.setting!,
					onClose: () => removeConfigUi(),
				},
				parent,
			);
		});
	}

	async handleQuickEdit() {
		if (!this.setting) return;
		startQuickCustomize(this.setting);
	}

	async handleDelete() {
		if (this.setting?.id) {
			const settingLabel = "name" in this.setting && this.setting.name ? this.setting.name : this.setting.id;
			const dialogTitle = this.setting.quickCustomize ? "Remove Quick Customization" : "Remove Setting";
			const confirmed = await showUserConfirmation(`Remove "${settingLabel}"? This cannot be undone.`, dialogTitle, {
				confirmLabel: "Remove",
				confirmColor: "#f44336",
			});
			if (!confirmed) return;

			await saveToStorage(this.setting.id, false, true);
			await deactivateSetting(this.setting.id);
			await removeSetting(this.setting);
		}
	}

	customSettingAction(node: HTMLElement) {
		if (!this.setting) return;
		try {
			node.id = this.setting.id || createUniqueId(10);
			if (this.setting.type === "custom") {
				if (typeof this.setting.uiFunction === "function") {
					this.setting.uiFunction(node);
				} else if (typeof this.setting.uiFunction === "string") {
					executeScriptString({
						scriptContent: this.setting.uiFunction,
						sourceIdentifier: `${this.setting.id} : uiFunction`,
						executionArguments: JSON.stringify({ settingId: node.id }),
					});
				}
			}
		} catch (error) {
			logger.error("settings", `Custom action error for ${this.setting.id}:`, error);
		}
	}

	keyboardShortcutsAction(node: HTMLElement) {
		if (!this.setting) return;
		try {
			if (this.setting.type === "keyboardShortcuts") {
				const instance = settingsUi.mountComponent(KeyboardShortcuts, {}, node);

				return {
					destroy() {
						settingsUi.unmount(instance);
					},
				};
			}
		} catch (error) {
			logger.error("settings", `Keyboard action error for ${this.setting.id}:`, error);
		}
	}
}
