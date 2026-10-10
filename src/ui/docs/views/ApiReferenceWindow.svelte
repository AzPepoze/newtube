<script lang="ts">
	import Search from "@base/Search.svelte";
	import Icon from "@base/Icon.svelte";
	import ResizeBar from "@ui/shared/views/ResizeBar.svelte";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { createAllSettingPresets } from "@settings/registry/defaultItems";
	import {
		filterFunctions,
		groupFunctionsByFile,
		groupKindsByCategory,
		type ApiFunctionDoc,
	} from "../apiReferenceData";
	import { playground, type PlaygroundMode } from "../playground.svelte";
	import { createSidebarResize } from "../sidebarResize.svelte";
	import FunctionsView from "./FunctionsView.svelte";
	import KindsView from "./KindsView.svelte";
	import PlaygroundPanel from "./PlaygroundPanel.svelte";

	let { entries = [] }: { entries?: ApiFunctionDoc[] } = $props();

	let tab = $state<PlaygroundMode>("functions");
	let query = $state("");

	const resize = createSidebarResize();
	const panelResize = createSidebarResize(380, { min: 280, max: 640, fromRight: true });
	const groups = $derived(groupFunctionsByFile(filterFunctions(entries, query)));
	const kindGroups = $derived(groupKindsByCategory(createAllSettingPresets()));

	// The playground shows the editor for whichever tab is open.
	$effect(() => {
		playground.mode = tab;
	});

	function togglePlayground() {
		playground.open = !playground.open;
	}
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
		<button
			class="playground-toggle"
			class:on={playground.open}
			onclick={togglePlayground}
			aria-pressed={playground.open}
			title={playground.open ? "Hide playground" : "Show playground"}
		>
			<Icon name="terminal" size={16} />
			<span>Playground</span>
		</button>
	</header>

	<div class="api-docs-body">
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

		{#if playground.open}
			<ResizeBar
				label="Resize playground"
				hint="Drag to resize playground"
				onResizeStart={panelResize.handleResizeStart}
				onResizeKeys={panelResize.handleResizeKeys}
			/>
			<aside class="api-docs-playground" style:width="{panelResize.width}px">
				<PlaygroundPanel />
			</aside>
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

	.playground-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		margin-left: auto;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-05);
		color: var(--font-color-dim);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}

		&.on {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			border-color: color-mix(in srgb, var(--accent) 50%, transparent);
			color: var(--font-color);
		}
	}

	.api-docs-body {
		flex: 1;
		display: flex;
		min-height: 300px;
		min-width: 0;
	}

	.api-docs-scrollzone {
		flex: 1;
		min-width: 0;
	}

	.api-docs-playground {
		flex-shrink: 0;
		min-width: 0;
	}

	.api-docs-empty {
		margin: 24px 0;
		color: var(--font-color-dim);
		font-size: 13px;
		text-align: center;
	}
</style>
