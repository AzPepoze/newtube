<script lang="ts">
	import Search from "@base/Search.svelte";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { createAllSettingPresets } from "@settings/registry/defaultItems";
	import {
		filterFunctions,
		groupFunctionsByFile,
		groupKindsByCategory,
		type ApiFunctionDoc,
	} from "../apiReferenceData";
	import { createSidebarResize } from "../sidebarResize.svelte";
	import FunctionsView from "./FunctionsView.svelte";
	import KindsView from "./KindsView.svelte";

	let { entries = [] }: { entries?: ApiFunctionDoc[] } = $props();

	let tab = $state("functions");
	let query = $state("");

	const resize = createSidebarResize();
	const groups = $derived(groupFunctionsByFile(filterFunctions(entries, query)));
	const kindGroups = $derived(groupKindsByCategory(createAllSettingPresets()));
</script>

<div class="api-docs">
	<header class="api-docs-header">
		<CapsuleTabs
			options={[
				{ id: "functions", label: "Functions" },
				{ id: "kinds", label: "Setting Kinds" },
			]}
			bind:activeId={tab}
		/>
		{#if tab === "functions"}
			<div class="api-docs-search">
				<Search bind:value={query} placeholder="Search functions..." />
			</div>
		{/if}
	</header>

	<div class="api-docs-scrollzone">
		{#if tab === "functions"}
			{#if entries.length === 0}
				<p class="api-docs-empty" role="status">Metadata failed to load. Reopen this window to retry.</p>
			{:else if groups.length === 0}
				<p class="api-docs-empty" role="status">No functions match "{query}".</p>
			{:else}
				<FunctionsView {groups} {resize} />
			{/if}
		{:else}
			<KindsView groups={kindGroups} {resize} />
		{/if}
	</div>
</div>

<style lang="scss">
	.api-docs {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 12px;
		color: var(--font-color);
	}

	.api-docs-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.api-docs-search {
		flex: 1;
		min-width: 0;
	}

	.api-docs-scrollzone {
		flex: 1;
		min-height: 300px;
	}

	.api-docs-empty {
		margin: 24px 0;
		color: var(--font-color-dim);
		font-size: 13px;
		text-align: center;
	}
</style>
