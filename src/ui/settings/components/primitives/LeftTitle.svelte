<script lang="ts">
	import type { CategoryNameWithIcon } from "@settings/types/styleshiftTypes";
	import Icon from "@ui/settings/components/primitives/Icon.svelte";
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
	{#if isDeveloperMode && !isHeader && editable}
		<div class="styleshift-sidebar-controls">
			<button class="styleshift-sidebar-control-btn drag-handle" title="Drag to reorder">
				<Icon name="drag" size={14} />
			</button>
			<div class="styleshift-sidebar-arrows">
				<button
					class="styleshift-sidebar-control-btn arrow"
					onclick={(e) => {
						e.stopPropagation();
						onMove?.("up");
					}}
					title="Move Up"
				>
					<Icon name="arrowUp" size={12} />
				</button>
				<button
					class="styleshift-sidebar-control-btn arrow"
					onclick={(e) => {
						e.stopPropagation();
						onMove?.("down");
					}}
					title="Move Down"
				>
					<Icon name="arrowDown" size={12} />
				</button>
			</div>
		</div>
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
			padding-right: 45px; // Reserve space for hover controls
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
			background: white;
			margin-left: 0px;
			color: black;
			box-shadow: 0 4px 15px var(--bg-overlay-20);

			.styleshift-left-category-icon {
				transform: scale(1.3) rotate(10deg);
				filter: drop-shadow(0 0 5px var(--bg-overlay-40));
				color: black !important;
				opacity: 1;

				:global(.styleshift-icon) {
					filter: none !important;
				}
			}

			.styleshift-left-category-text {
				font-weight: 700;
				color: black;
			}
		}

		&:hover:not(.selected):not(.is-header) {
			background: var(--fg-opacity-10);
			margin-left: 5px;
			color: white;
		}

		&:active:not(.is-header) {
			scale: 0.95;
		}

		&.is-new {
			animation: styleshift-new-category-pop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		}

		&:hover {
			.styleshift-sidebar-controls {
				opacity: 1;
			}
		}
	}

	.styleshift-sidebar-controls {
		display: flex;
		align-items: center;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s;
		position: absolute;
		right: 10px;
		background: var(--fg-opacity-10);
		padding: 2px 4px;
		border-radius: 8px;
		backdrop-filter: blur(5px);
		z-index: 10;
	}

	.styleshift-sidebar-arrows {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.styleshift-sidebar-control-btn {
		background: transparent;
		border: none;
		color: var(--fg-opacity-60);
		cursor: pointer;
		padding: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;

		&:hover {
			background: var(--fg-opacity-20);
			color: var(--fg-opacity-100);
		}

		&.drag-handle {
			cursor: grab;
		}

		&.arrow {
			padding: 0;
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
		font-weight: 500;
		font-size: 14px;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
