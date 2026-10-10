<script lang="ts">
	import SidebarNavItem from "@base/SidebarNavItem.svelte";
	import SidebarHeader from "@base/SidebarHeader.svelte";
	import CodeBlock from "@ui/shared/views/CodeBlock.svelte";
	import ResizeBar from "@ui/shared/views/ResizeBar.svelte";
	import SidebarScrollLayout from "@ui/shared/views/SidebarScrollLayout.svelte";
	import {
		fileLabelFor,
		parseDocTags,
		parseParamBody,
		parseReturnsBody,
		signatureFor,
		type ApiFileGroup,
	} from "../apiReferenceData";
	import type { SidebarResize } from "../sidebarResize.svelte";
	import DocEntry from "./DocEntry.svelte";
	import ParamTable from "./ParamTable.svelte";

	let { groups, resize }: { groups: ApiFileGroup[]; resize: SidebarResize } = $props();

	let activeEntry = $state("");
</script>

<SidebarScrollLayout attribute="data-docs-entry" bind:activeValue={activeEntry} sidebarWidth={resize.width}>
	{#snippet resizer()}
		<ResizeBar onResizeStart={resize.handleResizeStart} onResizeKeys={resize.handleResizeKeys} />
	{/snippet}

	{#snippet sidebar({ scrollTo, activeValue })}
		{#each groups as group (group.file)}
			<SidebarHeader label={fileLabelFor(group.file)} />
			{#each group.functions as fn (fn.label)}
				<SidebarNavItem
					category={fn.label}
					selected={activeValue === `fn:${fn.label}`}
					onSelect={() => scrollTo(`fn:${fn.label}`)}
					flat
				/>
			{/each}
		{/each}
	{/snippet}

	{#each groups as group (group.file)}
		{#each group.functions as fn (fn.label)}
			{@const doc = parseDocTags(fn.info)}
			{@const params = doc.tags.filter((tag) => tag.tag === "@param").map((tag) => parseParamBody(tag.body))}
			{@const returns = doc.tags
				.filter((tag) => tag.tag === "@returns" || tag.tag === "@return")
				.map((tag) => parseReturnsBody(tag.body))}
			<DocEntry anchor={`fn:${fn.label}`} title={fn.label} tag={fileLabelFor(group.file)}>
				{#if doc.summary}
					<p class="doc-summary">{doc.summary}</p>
				{/if}

				<CodeBlock code={signatureFor(fn)} language="javascript" />

				{#if params.length}
					<h3 class="doc-sub">Parameters</h3>
					<ParamTable rows={params} />
				{/if}

				{#if returns.length}
					<h3 class="doc-sub">Returns</h3>
					<ParamTable rows={returns} />
				{/if}

				{#each doc.examples as example, i (`example-${i}`)}
					<h3 class="doc-sub">Example</h3>
					<CodeBlock code={example} language="javascript" tone="accent" />
				{/each}
			</DocEntry>
		{/each}
	{/each}
</SidebarScrollLayout>
