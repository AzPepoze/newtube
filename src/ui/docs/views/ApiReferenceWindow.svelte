<script lang="ts">
	import Search from "@base/Search.svelte";
	import Icon from "@base/Icon.svelte";
	import { copyToClipboard } from "@core/shared/extensionHelpers";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import CodeBlock from "@ui/shared/views/CodeBlock.svelte";
	import ResizeBar from "@ui/shared/views/ResizeBar.svelte";
	import SidebarScrollLayout from "@ui/shared/views/SidebarScrollLayout.svelte";
	import CodeEditor from "../../settings/views/base/editor/CodeEditor.svelte";
	import { createAllSettingPresets } from "@settings/registry/defaultItems";
	import {
		fileLabelFor,
		filterFunctions,
		groupFunctionsByFile,
		groupKindsByCategory,
		parseDocTags,
		signatureFor,
		splitSignature,
		splitTagBody,
		verbColorFor,
		verbFor,
		type ApiFunctionDoc,
	} from "../apiReferenceData";
	import SettingRenderer from "../../settings/views/setting/SettingRenderer.svelte";

	let { entries = [] }: { entries?: ApiFunctionDoc[] } = $props();

	let tab = $state("functions");
	let query = $state("");
	let activeEntry = $state("");
	let copiedKind = $state("");
	let sidebarWidth = $state(240);

	function copyKind(kindJson: string, type: string) {
		copyToClipboard(kindJson);
		copiedKind = type;
		window.setTimeout(() => {
			if (copiedKind === type) copiedKind = "";
		}, 1500);
	}

	const filtered = $derived(filterFunctions(entries, query));
	const groups = $derived(groupFunctionsByFile(filtered));

	const kinds = $derived(createAllSettingPresets());
	const kindGroups = $derived(groupKindsByCategory(kinds));

	const MIN_SIDEBAR_WIDTH = 200;
	const MAX_SIDEBAR_WIDTH = 420;

	function handleResizeStart(event: MouseEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = sidebarWidth;
		const onMove = (move: MouseEvent) => {
			sidebarWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, startWidth + move.clientX - startX));
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	function handleResizeKeys(event: KeyboardEvent) {
		if (event.key === "ArrowLeft") sidebarWidth = Math.max(MIN_SIDEBAR_WIDTH, sidebarWidth - 10);
		else if (event.key === "ArrowRight") sidebarWidth = Math.min(MAX_SIDEBAR_WIDTH, sidebarWidth + 10);
	}

	$effect(() => {
		tab;
		query;
		activeEntry = "";
	});
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
			{:else if filtered.length === 0}
				<p class="api-docs-empty" role="status">No functions match "{query}".</p>
			{:else}
				<SidebarScrollLayout attribute="data-docs-entry" bind:activeValue={activeEntry} {sidebarWidth}>
					{#snippet resizer()}
						<ResizeBar onResizeStart={handleResizeStart} onResizeKeys={handleResizeKeys} />
					{/snippet}
					{#snippet sidebar({ scrollTo, activeValue })}
						{#each groups as group (group.file)}
							<div class="api-docs-file">{fileLabelFor(group.file)}</div>
							{#each group.functions as fn (fn.label)}
								{@const verb = verbFor(fn.label)}
								<button
									class="api-docs-item"
									class:active={activeValue === `fn:${fn.label}`}
									onclick={() => scrollTo(`fn:${fn.label}`)}
								>
									{#if verb}<span class="api-docs-verb" style="--verb-color: {verbColorFor(verb)}">{verb}</span>{/if}
									<span>{fn.label}</span>
								</button>
							{/each}
						{/each}
					{/snippet}

					{#each groups as group (group.file)}
						{#each group.functions as fn (fn.label)}
							{@const doc = parseDocTags(fn.info)}
							{@const sig = splitSignature(signatureFor(fn))}
							{@const titleVerb = verbFor(fn.label)}
							<section class="api-docs-section" data-docs-entry={`fn:${fn.label}`}>
								<div class="api-docs-kind-name">
									{#if titleVerb}<span
											class="api-docs-verb api-docs-verb-title"
											style="--verb-color: {verbColorFor(titleVerb)}">{titleVerb}</span
										>{/if}
									<span>{fn.label}</span>
								</div>
								<CodeBlock code={signatureFor(fn)}
									><span class="api-docs-kw">function</span> <span class="api-docs-fn">{sig.name}</span><span
										>{sig.rest}</span
									></CodeBlock
								>
								{#if doc.summary}
									<p class="api-docs-summary">{doc.summary}</p>
								{/if}
								{#if doc.tags.length}
									<dl class="api-docs-tags">
										{#each doc.tags as tag (tag.tag + tag.body)}
											{@const parts = splitTagBody(tag.body)}
											<div class="api-docs-tag-row">
												<dt>{tag.tag}</dt>
												<dd>
													{#if parts.type}<span class="api-docs-type">{parts.type}</span>
													{/if}{parts.text}
												</dd>
											</div>
										{/each}
									</dl>
								{/if}
								{#each doc.examples as example, i (`example-${i}`)}
									<div class="api-docs-example-label">Example</div>
									<CodeBlock code={example} tone="accent">{example}</CodeBlock>
								{/each}
							</section>
						{/each}
					{/each}
				</SidebarScrollLayout>
			{/if}
		{:else}
			<SidebarScrollLayout attribute="data-docs-entry" bind:activeValue={activeEntry} {sidebarWidth}>
				{#snippet resizer()}
					<ResizeBar onResizeStart={handleResizeStart} onResizeKeys={handleResizeKeys} />
				{/snippet}
				{#snippet sidebar({ scrollTo, activeValue })}
					{#each kindGroups as group (group.category)}
						<div class="api-docs-file">{group.category}</div>
						{#each group.kinds as kind (String(kind.type))}
							<button
								class="api-docs-item"
								class:active={activeValue === `kind:${String(kind.type)}`}
								onclick={() => scrollTo(`kind:${String(kind.type)}`)}
							>
								{String(kind.type)}
							</button>
						{/each}
					{/each}
				{/snippet}

				{#each kindGroups as group (group.category)}
					{#each group.kinds as kind (String(kind.type))}
						{@const kindJson = JSON.stringify(kind, null, 2)}
						{@const kindType = String(kind.type)}
						<section class="api-docs-section" data-docs-entry={`kind:${kindType}`}>
							<div class="api-docs-kind-name">{kindType}</div>
							<div class="api-docs-preview">
								<SettingRenderer setting={kind} />
							</div>
							<div class="api-docs-code">
								<button
									class="api-docs-copy"
									class:copied={copiedKind === kindType}
									onclick={() => copyKind(kindJson, kindType)}
									aria-label={copiedKind === kindType ? "Copied to clipboard" : "Copy code to clipboard"}
									title={copiedKind === kindType ? "Copied!" : "Copy"}
								>
									<Icon name={copiedKind === kindType ? "check" : "content_copy"} size={14} />
								</button>
								<CodeEditor value={kindJson} language="json" readOnly height="auto" />
							</div>
						</section>
					{/each}
				{/each}
			</SidebarScrollLayout>
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

	.api-docs-file {
		margin: 10px 0 4px;
		color: var(--font-color-dim);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.api-docs-item {
		width: 100%;
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 8px 10px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--font-color);
		font-family: ui-monospace, monospace;
		font-size: 13px;
		text-align: left;
		cursor: pointer;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}

		&.active {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			color: var(--font-color);
		}
	}

	.api-docs-verb {
		flex: 0 0 auto;
		padding: 2px 8px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--verb-color) 14%, transparent);
		border: 1px solid color-mix(in srgb, var(--verb-color) 40%, transparent);
		color: var(--verb-color);
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}

	.api-docs-verb-title {
		font-size: 11px;
	}

	.api-docs-section {
		padding: 24px 4px 28px;
		border-bottom: 1px solid var(--fg-opacity-10);
		display: flex;
		flex-direction: column;
		gap: 14px;

		&:last-child {
			border-bottom: none;
		}
	}

	.api-docs-kind-name {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: ui-monospace, monospace;
		font-size: 18px;
		font-weight: 700;
		color: var(--font-color);
	}

	.api-docs-kw {
		color: var(--font-color-dim);
	}

	.api-docs-fn {
		color: var(--accent);
		font-weight: 700;
	}

	.api-docs-type {
		margin-right: 6px;
		padding: 1px 7px;
		border-radius: 6px;
		background: var(--theme-0-15);
		border: 1px solid var(--theme-0-30);
		color: var(--theme-0-text);
		font-family: ui-monospace, monospace;
		font-size: 11px;
		white-space: nowrap;
	}

	.api-docs-preview {
		pointer-events: none;
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
	}

	.api-docs-code {
		position: relative;
	}

	.api-docs-copy {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--font-color-dim);
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease,
			border-color 150ms ease;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}

		&.copied {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			border-color: color-mix(in srgb, var(--accent) 50%, transparent);
			color: var(--font-color);
		}
	}

	.api-docs-summary {
		margin: 0;
		max-width: 70ch;
		font-size: 15px;
		line-height: 1.7;
		color: var(--font-color-dim);
	}

	.api-docs-tags {
		margin: 4px 0 0;
		padding: 8px 20px 8px 26px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
		display: flex;
		flex-direction: column;
	}

	.api-docs-tag-row {
		display: grid;
		grid-template-columns: 90px 1fr;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--fg-opacity-08);
		font-size: 14px;
		line-height: 1.6;

		&:last-child {
			border-bottom: none;
		}

		dt {
			font-family: ui-monospace, monospace;
			color: var(--accent);
		}

		dd {
			margin: 0;
			color: var(--font-color-dim);
		}
	}

	.api-docs-example-label {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--font-color-dim);
	}
</style>
