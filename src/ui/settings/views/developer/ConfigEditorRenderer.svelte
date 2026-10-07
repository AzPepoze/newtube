<script lang="ts">
	import { refreshExtensionState } from "@core/index";
	import { logger } from "@/shared/logger";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { fade, fly } from "svelte/transition";
	import ConfigMainSection from "./ConfigMainSection.svelte";
	import ConfigSubSection from "./ConfigSubSection.svelte";

	let { setting }: { setting: Setting } = $props();

	let activeTab = $state("general");

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
		<div class="styleshift-config-setting-info">
			<div class="styleshift-config-type-badge">
				{(setting.type || "category").replace("_", " ")}
			</div>
			<h2 class="styleshift-config-title">
				{displayName}
				{#if setting.id}
					<span class="setting-id">- {setting.id}</span>
				{/if}
			</h2>
		</div>

		<nav class="styleshift-config-tabs">
			<CapsuleTabs options={tabs} bind:activeId={activeTab} />
		</nav>
	</header>

	<main class="styleshift-config-main-content">
		{#if activeTab === "general"}
			<div
				class="styleshift-config-tab-content"
				in:fly={{ y: 10, duration: 300, delay: 150 }}
				out:fade={{ duration: 150 }}
			>
				<ConfigMainSection {setting} props={mainProps} updateUi={refreshExtensionState} />
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
		padding: 20px 25px;
		background: var(--bg-surface);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 20px;
		border-radius: 10px;
	}

	.styleshift-config-setting-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.styleshift-config-type-badge {
		font-size: 15px;
		text-transform: uppercase;
		background: var(--theme-0);
		color: white;
		padding: 2px 8px;
		border-radius: 10px;
		width: fit-content;
		font-weight: 800;
		letter-spacing: 0.5px;
	}

	.styleshift-config-title {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--font-color);
		display: flex;
		align-items: center;
		gap: 10px;

		.setting-id {
			font-size: 14px;
			font-weight: 400;
			color: var(--font-color-dim);
		}
	}

	.styleshift-config-tabs {
		display: flex;
		flex-direction: row;
		align-items: center; // Center in Y
		gap: 10px;
	}

	.styleshift-config-main-content {
		flex: 1;
		height: 100%;
		overflow: hidden;
	}

	.styleshift-config-tab-content {
		height: 100%;
		padding: 30px;
		box-sizing: border-box;
		overflow-y: auto;
		background: transparent !important;

		&.logic-tab {
			padding: 0;
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
