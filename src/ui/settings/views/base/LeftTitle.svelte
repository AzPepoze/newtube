<script lang="ts">
	import type { CategoryNameWithIcon } from "@settings/types/styleshiftTypes";
	import Icon from "@base/Icon.svelte";
	import { getCategoryParts } from "@ui/window/utils";
	import { onMount } from "svelte";

	let {
		category = "" as string | CategoryNameWithIcon,
		isHeader = false,
		separator = false,
		isNew = false,
		selected = false,
		isDeveloperMode = false,
		editable = false,
		onMove = null as ((direction: "up" | "down") => void) | null,
	} = $props();
	let titleEl: HTMLDivElement = $state(null!);

	let parts = $derived(getCategoryParts(category as any));
	let showControls = $derived(isDeveloperMode && !isHeader && editable);

	onMount(() => {
		if (titleEl && isNew) {
			titleEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	});
</script>

<div
	bind:this={titleEl}
	class="styleshift-left-category-title"
	class:is-header={isHeader}
	class:is-new={isNew}
	class:has-separator={separator}
	class:selected
	class:is-editable={editable}
	data-is-header={isHeader}
	data-is-new={isNew}
>
	{#if showControls}
		<button class="styleshift-sidebar-control drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
			<Icon name="drag" size={16} />
		</button>
	{/if}

	{#if isHeader}
		<div class="styleshift-left-header-text">
			{parts.text}
		</div>
	{:else}
		{#if parts.icon}
			<span class="styleshift-left-category-icon">
				<Icon name={parts.icon} size={18} />
			</span>
		{/if}
		<div class="styleshift-left-category-text">
			{parts.text}
		</div>
	{/if}

	{#if showControls}
		<div class="styleshift-sidebar-arrows">
			<button
				class="styleshift-sidebar-control"
				onclick={(e) => {
					e.stopPropagation();
					onMove?.("up");
				}}
				title="Move up"
				aria-label="Move up"
			>
				<Icon name="arrowUp" size={16} />
			</button>
			<button
				class="styleshift-sidebar-control"
				onclick={(e) => {
					e.stopPropagation();
					onMove?.("down");
				}}
				title="Move down"
				aria-label="Move down"
			>
				<Icon name="arrowDown" size={16} />
			</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.styleshift-left-category-title {
		display: flex;
		align-items: center;
		padding: 12px 15px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 20px;
		gap: 12px;
		position: relative;
		margin-block: -10px;
		margin-left: 10px;
		color: var(--fg-opacity-80);

		&.is-editable {
			padding-right: 8px;
		}

		&.has-separator {
			margin-top: 15px;
			&::before {
				content: "";
				position: absolute;
				top: -10px;
				left: 10px;
				right: 10px;
				height: 1px;
				background: var(--fg-opacity-10);
			}
		}

		&.is-header {
			cursor: default;
			margin-left: 0;
			padding-block: 10px;
			color: var(--fg-opacity-40);
			font-size: 11px;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 1.5px;
			pointer-events: none;
			background: transparent !important;

			.styleshift-left-header-text {
				padding-left: 10px;
			}
		}

		&:not(.is-header).selected {
			background: var(--sidebar-selected-bg);
			margin-left: 0px;
			color: var(--sidebar-selected-fg);
			box-shadow: 0 4px 15px var(--bg-overlay-20);

			.styleshift-left-category-icon {
				transform: scale(1.3) rotate(10deg);
				filter: drop-shadow(0 0 5px var(--bg-overlay-40));
				color: var(--sidebar-selected-fg) !important;
				opacity: 1;

				:global(.styleshift-icon) {
					filter: none !important;
				}
			}

			.styleshift-left-category-text {
				font-weight: 700;
				color: var(--sidebar-selected-fg);
			}

			.styleshift-sidebar-control {
				background: var(--sidebar-selected-control-bg);
				color: var(--sidebar-selected-control-fg);

				&:hover {
					background: var(--sidebar-selected-control-bg-hover);
					color: var(--sidebar-selected-control-fg);
				}
			}
		}

		&:hover:not(.selected):not(.is-header) {
			background: var(--fg-opacity-10);
			margin-left: 5px;
			color: var(--font-color);
		}

		&:hover,
		&:focus-within {
			.styleshift-sidebar-control,
			.styleshift-sidebar-arrows {
				display: flex;
				animation: styleshift-sidebar-controls-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) both;
			}
		}

		&:active:not(.is-header) {
			scale: 0.95;
		}

		&.is-new {
			animation: styleshift-new-category-pop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		}
	}

	.styleshift-sidebar-control {
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		display: none;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 9px;
		background: var(--fg-opacity-10);
		color: var(--fg-opacity-80);
		cursor: pointer;
		transition:
			background 0.2s ease,
			transform 0.15s ease;

		&:hover {
			background: var(--fg-opacity-20);
			color: var(--fg-opacity-100);
		}

		&:active {
			transform: scale(0.92);
		}

		&.drag-handle {
			cursor: grab;
		}
	}

	.styleshift-sidebar-arrows {
		display: none;
		gap: 6px;
		margin-left: auto;
	}

	@keyframes styleshift-sidebar-controls-in {
		from {
			opacity: 0;
			transform: translateX(6px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes styleshift-new-category-pop {
		0% {
			transform: scale(0.8);
			background: var(--theme-0);
			color: white;
		}
		50% {
			transform: scale(1.1);
			background: var(--theme-0);
			color: white;
		}
		100% {
			transform: scale(1);
		}
	}

	.styleshift-left-category-icon {
		font-size: 18px;
		transition: transform 0.3s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		filter: drop-shadow(0 0 5px var(--bg-overlay-20));
	}

	.styleshift-left-category-text {
		flex: 1;
		font-weight: 500;
		font-size: 14px;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
