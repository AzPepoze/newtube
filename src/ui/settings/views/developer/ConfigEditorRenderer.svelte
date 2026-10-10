<script lang="ts">
	import { refreshExtensionState } from "@core/index";
	import { logger } from "@/shared/logger";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { fade, fly } from "svelte/transition";
	import ConfigMainSection from "./ConfigMainSection.svelte";
	import ConfigSubSection from "./ConfigSubSection.svelte";
	import SettingRenderer from "@renderers/setting/SettingRenderer.svelte";
	import Title from "@base/Title.svelte";
	import { getCategoryParts } from "@ui/window/utils";

	let { setting }: { setting: Setting } = $props();

	let activeTab = $state("general");

	const categoryParts = $derived(getCategoryParts((setting as any).category));
	const categoryRainbow = $derived(Boolean((setting as any).rainbow));

	const previewSnapshot = $derived(JSON.stringify(setting));
	const previewSetting = $derived({ ...JSON.parse(previewSnapshot), id: `preview-${setting.id ?? ""}` } as Setting);

	const displayName = $derived(
		(setting as any).name || (setting as any).category?.label || (setting as any).category || "New Item",
	);

	const tabs = [
		{ id: "general", label: "General", icon: "settings" },
		{ id: "logic", label: "Logic & Code", icon: "code" },
	];

	const mainProps = $derived.by(() => {
		const type = setting.type || "category";
		const props: any =
			type === "category"
				? {
						Category: "category",
						Rainbow: "rainbow",
						Selector: "selector",
						"Highlight Color": "highlightColor",
					}
				: {
						Id: "id",
						Name: "name",
						Description: "description",
					};

		switch (type) {
			case "text":
				Object.assign(props, {
					HTML: "html",
					"Font Size": "fontSize",
					Align: ["align", ["left", "center", "right"]],
				});
				break;
			case "subText":
				Object.assign(props, {
					Text: "text",
					Color: "color",
					"Font Size": "fontSize",
					Align: ["align", ["left", "center", "right"]],
				});
				break;
			case "button":
				Object.assign(props, {
					Icon: "icon",
					Color: "color",
					"Font Size": "fontSize",
					Align: ["align", ["left", "center", "right"]],
				});
				break;
			case "checkbox":
				Object.assign(props, {
					Default: "value",
				});
				break;
			case "numberSlide":
				Object.assign(props, {
					Default: "value",
					Min: "min",
					Max: "max",
					Step: "step",
					Unit: "unit",
				});
				break;
			case "dropdown":
				Object.assign(props, {
					Default: "value",
					Options: [
						"options",
						(val: string) => {
							try {
								(setting as any).options = JSON.parse(val);
							} catch (_e) {
								logger.error("config", "Invalid JSON for options");
							}
						},
					],
				});
				break;
			case "color":
				Object.assign(props, {
					Default: "value",
					"Show Alpha": "showAlphaSlider",
				});
				break;
			case "textInput":
				Object.assign(props, {
					Default: "value",
				});
				break;
			case "imageInput":
				Object.assign(props, {
					Default: "value",
					"Max File Size (Bytes)": "maxFileSize",
				});
				break;
			case "previewImage":
			case "custom":
				delete props.Name;
				delete props.Description;
				break;
			case "combineSetting":
				props["Sync IDs"] = [
					"syncId",
					(val: string) => {
						try {
							(setting as any).settingIds = JSON.parse(val);
						} catch (_e) {
							(setting as any).settingIds = val.split(",").map((s) => s.trim());
						}
					},
				];
				break;
		}
		return props;
	});

	const fieldGroupOrder = ["Identity", "Content", "Appearance", "Behavior"];

	const fieldGroupByLabel: Record<string, string> = {
		Category: "Identity",
		Id: "Identity",
		Name: "Identity",
		Description: "Identity",
		HTML: "Content",
		Text: "Content",
		Icon: "Content",
		Options: "Content",
		"Sync IDs": "Content",
		Rainbow: "Appearance",
		"Highlight Color": "Appearance",
		"Font Size": "Appearance",
		Align: "Appearance",
		Color: "Appearance",
		"Show Alpha": "Appearance",
	};

	const mainGroups = $derived.by(() => {
		const groups: Record<string, Record<string, any>> = {};
		for (const [label, entry] of Object.entries(mainProps)) {
			const groupName = fieldGroupByLabel[label] ?? "Behavior";
			groups[groupName] ??= {};
			groups[groupName][label] = entry;
		}
		return fieldGroupOrder.filter((name) => groups[name]).map((name) => ({ label: name, fields: groups[name] }));
	});

	const subProps = $derived.by(() => {
		const props: any = {
			updateConfig: refreshExtensionState,
		};

		const type = setting.type || "category";

		switch (type) {
			case "checkbox":
			case "dropdown":
				Object.assign(props, {
					constant: 2,
					setup: 3,
					update: 3,
					enable: 0,
					disable: 0,
				});
				break;
			case "button":
				Object.assign(props, { click: 3 });
				break;
			case "numberSlide":
			case "color":
			case "textInput":
				Object.assign(props, {
					var: 2,
					constant: 2,
					setup: 3,
					update: 3,
				});
				break;
			case "custom":
				Object.assign(props, {
					constant: 2,
					setup: 3,
					ui: ["function"],
				});
				break;
			case "combineSetting":
				Object.assign(props, { update: 3 });
				break;
		}
		return props;
	});
</script>

<div class="styleshift-config-editor-layout">
	<header class="styleshift-config-header">
		<div class="styleshift-config-top-row">
			<div class="styleshift-config-setting-info">
				<div class="styleshift-config-type-badge">
					{(setting.type || "category").replace("_", " ")}
				</div>
				<h2 class="styleshift-config-title">
					{displayName}
					{#if setting.id}
						<span class="setting-id">{setting.id}</span>
					{/if}
				</h2>
			</div>

			<nav class="styleshift-config-tabs">
				<CapsuleTabs options={tabs} bind:activeId={activeTab} />
			</nav>
		</div>

		<p class="styleshift-config-hint">
			{activeTab === "general"
				? "These fields define what the setting looks like and which users see it."
				: "Logic & Code runs JavaScript and CSS in the page. Use Run to test a block before saving."}
		</p>
	</header>

	<main class="styleshift-config-main-content">
		{#if activeTab === "general"}
			<div
				class="styleshift-config-tab-content"
				in:fly={{ y: 10, duration: 300, delay: 150 }}
				out:fade={{ duration: 150 }}
			>
				<div class="styleshift-config-general">
					<div class="styleshift-config-editor-column">
						<ConfigMainSection {setting} groups={mainGroups} updateUi={refreshExtensionState} />
					</div>

					<aside class="styleshift-config-preview">
						<h3 class="config-group-title">Preview</h3>
						{#if setting.type}
							<div class="styleshift-config-preview-stage" inert>
								{#key previewSnapshot}
									<SettingRenderer setting={previewSetting} />
								{/key}
							</div>
						{:else}
							<div class="styleshift-config-preview-stage" inert>
								<Title text={categoryParts.text} icon={categoryParts.icon} rainbow={categoryRainbow} />
							</div>
						{/if}
					</aside>
				</div>
			</div>
		{:else if activeTab === "logic"}
			<div
				class="styleshift-config-tab-content logic-tab"
				in:fly={{ y: 10, duration: 300, delay: 150 }}
				out:fade={{ duration: 150 }}
			>
				<div class="logic-container-wrapper">
					<ConfigSubSection {setting} props={subProps} />
				</div>
			</div>
		{/if}
	</main>
</div>

<style lang="scss">
	.styleshift-config-editor-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
		color: var(--font-color);
	}

	.styleshift-config-header {
		padding: 14px 18px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-radius: var(--border-radius);
	}

	.styleshift-config-top-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.styleshift-config-setting-info {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.styleshift-config-type-badge {
		font-size: 11px;
		text-transform: uppercase;
		background: var(--theme-0);
		color: white;
		padding: 2px 8px;
		border-radius: 6px;
		font-weight: 800;
		letter-spacing: 0.5px;
	}

	.styleshift-config-title {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: var(--font-color);
		display: flex;
		align-items: baseline;
		gap: 8px;
		min-width: 0;

		.setting-id {
			font-size: 12px;
			font-weight: 400;
			font-family: "Fira Code", monospace;
			color: var(--font-color-dim);
		}
	}

	.styleshift-config-tabs {
		display: flex;
		align-items: center;
	}

	.styleshift-config-hint {
		margin: 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--font-color-dim);
	}

	.styleshift-config-main-content {
		flex: 1;
		height: 100%;
		overflow: hidden;
	}

	.styleshift-config-tab-content {
		height: 100%;
		padding: 16px;
		box-sizing: border-box;
		overflow-y: auto;
		background: transparent !important;
		container-type: inline-size;

		&.logic-tab {
			padding: 0;
		}
	}

	.styleshift-config-general {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
		gap: 16px;
		align-items: start;
	}

	.styleshift-config-preview {
		position: sticky;
		top: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 16px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);

		.config-group-title {
			margin: 0;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.8px;
			text-transform: uppercase;
			color: var(--font-color-dim);
		}
	}

	.styleshift-config-preview-stage {
		min-width: 0;
		overflow: hidden;
		overflow-wrap: anywhere;
		pointer-events: none;
		user-select: none;
	}

	@container (max-width: 720px) {
		.styleshift-config-general {
			grid-template-columns: minmax(0, 1fr);
		}

		.styleshift-config-preview {
			position: static;
		}
	}

	.logic-container-wrapper {
		height: 100%;
	}

	.styleshift-config-main-content {
		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--border-color);
			border-radius: 10px;
		}
	}
</style>
