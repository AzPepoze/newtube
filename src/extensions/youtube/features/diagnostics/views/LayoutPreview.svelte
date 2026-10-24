<script lang="ts">
	import type { LayoutNode } from "../types";
	import { hasLayoutGeometry } from "../viewer/layoutScale";
	import RegionPreview from "./RegionPreview.svelte";

	let { regions }: { regions: Record<string, LayoutNode | null> } = $props();

	function isRegionWithRoot(entry: [string, LayoutNode | null]): entry is [string, LayoutNode] {
		return entry[1] !== null;
	}

	const regionEntries = $derived(Object.entries(regions).filter(isRegionWithRoot));
	const geometryNames = $derived(regionEntries.filter(([, root]) => hasLayoutGeometry(root)).map(([name]) => name));
	const hasGeometry = $derived(Object.values(regions).some(hasLayoutGeometry));
</script>

{#if !hasGeometry}
	<p class="empty">This report has no layout geometry (version 2).</p>
{:else}
	<div class="layout">
		<nav class="nav" aria-label="Preview regions">
			{#each geometryNames as name (name)}
				<a href="#preview-{name}">{name}</a>
			{/each}
		</nav>

		<div class="regions">
			{#each regionEntries as [name, root] (name)}
				<section id="preview-{name}" class="region">
					<h3>{name}</h3>
					<RegionPreview {name} {root} />
				</section>
			{/each}
		</div>
	</div>
{/if}

<style>
	.layout {
		display: grid;
		grid-template-columns: 160px minmax(0, 1fr);
		gap: 24px;
		align-items: start;
	}

	.nav {
		position: sticky;
		top: 16px;
		align-self: start;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.nav a {
		color: var(--font-color-dim);
		text-decoration: none;
	}

	.nav a:hover {
		color: var(--font-color);
	}

	.regions {
		display: flex;
		flex-direction: column;
		gap: 20px;
		min-width: 0;
	}

	.region {
		min-width: 0;
		scroll-margin-top: 16px;
	}

	.region h3 {
		margin: 0 0 10px;
		font-size: 14px;
	}

	@media (max-width: 700px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.nav {
			position: static;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 8px 14px;
		}
	}

	.empty {
		margin: 0;
		color: var(--font-color-dim);
	}
</style>
