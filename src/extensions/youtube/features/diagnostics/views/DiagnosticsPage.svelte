<script lang="ts">
	import { onMount } from "svelte";

	import { createDiagnosticsPageState, DIAGNOSTICS_TABS } from "../diagnosticsPage.svelte";
	import CssView from "./CssView.svelte";
	import LayoutPreview from "./LayoutPreview.svelte";
	import LayoutTree from "./LayoutTree.svelte";
	import SettingsView from "./SettingsView.svelte";

	const viewer = createDiagnosticsPageState();
	let pastedText = $state("");
	let isDragging = $state(false);

	onMount(() => {
		void viewer.loadStoredReport();
	});

	function showPastedText(): void {
		viewer.showReportText(pastedText);
	}

	async function readDroppedFile(file: File | undefined): Promise<void> {
		if (!file) return;
		viewer.showReportText(await file.text());
	}

	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		isDragging = false;
		void readDroppedFile(event.dataTransfer?.files[0]);
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(): void {
		isDragging = false;
	}

	function formatTime(value: string): string {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
	}
</script>

<main class="page">
	<header class="header">
		<h1 class="title">StyleShift diagnostics</h1>
		{#if viewer.report}
			<div class="actions">
				<button class="button" type="button" onclick={() => viewer.copyReportJson()}>Copy JSON</button>
				<button class="button" type="button" onclick={() => viewer.saveReportFile()}>Save file</button>
				<button class="button" type="button" onclick={() => viewer.openInSandbox()}>Open in sandbox</button>
				<button class="button ghost" type="button" onclick={() => viewer.clearReport()}>Load another</button>
			</div>
		{/if}
	</header>

	{#if viewer.notice}
		<p class="notice">{viewer.notice}</p>
	{/if}

	{#if viewer.report}
		{@const report = viewer.report}
		<section class="summary">
			<div>
				<span class="label">Report version</span>
				<span>{report.meta.reportVersion}</span>
			</div>
			<div>
				<span class="label">Generated</span>
				<span>{formatTime(report.meta.generatedAt)}</span>
			</div>
			<div>
				<span class="label">Page mode</span>
				<span>{report.page.mode}</span>
			</div>
			<div>
				<span class="label">Viewport</span>
				<span>{report.environment.viewport.width} x {report.environment.viewport.height}</span>
			</div>
		</section>

		<div class="tabs" role="tablist" aria-label="Report sections">
			{#each DIAGNOSTICS_TABS as tab (tab.id)}
				<button
					type="button"
					role="tab"
					class="tab"
					class:active={viewer.activeTab === tab.id}
					aria-selected={viewer.activeTab === tab.id}
					onclick={() => (viewer.activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="content">
			{#if viewer.activeTab === "layout"}
				<LayoutTree regions={report.layout.regions} />
			{:else if viewer.activeTab === "preview"}
				<LayoutPreview regions={report.layout.regions} />
			{:else if viewer.activeTab === "css"}
				<CssView css={report.css} />
			{:else}
				<SettingsView {report} />
			{/if}
		</div>
	{:else}
		<section class="intro">
			<p>Paste a report JSON or drop a .json file. Nothing is uploaded. The page only reads the text you give it.</p>

			<label class="field">
				<span class="label">Report JSON</span>
				<textarea bind:value={pastedText} rows="8" spellcheck="false" placeholder="Paste the report here"></textarea>
			</label>
			<button class="button" type="button" onclick={showPastedText} disabled={!pastedText.trim()}>Show report</button>

			<div
				class="drop"
				class:dragging={isDragging}
				role="region"
				aria-label="Drop a report file"
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				Drop a .json report here
			</div>
		</section>
	{/if}

	{#if viewer.errorMessage}
		<p class="error" role="alert">{viewer.errorMessage}</p>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		background: var(--bg-main);
		color: var(--font-color);
	}

	.page {
		box-sizing: border-box;
		max-width: 1100px;
		margin: 0 auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-height: 100vh;
		font-family: system-ui, sans-serif;
	}

	.header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.title {
		margin: 0;
		font-size: 22px;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.button {
		padding: 8px 14px;
		border: 1px solid var(--border-color);
		border-radius: 999px;
		background: var(--theme-0);
		color: #ffffff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.button.ghost {
		background: var(--bg-surface);
		color: var(--font-color);
	}

	.notice {
		margin: 0;
		color: var(--font-color-dim);
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 10px;
		padding: 12px;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		background: var(--bg-surface);
	}

	.summary div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.label {
		color: var(--font-color-dim);
		font-size: 12px;
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		border-bottom: 1px solid var(--border-color);
	}

	.tab {
		margin-bottom: -1px;
		padding: 8px 14px;
		border: 1px solid transparent;
		border-bottom: 0;
		border-radius: 8px 8px 0 0;
		background: none;
		color: var(--font-color-dim);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.tab:hover {
		color: var(--font-color);
	}

	.tab.active {
		border-color: var(--border-color);
		background: var(--bg-surface);
		color: var(--font-color);
	}

	.content {
		min-width: 0;
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 720px;
	}

	.intro p {
		margin: 0;
		color: var(--font-color-dim);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 10px;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-input);
		color: var(--font-color);
		font:
			13px ui-monospace,
			monospace;
		resize: vertical;
	}

	.drop {
		padding: 28px 16px;
		border: 2px dashed var(--border-color);
		border-radius: 10px;
		color: var(--font-color-dim);
		text-align: center;
	}

	.drop.dragging {
		border-color: var(--theme-0);
		background: var(--theme-0-10);
	}

	.error {
		margin: 0;
		color: var(--theme-error);
	}
</style>
