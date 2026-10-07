<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import type { Tag } from "@core/theme/parser";
	import { quintOut } from "svelte/easing";
	import { scale } from "svelte/transition";

	let {
		selectedTag = "",
		groupedTags = {},
		onSelect,
	}: {
		selectedTag: string;
		groupedTags: Record<string, Tag[]>;
		onSelect: (tag: string) => void;
	} = $props();

	let isOpen = $state(false);
	let triggerEl = $state<HTMLElement | null>(null);
	let menuEl = $state<HTMLElement | null>(null);

	const currentLabel = $derived(selectedTag || "All Tags");

	function toggleOpen(e: MouseEvent) {
		e.stopPropagation();
		isOpen = !isOpen;
	}

	function handleSelect(tag: string) {
		onSelect(tag);
		isOpen = false;
	}

	$effect(() => {
		if (isOpen) {
			const handleClickOutside = (e: MouseEvent) => {
				if (menuEl && !menuEl.contains(e.target as Node) && triggerEl && !triggerEl.contains(e.target as Node)) {
					isOpen = false;
				}
			};
			window.addEventListener("click", handleClickOutside);
			return () => window.removeEventListener("click", handleClickOutside);
		}
	});
</script>

<div class="grouped-tag-dropdown">
	<button
		bind:this={triggerEl}
		class="dropdown-trigger"
		class:open={isOpen}
		class:has-filter={!!selectedTag}
		onclick={toggleOpen}
		type="button"
	>
		<Icon name="label" size={16} />
		<span class="trigger-label">{currentLabel}</span>
		<Icon name="expand_more" size={16} className="arrow-icon" />
	</button>

	{#if isOpen}
		<div
			bind:this={menuEl}
			class="dropdown-menu styleshift-main"
			transition:scale={{ duration: 200, start: 0.95, opacity: 0, easing: quintOut }}
		>
			<button
				type="button"
				class="dropdown-item option-all"
				class:selected={!selectedTag}
				onclick={() => handleSelect("")}
			>
				<span>All Tags</span>
				{#if !selectedTag}
					<Icon name="check" size={14} />
				{/if}
			</button>

			<div class="divider"></div>

			{#each Object.entries(groupedTags) as [groupName, tags] (groupName)}
				<div class="tag-group">
					<div class="group-header">{groupName}</div>
					<div class="group-items">
						{#each tags as tag (tag.id)}
							{@const isSelected = selectedTag === tag.name}
							<button
								type="button"
								class="dropdown-item"
								class:selected={isSelected}
								onclick={() => handleSelect(tag.name)}
							>
								<span>{tag.name}</span>
								{#if isSelected}
									<Icon name="check" size={14} />
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.grouped-tag-dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 38px;
		padding: 0 14px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 12px;
		color: var(--font-color);
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
		outline: none;
		transition: all 160ms ease;

		&:hover {
			background: var(--fg-opacity-10);
			border-color: var(--fg-opacity-20);
		}

		&.open {
			border-color: var(--theme-0);
			background: var(--fg-opacity-10);

			:global(.arrow-icon) {
				transform: rotate(180deg);
			}
		}

		&.has-filter {
			background: rgba(162, 96, 215, 0.15);
			border-color: var(--theme-0);
			color: var(--theme-0);
		}

		:global(.arrow-icon) {
			transition: transform 200ms ease;
			opacity: 0.7;
		}

		.trigger-label {
			white-space: nowrap;
			max-width: 140px;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 1000;
		min-width: 220px;
		max-height: 320px;
		overflow-y: auto;
		background: var(--bg-main, #141419);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 14px;
		padding: 6px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(16px);

		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--fg-opacity-15);
			border-radius: 4px;
		}
	}

	.divider {
		height: 1px;
		background: var(--fg-opacity-10);
		margin: 4px 0;
	}

	.tag-group {
		margin-bottom: 6px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.group-header {
		padding: 6px 10px 4px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--theme-0, #a260d7);
		opacity: 0.9;
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--font-color-dim, #ccc);
		font-size: 13px;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition: all 140ms ease;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color, #fff);
		}

		&.selected {
			background: var(--fg-opacity-15);
			color: #ffffff;
			font-weight: bold;
		}
	}
</style>
