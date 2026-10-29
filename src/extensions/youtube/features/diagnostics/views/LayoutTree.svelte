<script lang="ts">
	import type { LayoutNode } from "../types";
	import { describeNode } from "../viewer/nodeLabel";
	import { filterLayoutNode } from "../viewer/layoutSearch";

	let { regions }: { regions: Record<string, LayoutNode | null> } = $props();
	let query = $state("");

	const regionEntries = $derived(
		Object.entries(regions).map(([name, root]) => ({
			name,
			root: root ? filterLayoutNode(root, query) : null,
		})),
	);
</script>

{#snippet branch(node: LayoutNode, depth: number)}
	{#if node.children?.length}
		<details class="branch" open={Boolean(query) || depth < 2}>
			<summary class="row">{@render label(node)}</summary>
			<div class="children">
				{#each node.children as child (child)}
					{@render branch(child, depth + 1)}
				{/each}
			</div>
		</details>
	{:else}
		<div class="row leaf">{@render label(node)}</div>
	{/if}
{/snippet}

{#snippet label(node: LayoutNode)}
	<span class="tag">{describeNode(node)}</span>
	{#if node.role}<span class="meta">role="{node.role}"</span>{/if}
	{#if node.ariaLabel}<span class="meta">aria-label="{node.ariaLabel}"</span>{/if}
{/snippet}

<div class="tree">
	<label class="search">
		<span class="visually-hidden">Search nodes</span>
		<input type="search" placeholder="Search tag, id, class, role or aria-label" bind:value={query} />
	</label>

	{#each regionEntries as entry (entry.name)}
		<section class="region">
			<h2 class="region-title">{entry.name}</h2>
			{#if entry.root}
				{@render branch(entry.root, 0)}
			{:else if regions[entry.name]}
				<p class="empty">No matching nodes.</p>
			{:else}
				<p class="empty">Not found on this page.</p>
			{/if}
		</section>
	{/each}
</div>

<style>
	.tree {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.search input {
		box-sizing: border-box;
		width: 100%;
		padding: 8px 10px;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-input);
		color: var(--font-color);
		font: inherit;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.region {
		padding: 10px 12px;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		background: var(--bg-surface);
		min-width: 0;
	}

	.region-title {
		margin: 0 0 6px;
		font-size: 15px;
	}

	.children {
		margin-left: 14px;
		padding-left: 8px;
		border-left: 1px solid var(--border-color);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px;
		padding: 3px 0;
		font:
			13px ui-monospace,
			monospace;
		overflow-wrap: anywhere;
		cursor: pointer;
	}

	.leaf {
		cursor: default;
		margin-left: 14px;
	}

	.tag {
		color: var(--theme-0-text);
	}

	.meta {
		color: var(--font-color-dim);
	}

	.empty {
		margin: 0;
		color: var(--font-color-dim);
		font-size: 13px;
	}
</style>
