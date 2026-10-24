import { IS_IN_EXTENSION_SETTINGS_PAGE, IS_SANDBOX } from "@core/index";
import { isDevModulesLoaded } from "@core/runtime/controller";
import { createError } from "@core/shared/notifications";
import { getRootValue } from "@core/storage/manager";
import { getStyleShiftDevOnlyItems } from "@extensions/youtube/developerItems";
import { addCategory, getAddOnItems, getSettingsList, updateStyleShiftItems } from "@settings/registry/items";
import { type Category } from "@settings/types/styleshiftTypes";
import { logger } from "@shared/logger";
import { createStyleShiftWindow, showUserPrompt } from "@ui/window/windowFactory";
import { createSettingsProps } from "./settingsProps.svelte";
import { tick, unmount } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { settingsUi } from "./settingsApi";

export function setupLeftTitleAnimation(title: HTMLElement) {
	title.style.transform = "translateY(40px)";
	title.style.opacity = "0";
}

const settingUiRegistry = new Map<string, { parent: HTMLElement; container: HTMLElement }>();
const externalCategoryRegistry = new SvelteSet<Category>();

export function registerSettingUi(settingId: string, parent: HTMLElement, container: HTMLElement) {
	settingUiRegistry.set(settingId, { parent, container });
}

export function unregisterSettingUi(settingId: string) {
	settingUiRegistry.delete(settingId);
}

export function registerExternalCategory(category: Category) {
	externalCategoryRegistry.add(category);
	logger.debug("ui", "Registered external category", category);
}

export function unregisterExternalCategory(category: Category) {
	externalCategoryRegistry.delete(category);
	logger.debug("ui", "Unregistered external category", category);
}

export function getExternalCategories() {
	return Array.from(externalCategoryRegistry);
}

export async function refreshSettingUi(settingId: string) {
	logger.debug("ui", `Refreshing UI for setting: ${settingId}`);

	const entry = settingUiRegistry.get(settingId);
	if (!entry) {
		logger.debug("ui", `UI registry not found for setting: ${settingId}`);
		return;
	}

	const { parent, container } = entry;
	const settings = getSettingsList();
	const setting = settings[settingId];
	if (!setting) return;

	logger.debug("ui", `Refreshing targeted UI for setting: ${settingId}`);

	const newElement = await createBaseUiElement(setting.type, setting);
	if (newElement) {
		const anyElement = newElement as any;
		const newContainer = anyElement.frame || anyElement.button || anyElement;
		if (newContainer instanceof HTMLElement) {
			container.replaceWith(newContainer);
			settingUiRegistry.set(settingId, { parent, container: newContainer });
		}
	}
}

export function migrateSettingUiRegistry(oldId: string, newId: string) {
	if (oldId === newId) return;

	const entry = settingUiRegistry.get(oldId);
	if (entry) {
		settingUiRegistry.set(newId, entry);
		settingUiRegistry.delete(oldId);
		logger.debug("ui", `Migrated UI registry from ${oldId} to ${newId}`);
	}
}

type SettingsWindow = Awaited<ReturnType<typeof createStyleShiftWindow>>;

/**
 * Gathers all settings data for UI rendering.
 */
async function fetchSettingsData(getCategory: (() => Category[] | Promise<Category[]>) | null) {
	return {
		internalSettings: getCategory ? [...(await getCategory())] : [],
		externalSettings: [...getAddOnItems(), ...getExternalCategories()],
		devOnlyItems: isDevModulesLoaded ? getStyleShiftDevOnlyItems() : [],
		isDeveloperMode: (await getRootValue("developerMode")) as boolean,
		isDevModulesLoaded,
	};
}

export async function createMainSettingsUi({
	showCategoryList = true,
	onCreate = null as ((styleshiftWindow: SettingsWindow) => void) | null,
	getCategory = null as (() => Category[] | Promise<Category[]>) | null,
}) {
	let settingsWindow: SettingsWindow | null = null;
	let svelteInstance: any = null;
	let svelteProps: ReturnType<typeof createSettingsProps<Record<string, any>>> | null = null;
	let state: "closed" | "opening" | "open" | "closing" = "closed";
	let opening: Promise<void> | null = null;
	let generation = 0;
	const isClosing = () => state === "closing";

	async function mountSettingsComponent(skipAnimation = false) {
		if (!settingsWindow) return;

		const currentWindow = settingsWindow;
		const settingsData = await fetchSettingsData(getCategory);
		if (state === "closing" || settingsWindow !== currentWindow) return;
		svelteProps = createSettingsProps({
			...settingsData,
			showCategoryList,
			skipAnimation,
			onClose: () => returnObject.removeUi(),
			onAddCategory: async () => {
				const categoryName = (await showUserPrompt("Add category", "Enter category name..."))?.trim();
				if (categoryName) await addCategory(categoryName);
			},
		});
		svelteInstance = settingsUi.settingsWindow(svelteProps.props, settingsWindow.contentElement);
	}

	const returnObject = {
		createUi: function (skipAnimation = false): Promise<void> {
			if (state === "opening") return opening!;
			if (state === "closing") return Promise.resolve();
			if (state === "open") return returnObject.recreateUi();
			state = "opening";
			const currentGeneration = ++generation;
			opening = (async () => {
				try {
					settingsWindow = await createStyleShiftWindow({
						skipAnimation,
						title: "StyleShift Settings",
						fullscreen: IS_IN_EXTENSION_SETTINGS_PAGE && !IS_SANDBOX,
						onWindowClosing: () => {
							state = "closing";
							void returnObject.removeUi();
						},
						onWindowClosed: async () => {
							// Initialization may still be fetching settings when the titlebar closes.
							if (svelteInstance) {
								const instance = svelteInstance;
								svelteInstance = null;
								svelteProps = null;
								await unmount(instance);
							}
						},
					});
					const currentWindow = settingsWindow;
					currentWindow.windowElement.style.minWidth = "500px";
					await mountSettingsComponent(skipAnimation);
					if (settingsWindow !== currentWindow || isClosing()) return;
					onCreate?.(currentWindow);
					await currentWindow.opened;
					if (settingsWindow === currentWindow && !isClosing()) state = "open";
				} catch (error) {
					if (generation === currentGeneration) {
						await returnObject.removeUi(true);
						state = "closed";
					}
					throw error;
				}
			})();
			return opening;
		},

		removeUi: async function (skipAnimation = false) {
			if (!settingsWindow) return;
			state = "closing";
			const currentWindow = settingsWindow;
			try {
				await currentWindow.closeWindowHandler(skipAnimation);
			} finally {
				if (settingsWindow === currentWindow) {
					settingsWindow = null;
					state = "closed";
				}
			}
		},

		recreateUi: async function () {
			if (!settingsWindow || state !== "open") return;

			const currentWindow = settingsWindow;
			await updateStyleShiftItems();
			if (settingsWindow !== currentWindow || isClosing()) return;

			if (!svelteProps) {
				await mountSettingsComponent();
				return;
			}
			const currentProps = svelteProps;
			const data = await fetchSettingsData(getCategory);
			if (svelteProps !== currentProps || isClosing()) return;
			currentProps.update(data);
			await tick();
		},

		toggle: async function () {
			if (state === "opening" || state === "closing") return;
			if (state === "open") await returnObject.removeUi();
			else await returnObject.createUi();
		},

		setGetCategory: function (newFunction: () => Category[] | Promise<Category[]> | null) {
			getCategory = newFunction as any;
			if (settingsWindow) returnObject.recreateUi();
		},
	};

	return returnObject;
}

async function createBaseUiElement(uiType: string, thisData: any) {
	try {
		const renderFunction = settingsUi[uiType as keyof typeof settingsUi];
		if (typeof renderFunction === "function") {
			return await (renderFunction as any)(thisData);
		}
		throw new Error(`UI component type "${uiType}" not found in settingsUi`);
	} catch (error) {
		createError(`${error}\n\n${JSON.stringify(thisData, null, 2)}`);
		return null;
	}
}
