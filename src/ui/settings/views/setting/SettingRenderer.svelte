<script lang="ts">
	import type { Category, Setting } from "@settings/types/styleshiftTypes";
	import { createHoverPreviewConfig, HOVER_PREVIEW_CONTEXT, type HoverPreviewContext } from "@ui/settings/hoverPreview";
	import { onDestroy, setContext } from "svelte";
	import { fade } from "svelte/transition";
	import { addDrag, addDropTarget } from "@ui/settings/reorder";
	import { SETTINGS_SEARCH_QUERY } from "@ui/settings/searchContext";
	import { registerSettingUi, unregisterSettingUi } from "@ui/settings/settingsManager";
	import { getTextAlign } from "@ui/settings/utils";
	import Button from "@controls/Button.svelte";
	import Checkbox from "@controls/Checkbox.svelte";
	import ColorPicker from "@controls/ColorPicker.svelte";
	import Dropdown from "@controls/Dropdown.svelte";
	import ImageInput from "@controls/ImageInput.svelte";
	import PreviewImage from "@controls/PreviewImage.svelte";
	import Selector from "@controls/SelectorInput.svelte";
	import Slider from "@controls/Slider.svelte";
	import Text from "@controls/Text.svelte";
	import TextInput from "@controls/TextInput.svelte";
	import Description from "@base/Description.svelte";
	import Icon from "@base/Icon.svelte";
	import ConditionStatus from "@renderers/condition/ConditionStatus.svelte";
	import WarningSection from "@renderers/warning/WarningSection.svelte";
	import SettingFrame from "@renderers/setting/SettingFrame.svelte";
	import { SettingRendererController } from "../../SettingRendererController.svelte";

	let {
		setting,
		category = undefined,
		highlight = "",
		layout = "list",
	}: {
		setting: Setting;
		category?: Category;
		highlight?: string;
		layout?: "list" | "grid";
	} = $props();

	const controller = $derived(new SettingRendererController(setting));
	let domNode = $state<HTMLElement | null>(null);
	let previewStatus = $state("");
	const previewContext: HoverPreviewContext = {
		resolve: () => createHoverPreviewConfig(setting, category, (status) => (previewStatus = status)),
	};
	setContext(HOVER_PREVIEW_CONTEXT, previewContext);
	setContext(SETTINGS_SEARCH_QUERY, () => highlight);

	const textAlign = $derived(getTextAlign("align" in setting ? setting.align : undefined));
	const isVerticalSetting = $derived(
		setting.type === "numberSlide" ||
			setting.type === "color" ||
			setting.type === "custom" ||
			setting.type === "imageInput" ||
			setting.type === "keyboardShortcuts" ||
			setting.type === "conditionSetting",
	);

	function dragAction(node: HTMLElement) {
		if (controller.isDeveloperMode) {
			addDrag(node, null, null, setting);
		}
	}

	$effect(() => {
		if (controller.isDeveloperMode && domNode && domNode.parentElement) {
			addDropTarget(domNode, domNode.parentElement, setting, "setting");
		}
	});

	const isLocked = $derived(setting.lock?.condition ?? false);

	onDestroy(() => {
		controller.destroy();
		if (setting.id) unregisterSettingUi(setting.id);
	});
</script>

<SettingFrame
	id={setting.id}
	type={setting.type}
	className="{controller.isDeveloperMode ? 'developer-mode' : ''} {isLocked
		? 'styleshift-setting-hard-locked'
		: ''} {!controller.requirementsMet ? 'styleshift-setting-requirement-warning' : ''}"
	style="{controller.isDeveloperMode && setting.type !== 'subText' && setting.type !== 'text'
		? 'gap: 10px;'
		: ''} {isLocked || !controller.requirementsMet ? 'flex-direction: column; align-items: stretch;' : ''}"
	useAction={(node) => {
		domNode = node;
		if (setting.id && node.parentElement) {
			registerSettingUi(setting.id, node.parentElement, node);
		}
	}}
	padding={setting.type !== "button" && setting.type !== "subText"}
	transparent={setting.type === "button" ||
		setting.type === "subText" ||
		setting.type === "text" ||
		(setting.type === "custom" && setting.transparent)}
	vertical={isVerticalSetting}
>
	<div class="styleshift-setting-row-content" class:is-vertical={isVerticalSetting}>
		{#if controller.isDeveloperMode}
			<button class="styleshift-config-button drag-handle" use:dragAction>
				<Icon name="drag" size={16} />
			</button>
		{/if}

		{#if setting.type === "checkbox"}
			<Checkbox {setting} disabled={isLocked} />
		{:else if setting.type === "button"}
			<Button {setting} {layout} showHelpIcon={layout === "grid"} showHoverPreview />
		{:else if setting.type === "numberSlide"}
			<Slider {setting} />
		{:else if setting.type === "textInput"}
			<TextInput {setting} />
		{:else if setting.type === "color"}
			<ColorPicker {setting} />
		{:else if setting.type === "dropdown"}
			<Dropdown {setting} inline />
		{:else if setting.type === "text"}
			<Text html={setting.html} fontSize={setting.fontSize} {textAlign} />
		{:else if setting.type === "subText"}
			<Text
				text={setting.text}
				fontSize={setting.fontSize}
				color={setting.color}
				{textAlign}
				className="styleshift-setting-sub-title"
			/>
		{:else if setting.type === "imageInput"}
			<ImageInput {setting} />
		{:else if setting.type === "previewImage"}
			<PreviewImage
				src={controller.value}
				title={setting.title}
				preset={setting.preset}
				settingIds={setting.settingIds}
			/>
		{:else if setting.type === "custom"}
			<div use:controller.customSettingAction></div>
		{:else if setting.type === "combineSetting"}
			<Description name={setting.name} description={setting.description} />
		{:else if setting.type === "conditionSetting"}
			<div style="display: flex; flex-direction: column; width: 100%; gap: 5px;">
				<Description name={setting.name} description={setting.description} />
				<ConditionStatus
					conditionsMet={controller.conditionsMet}
					condition={setting.condition}
					requiredSettings={controller.requiredSettings}
				/>
			</div>
		{:else if setting.type === "keyboardShortcuts"}
			<div use:controller.keyboardShortcutsAction></div>
		{:else if setting.type === "selectorInput"}
			<Selector {setting} />
		{/if}

		{#if controller.isDeveloperMode || setting.quickCustomize}
			<div class="styleshift-config-actions-overlay">
				{#if setting.quickCustomize}
					<button
						class="styleshift-config-button quick-edit"
						title="Edit in Quick Customize"
						onclick={() => controller.handleQuickEdit()}
					>
						<Icon name="brush" size={16} color="var(--fg-opacity-100)" />
					</button>
				{/if}

				{#if controller.isDeveloperMode}
					<button class="styleshift-config-button edit" onclick={() => controller.handleEdit()}>
						<Icon name="edit" size={16} />
					</button>
				{/if}

				{#if controller.isDeveloperMode || setting.quickCustomize}
					<button
						class="styleshift-config-button delete"
						title="Remove setting"
						onclick={() => controller.handleDelete()}
					>
						<Icon name="delete" size={16} />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<WarningSection
		{isLocked}
		lockMessage={setting.lock?.message}
		requirementsMet={controller.requirementsMet}
		require={setting.require}
		requiredSettings={controller.requiredSettings}
	/>
	{#if previewStatus}
		<div class="styleshift-hover-preview-status" aria-live="polite" transition:fade={{ duration: 160 }}>
			{previewStatus}
		</div>
	{/if}
</SettingFrame>

<style lang="scss">
	.styleshift-setting-row-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		width: 100%;
		position: relative;

		&.is-vertical {
			flex-direction: column;
			align-items: stretch;
		}
	}

	.styleshift-hover-preview-status {
		position: absolute;
		right: 14px;
		bottom: 5px;
		max-width: calc(100% - 28px);
		overflow: hidden;
		color: var(--text-disabled);
		font-size: 10px;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}

	:global(.styleshift-setting-frame.styleshift-setting-hard-locked .styleshift-setting-row-content) {
		pointer-events: none !important;
		opacity: 0.6 !important;
	}

	:global(
		.styleshift-setting-frame.styleshift-setting-requirement-warning:not(.styleshift-setting-hard-locked)
			.styleshift-setting-row-content
	) {
		pointer-events: all;
		opacity: 1;
	}
</style>
