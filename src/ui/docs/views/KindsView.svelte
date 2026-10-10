<script lang="ts">
	import SidebarNavItem from "@base/SidebarNavItem.svelte";
	import SidebarHeader from "@base/SidebarHeader.svelte";
	import CodeBlock from "@ui/shared/views/CodeBlock.svelte";
	import ResizeBar from "@ui/shared/views/ResizeBar.svelte";
	import SidebarScrollLayout from "@ui/shared/views/SidebarScrollLayout.svelte";
	import SettingRenderer from "@ui/settings/views/setting/SettingRenderer.svelte";
	import type { ApiKindGroup } from "../apiReferenceData";
	import type { SidebarResize } from "../sidebarResize.svelte";
	import { openKindJson } from "../playground.svelte";
	import DocEntry from "./DocEntry.svelte";
	import DocsRail from "./DocsRail.svelte";

	let { groups, resize }: { groups: ApiKindGroup<any>[]; resize: SidebarResize } = $props();

	let activeEntry = $state("");
	let contentEl: HTMLElement | null = $state(null);
</script>

<div class="docs-view">
	<SidebarScrollLayout
		attribute="data-docs-entry"
		bind:activeValue={activeEntry}
		bind:contentEl
		sidebarWidth={resize.width}
		indicator
	>
		{#snippet resizer()}
			<ResizeBar onResizeStart={resize.handleResizeStart} onResizeKeys={resize.handleResizeKeys} />
		{/snippet}

		{#snippet sidebar({ scrollTo, activeValue })}
			{#each groups as group (group.category)}
				<SidebarHeader label={group.category} />
				{#each group.kinds as kind (String(kind.type))}
					<SidebarNavItem
						category={String(kind.type)}
						selected={activeValue === `kind:${String(kind.type)}`}
						onSelect={() => scrollTo(`kind:${String(kind.type)}`)}
						flat
					/>
				{/each}
			{/each}
		{/snippet}

		{#each groups as group (group.category)}
			{#each group.kinds as kind (String(kind.type))}
				{@const kindType = String(kind.type)}
				{@const kindJson = JSON.stringify(kind, null, 2)}
				<DocEntry anchor={`kind:${kindType}`} title={kindType} tag={group.category}>
					<h3 class="doc-sub">Preview</h3>
					<div class="doc-preview">
						<SettingRenderer setting={kind} />
					</div>

					<h3 class="doc-sub">Schema</h3>
					<CodeBlock code={kindJson} language="json" tryLabel="Try this schema" onTry={() => openKindJson(kindJson)} />
				</DocEntry>
			{/each}
		{/each}
	</SidebarScrollLayout>
	<DocsRail container={contentEl} {activeEntry} />
</div>

<style lang="scss">
	.docs-view {
		position: relative;
		height: 100%;
	}
</style>
