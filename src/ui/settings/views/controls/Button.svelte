<script lang="ts">
	import { executeSettingScript } from "@core/runtime/controller";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { getJustifyContent } from "../../utils";
	import Description from "../base/Description.svelte";
	import Icon from "../base/Icon.svelte";

	let {
		setting,
		style = "",
		class: className = "",
		showHelpIcon = false,
		showHoverPreview = false,
		iconSize = undefined,
		fontSize = undefined,
		variant = "default",
		layout = "list",
	}: {
		setting: Extract<Setting, { type: "button" }>;
		style?: string;
		class?: string;
		showHelpIcon?: boolean;
		showHoverPreview?: boolean;
		iconSize?: number;
		fontSize?: number;
		variant?: "default" | "subtle" | "ghost";
		layout?: "list" | "grid";
	} = $props();

	const name = $derived(setting.name);
	const description = $derived(setting.description);
	const icon = $derived(setting.icon);
	const finalIconSize = $derived(iconSize !== undefined ? iconSize : setting.iconSize || 50);
	const iconScale = $derived(setting.iconScale || 1);
	const color = $derived(setting.color || "#ffffff");
	const align = $derived(setting.align || "center");
	const finalFontSize = $derived(fontSize !== undefined ? fontSize : setting.fontSize || 15);
	const justifyContent = $derived(getJustifyContent(align));

	let scale = $state(1);
	let isHelpVisible = $state(false);
	let helpTrigger = $state<HTMLDivElement>();
	let helpTooltipSide = $state<"left" | "right">("left");

	function handleClick(_e: MouseEvent | KeyboardEvent) {
		scale = 0.95;
		setTimeout(() => (scale = 1), 100);

		if (!setting.clickFunction) return;

		if (typeof setting.clickFunction === "string") {
			executeSettingScript(setting, "clickFunction");
		} else {
			setting.clickFunction();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleClick(e);
		}
	}

	function showHelp() {
		const triggerRect = helpTrigger?.getBoundingClientRect();
		const groupRect = helpTrigger?.closest(".styleshift-settings-group")?.getBoundingClientRect();

		if (triggerRect) {
			const bounds = groupRect ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
			const tooltipWidth = 224;
			const gap = 8;
			const spaceOnLeft = triggerRect.left - bounds.left;
			const spaceOnRight = bounds.right - triggerRect.right;

			helpTooltipSide = spaceOnRight >= tooltipWidth + gap || spaceOnRight > spaceOnLeft ? "right" : "left";
		}
		isHelpVisible = true;
	}

	function hideHelp() {
		isHelpVisible = false;
	}

	function handleHelpKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			e.stopPropagation();
			if (isHelpVisible) hideHelp();
			else showHelp();
		}
	}
</script>

<div
	class="styleshift-button variant-{variant} layout-{layout} {className}"
	class:has-icon={!!icon}
	class:help-visible={isHelpVisible}
	style:justify-content={justifyContent}
	style:transform="scale({scale})"
	style:--btn-color={color}
	{style}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	role="button"
	tabindex="0"
>
	{#if icon}
		<Icon name={icon} size={finalIconSize} scale={iconScale} className="styleshift-button-icon" applyFilter={false} />
	{/if}

	<Description
		{name}
		description={showHelpIcon ? "" : description}
		{align}
		style="display: flex; color: inherit; font-size: {finalFontSize}px;"
		{showHoverPreview}
	/>

	{#if showHelpIcon && description}
		<div
			class="help-trigger"
			bind:this={helpTrigger}
			onmouseenter={showHelp}
			onmouseleave={hideHelp}
			onclick={(e) => e.stopPropagation()}
			onkeydown={handleHelpKeyDown}
			role="button"
			tabindex="0"
		>
			<Icon name="help_outline" size={20} />
			{#if isHelpVisible}
				<div
					class="styleshift-tooltip"
					class:tooltip-left={helpTooltipSide === "left"}
					class:tooltip-right={helpTooltipSide === "right"}
				>
					{description}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.styleshift-button {
		--btn-color-top: color-mix(in srgb, color-mix(in srgb, var(--btn-color, #ffffff) 85%, white) 50%, transparent);
		--btn-color-bottom: color-mix(in srgb, color-mix(in srgb, var(--btn-color, #ffffff) 90%, white) 10%, transparent);
		--btn-border-color: color-mix(in srgb, var(--btn-color, #ffffff) 40%, white);

		display: flex;
		align-items: center;
		font-size: 15px;
		transition: all 0.2s;
		user-select: none;
		width: -webkit-fill-available;
		flex-direction: row;
		padding: 20px;
		border-radius: 20px;
		cursor: pointer;
		position: relative;
		box-sizing: border-box;

		background-image: radial-gradient(at center top, var(--btn-color-top), var(--btn-color-bottom));

		border: 1px solid var(--btn-border-color);
		color: var(--btn-border-color);
	}

	:global(.styleshift-icon.styleshift-button-icon) {
		margin-right: 12px;
		object-fit: contain;
	}

	.styleshift-button:hover {
		filter: drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.5));

		:global(.styleshift-main-description .setting-name) {
			font-weight: 400;
		}
	}

	.styleshift-button.help-visible {
		z-index: 10;
	}

	@container settings-group (min-width: 520px) {
		.layout-grid {
			flex-direction: column;
			justify-content: center !important;
			gap: 12px;
			min-height: 140px;
			height: 100%;
			padding: 20px 12px;

			:global(.styleshift-icon.styleshift-button-icon) {
				margin-right: 0;
			}

			:global(.styleshift-main-description) {
				align-items: center !important;
				text-align: center !important;
				flex: 0;
			}

			:global(.styleshift-main-description .setting-name) {
				justify-content: center !important;
			}

			:global(.styleshift-main-description .setting-description) {
				display: none;
			}

			.help-trigger {
				position: absolute;
				top: 8px;
				right: 8px;
				margin-left: 0;
			}

			.styleshift-tooltip {
				top: 50%;
				bottom: auto;
				transform: translateY(-50%);
			}
		}
	}

	.variant-subtle {
		background: var(--fg-opacity-05);
		border-color: var(--fg-opacity-10);
		color: var(--fg-opacity-70);

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color, white);
			filter: none;
		}
	}

	.variant-ghost {
		background: transparent;
		border-color: transparent;
		color: var(--fg-opacity-50);

		&:hover {
			background: var(--fg-opacity-05);
			color: var(--font-color, white);
			filter: none;
		}
	}

	.help-trigger {
		margin-left: 10px;
		opacity: 0.5;
		transition: opacity 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px;
		border-radius: 50%;
		position: relative;

		&:hover {
			opacity: 1;
			background: var(--surface-hover);
		}
	}

	.styleshift-tooltip {
		position: absolute;
		top: 50%;
		background: var(--bg-main);
		border: 1px solid var(--border-subtle);
		padding: 8px 12px;
		border-radius: 8px;
		font-size: 12px;
		color: var(--text-primary);
		width: 200px;
		box-shadow: 0 4px 15px var(--shadow-strong);
		z-index: 100;
		pointer-events: none;
		animation: tooltipFadeIn 180ms cubic-bezier(0.22, 1, 0.36, 1);
		white-space: break-spaces;
		line-height: 1.4;
		text-align: left;
		transform: translateY(-50%);

		&.tooltip-left {
			right: calc(100% + 8px);
		}

		&.tooltip-right {
			left: calc(100% + 8px);
		}

		&::after {
			content: "";
			position: absolute;
			top: 50%;
			border: 6px solid transparent;
			transform: translateY(-50%);
		}

		&.tooltip-left::after {
			left: 100%;
			border-left-color: var(--bg-main);
		}

		&.tooltip-right::after {
			right: 100%;
			border-right-color: var(--bg-main);
		}
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: translateY(calc(-50% + 6px));
		}
		to {
			opacity: 1;
			transform: translateY(-50%);
		}
	}
</style>
