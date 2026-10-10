<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { getAssetUrl } from "@ui/window/utils";
	import WindowControls from "./WindowControls.svelte";

	let {
		title,
		isMaximized,
		onDragStart,
		onMaximize,
		onMinimize,
		onClose,
		topbarChildren,
		showBlurToggle = false,
		blurOff = false,
		onToggleBlur = () => {},
	}: {
		title: string;
		isMaximized: boolean;
		onDragStart: (e: MouseEvent) => void;
		onMaximize: (e: MouseEvent) => void;
		onMinimize: (e: MouseEvent) => void;
		onClose: (e: MouseEvent) => void;
		topbarChildren?: any;
		showBlurToggle?: boolean;
		blurOff?: boolean;
		onToggleBlur?: () => void;
	} = $props();
</script>

<div class="styleshift-window-topbar" onmousedown={onDragStart} ondblclick={onMaximize} role="presentation">
	<div class="styleshift-window-title">
		<img src={getAssetUrl("icon/32.png")} alt="" class="title-icon" />
		<span>{title}</span>
	</div>
	<div class="styleshift-window-topbar-right">
		{#if topbarChildren}
			<div class="topbar-extra">
				{@render topbarChildren()}
			</div>
		{/if}
		{#if showBlurToggle}
			<button
				class="blur-toggle"
				class:active={blurOff}
				onclick={onToggleBlur}
				title={blurOff ? "Turn blur on" : "Turn blur off"}
				aria-pressed={blurOff}
			>
				<Icon name={blurOff ? "blur_off" : "blur_on"} size={16} />
			</button>
		{/if}
		<WindowControls {isMaximized} {onMinimize} {onMaximize} {onClose} />
	</div>
</div>

<style lang="scss">
	.styleshift-window-topbar {
		height: 40px;
		background: var(--bg-overlay-20);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 10px;
		cursor: move;
		user-select: none;
		border-bottom: 1px solid var(--fg-opacity-05);
		flex-shrink: 0;
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
		position: relative;
		z-index: 110;
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s;
	}

	.styleshift-window-topbar-right {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.blur-toggle {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--fg-opacity-60);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: var(--fg-opacity-10);
			color: white;
		}

		&.active {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			color: var(--font-color);
		}
	}

	.topbar-extra {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.styleshift-window-title {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
		font-weight: 600;
		color: var(--fg-opacity-80);
		flex: 1;
		min-width: 0;

		span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.title-icon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}
	}

	:global(.mini) .styleshift-window-topbar {
		height: 32px;
		padding: 0 8px;
		border-top-left-radius: 8px;
		border-top-right-radius: 8px;
	}

	:global(.mini) .styleshift-window-title {
		font-size: 11px;
		gap: 6px;
		.title-icon {
			width: 14px;
			height: 14px;
		}
	}

	:global(.auto-hide-topbar) .styleshift-window-topbar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to bottom, var(--bg-overlay-60), var(--bg-overlay-30), transparent);
		border-bottom: none;
	}
</style>
