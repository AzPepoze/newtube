<script lang="ts">
	import { collectDiagnosticsReport } from "@extensions/youtube/features/diagnostics/collect";
	import { measureTextBytes } from "@extensions/youtube/features/diagnostics/css";
	import { copyDiagnosticsToClipboard, exportDiagnosticsFile } from "@extensions/youtube/features/diagnostics/export";
	import { applyDiagnosticsSettings, parseDiagnosticsReport } from "@extensions/youtube/features/diagnostics/replay";
	import type { DiagnosticsReport } from "@extensions/youtube/features/diagnostics/types";
	import { logger } from "@shared/logger";
	import Icon from "@base/Icon.svelte";
	import { showUserConfirmation } from "@ui/window/windowFactory";
	import { onDestroy } from "svelte";

	let report = $state<DiagnosticsReport | null>(null);
	let collecting = $state(false);
	let exportStatus = $state<"idle" | "copied" | "exported" | "error">("idle");
	let importStatus = $state<"idle" | "imported" | "error">("idle");
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	function sectionSize(section: unknown): number {
		return measureTextBytes(JSON.stringify(section) ?? "");
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		return `${(bytes / 1024).toFixed(1)} kB`;
	}

	function countRegions(report: DiagnosticsReport): number {
		return Object.values(report.layout.regions).filter((region) => region !== null).length;
	}

	function countMatchedSelectors(report: DiagnosticsReport): number {
		return Object.values(report.selectors).filter((count) => count > 0).length;
	}

	const sections = $derived(
		report
			? [
					{
						id: "meta",
						label: "Meta",
						summary: `report v${report.meta.reportVersion}`,
						size: sectionSize(report.meta),
					},
					{
						id: "environment",
						label: "Environment",
						summary: `${report.environment.colorScheme} · ${report.environment.viewport.width}×${report.environment.viewport.height}`,
						size: sectionSize(report.environment),
					},
					{
						id: "page",
						label: "Page",
						summary: `${report.page.mode} · ${report.page.queryParamNames.length} query params`,
						size: sectionSize(report.page),
					},
					{
						id: "settings",
						label: "Settings",
						summary: `${Object.keys(report.settings.currentSettings).length} settings · ${report.settings.addOnStyleShiftItems.length} custom categories`,
						size: sectionSize(report.settings),
					},
					{
						id: "layout",
						label: "Layout",
						summary: `${countRegions(report)} regions · ${report.layout.nodeCount} nodes${report.layout.truncated ? " (truncated)" : ""}`,
						size: sectionSize(report.layout),
					},
					{
						id: "css",
						label: "CSS",
						summary: `${report.css.stylesheetCount} stylesheets · ${formatBytes(report.css.injectedBytes)}`,
						size: sectionSize(report.css),
					},
					{
						id: "selectors",
						label: "Selectors",
						summary: `${countMatchedSelectors(report)} matched`,
						size: sectionSize(report.selectors),
					},
				]
			: [],
	);

	onDestroy(() => clearTimeout(resetTimer));

	function scheduleReset() {
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (exportStatus = "idle"), 3000);
	}

	async function handleCollect() {
		collecting = true;
		try {
			report = await collectDiagnosticsReport();
		} catch (error) {
			logger.error("diagnostics", "Failed to build diagnostics preview", error);
		} finally {
			collecting = false;
		}
	}

	async function handleCopy() {
		const copied = await copyDiagnosticsToClipboard();
		exportStatus = copied ? "copied" : "error";
		scheduleReset();
	}

	async function handleExport() {
		const exported = await exportDiagnosticsFile();
		exportStatus = exported ? "exported" : "error";
		scheduleReset();
	}

	async function handleImportFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;

		try {
			const parsed = parseDiagnosticsReport(await file.text());
			const confirmed = await showUserConfirmation(
				`This replaces your current settings and custom items with the ones captured in "${file.name}". Continue?`,
				"Import settings from diagnostics",
				{ confirmLabel: "Apply settings", confirmColor: "var(--theme-0)" },
			);
			if (!confirmed) return;
			await applyDiagnosticsSettings(parsed);
			importStatus = "imported";
		} catch (error) {
			logger.error("diagnostics", "Failed to import settings from a diagnostics file", error);
			importStatus = "error";
		}
	}
</script>

<div class="diagnostics-panel">
	<div class="diagnostics-heading">
		<Icon name="bug_report" size={18} />
		<span>Diagnostics v2</span>
	</div>

	<p class="diagnostics-intro">
		Collects a full JSON snapshot of your layout, injected CSS and complete settings so a bug can be replayed. It is
		collected only when you click the button, stays on your machine, and never includes video titles, comments or
		account details. The page URL is stored as origin + pathname only.
	</p>

	<button class="diagnostics-collect-button" onclick={handleCollect} disabled={collecting}>
		<Icon name="bug_report" size={16} />
		{collecting ? "Collecting…" : report ? "Recollect snapshot" : "Collect snapshot"}
	</button>

	{#if report}
		<ul class="diagnostics-sections">
			{#each sections as section (section.id)}
				<li class="diagnostics-section">
					<span class="section-label">{section.label}</span>
					<span class="section-summary">{section.summary}</span>
					<span class="section-size">{formatBytes(section.size)}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="diagnostics-empty">No snapshot collected yet.</p>
	{/if}

	<div class="diagnostics-actions">
		<button class="diagnostics-action" onclick={handleCopy} disabled={!report}>
			<Icon name="content_copy" size={16} />
			{exportStatus === "copied" ? "Copied!" : "Copy JSON"}
		</button>
		<button class="diagnostics-action" onclick={handleExport} disabled={!report}>
			<Icon name="download" size={16} />
			{exportStatus === "exported" ? "Exported!" : "Export .json"}
		</button>
		{#if exportStatus === "error"}
			<span class="action-error">Action failed — retry</span>
		{/if}
	</div>

	<div class="diagnostics-import">
		<span class="import-title">Replay a snapshot</span>
		<label class="diagnostics-action import-label">
			<Icon name="upload" size={16} />
			Import settings from diagnostics
			<input class="import-input" type="file" accept=".json,application/json" onchange={handleImportFile} />
		</label>
		{#if importStatus === "imported"}
			<span class="import-status">Settings applied.</span>
		{:else if importStatus === "error"}
			<span class="action-error">Import failed — check the file.</span>
		{/if}
	</div>
</div>

<style lang="scss">
	.diagnostics-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 4px 0;
	}

	.diagnostics-heading {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 700;
		color: var(--font-color);
	}

	.diagnostics-intro {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--font-color-dim);
	}

	.diagnostics-collect-button,
	.diagnostics-action {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 10px;
		border: 1px solid var(--theme-0);
		background: var(--theme-0-20);
		color: var(--font-color);
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 0.2s,
			border-color 0.2s;

		&:hover {
			background: var(--theme-0-30);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			border-color: var(--border-subtle);
			background: var(--fg-opacity-05);
		}
	}

	.diagnostics-collect-button {
		align-self: flex-start;
	}

	.diagnostics-sections {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.diagnostics-section {
		display: grid;
		grid-template-columns: 110px 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
	}

	.section-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--font-color-dim);
	}

	.section-summary {
		font-size: 13px;
		color: var(--font-color);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.section-size {
		font-size: 12px;
		font-weight: 700;
		color: var(--theme-0-text);
	}

	.diagnostics-empty {
		margin: 0;
		font-size: 13px;
		color: var(--font-color-dim);
	}

	.diagnostics-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.diagnostics-import {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		padding-top: 8px;
		border-top: 1px solid var(--fg-opacity-10);
	}

	.import-title {
		font-size: 12px;
		font-weight: 700;
		color: var(--font-color-dim);
	}

	.import-label {
		cursor: pointer;
	}

	.import-input {
		display: none;
	}

	.import-status {
		font-size: 12px;
		color: var(--theme-success);
	}

	.action-error {
		font-size: 12px;
		color: var(--theme-error);
	}
</style>
