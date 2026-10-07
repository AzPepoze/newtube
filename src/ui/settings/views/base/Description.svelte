<script lang="ts">
	import { getAssetUrl } from "@ui/window/utils";
	import { HOVER_PREVIEW_CONTEXT, hoverPreview, type HoverPreviewContext } from "@ui/settings/hoverPreview";
	import { SETTINGS_SEARCH_QUERY } from "@ui/settings/searchContext";
	import type { Snippet } from "svelte";
	import { getContext } from "svelte";
	import { getFlexAlign, getTextAlign } from "../../utils";
	import Icon from "./Icon.svelte";
	import HighlightedText from "./HighlightedText.svelte";

	let {
		name = "",
		description = "",
		text = "",
		style = "",
		align = "",
		showHoverPreview = true,
		children,
	}: {
		name?: string;
		description?: string;
		text?: string;
		style?: string;
		align?: "left" | "center" | "right" | "";
		showHoverPreview?: boolean;
		children?: Snippet;
	} = $props();

	const textAlign = $derived(getTextAlign(align));
	const flexAlign = $derived(getFlexAlign(align));
	const previewContext = getContext<HoverPreviewContext | undefined>(HOVER_PREVIEW_CONTEXT);
	const previewConfig = $derived(showHoverPreview ? previewContext?.resolve() : null);
	const getSearchQuery = getContext<() => string | undefined>(SETTINGS_SEARCH_QUERY);
	const searchQuery = $derived(getSearchQuery?.() ?? "");

	function suppressPreviewActivation(event: Event) {
		event.preventDefault();
		event.stopPropagation();
	}
</script>

<div
	class="styleshift-main-description"
	class:no-description={!description && !children && !text}
	style:text-align={textAlign}
	style:align-items={flexAlign}
	{style}
>
	{#if name}
		<div class="setting-name" style:justify-content={flexAlign}>
			{#if name.includes(".svg") || name.includes("data:image/svg+xml") || name.startsWith("chrome-extension://")}
				<Icon name={getAssetUrl(name)} size={20} className="styleshift-description-icon" applyFilter={true} />
			{:else}<HighlightedText text={name} query={searchQuery} />{/if}
			{#if previewConfig}
				<button
					type="button"
					class="styleshift-hover-preview-button"
					title="Preview affected elements"
					aria-label="Preview affected elements"
					use:hoverPreview={previewConfig}
					onclick={suppressPreviewActivation}
					onkeydown={suppressPreviewActivation}
					onkeypress={suppressPreviewActivation}
					onkeyup={suppressPreviewActivation}
				>
					<Icon name="select_all" size={22} />
				</button>
			{/if}
		</div>
	{/if}
	{#if description}
		<div class="setting-description"><HighlightedText text={description} query={searchQuery} /></div>
	{/if}
	{#if text}<HighlightedText {text} query={searchQuery} />{/if}
	{#if children}
		{@render children()}
	{/if}
</div>

<style lang="scss">
	.styleshift-main-description {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-wrap: wrap;
		font-size: 17px;
		white-space: break-spaces;
		color: var(--font-color);

		&.no-description {
			justify-content: center;
		}
	}

	.setting-name {
		font-weight: 500;
		user-select: text;
		display: flex;
		align-items: center;
		gap: 7px;

		:global(.styleshift-description-icon) {
			filter: brightness(0) invert(1);
		}
	}

	.styleshift-hover-preview-button {
		width: 26px;
		height: 26px;
		flex: 0 0 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 0;
		border-radius: 3px;
		background: transparent;
		color: var(--text-disabled, currentColor);
		opacity: 0.7;
		cursor: pointer;
		pointer-events: auto;
		transition:
			opacity 120ms ease,
			background-color 120ms ease,
			box-shadow 120ms ease;

		&:hover,
		&:focus-visible {
			background: color-mix(in srgb, currentColor 16%, transparent);
			box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 22%, transparent);
			opacity: 1;
			outline: none;
		}
	}

	.setting-description {
		font-size: 12px;
		opacity: 0.6;
		user-select: text;
	}
</style>
