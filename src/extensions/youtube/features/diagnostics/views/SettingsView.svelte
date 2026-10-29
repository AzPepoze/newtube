<script lang="ts">
	import type { DiagnosticsReport } from "../types";

	let { report }: { report: DiagnosticsReport } = $props();

	const environmentRows = $derived([
		{ label: "User agent", value: report.environment.userAgent },
		{ label: "Platform", value: report.environment.platform },
		{
			label: "Viewport",
			value: `${report.environment.viewport.width} x ${report.environment.viewport.height} at ${report.environment.viewport.devicePixelRatio}x`,
		},
		{ label: "Color scheme", value: report.environment.colorScheme },
		{ label: "Reduced motion", value: report.environment.reducedMotion ? "yes" : "no" },
	]);

	const pageRows = $derived([
		{ label: "URL", value: report.page.url },
		{ label: "Mode", value: report.page.mode },
		{ label: "Query parameter names", value: report.page.queryParamNames.join(", ") || "none" },
	]);

	const selectorRows = $derived(Object.entries(report.selectors ?? {}));

	function formatJson(value: unknown): string {
		return JSON.stringify(value, null, 2);
	}
</script>

<div class="settings">
	<section class="block">
		<h2 class="title">Environment</h2>
		<dl class="rows">
			{#each environmentRows as row (row.label)}
				<div class="row">
					<dt>{row.label}</dt>
					<dd>{row.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="block">
		<h2 class="title">Page</h2>
		<dl class="rows">
			{#each pageRows as row (row.label)}
				<div class="row">
					<dt>{row.label}</dt>
					<dd>{row.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="block">
		<h2 class="title">Current settings</h2>
		<pre class="code">{formatJson(report.settings.currentSettings)}</pre>
	</section>

	<section class="block">
		<h2 class="title">Add-on items</h2>
		<pre class="code">{formatJson(report.settings.addOnStyleShiftItems)}</pre>
	</section>

	<section class="block">
		<h2 class="title">Selectors</h2>
		{#if selectorRows.length}
			<table>
				<thead>
					<tr>
						<th>Selector</th>
						<th>Count</th>
					</tr>
				</thead>
				<tbody>
					{#each selectorRows as [selector, count] (selector)}
						<tr>
							<td class="selector">{selector}</td>
							<td>{count}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty">No selectors were counted.</p>
		{/if}
	</section>
</div>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
		padding: 12px;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		background: var(--bg-surface);
	}

	.title {
		margin: 0;
		font-size: 15px;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
	}

	dt {
		min-width: 140px;
		color: var(--font-color-dim);
		font-size: 13px;
	}

	dd {
		margin: 0;
		font-size: 13px;
		overflow-wrap: anywhere;
		min-width: 0;
		flex: 1 1 200px;
	}

	.code {
		max-height: 360px;
		margin: 0;
		padding: 10px;
		overflow: auto;
		border-radius: 8px;
		background: var(--bg-input);
		color: var(--font-color);
		font:
			12px ui-monospace,
			monospace;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	table {
		border-collapse: collapse;
		font:
			12px ui-monospace,
			monospace;
	}

	th,
	td {
		padding: 6px 8px;
		border-bottom: 1px solid var(--border-color);
		text-align: left;
	}

	.selector {
		overflow-wrap: anywhere;
	}

	.empty {
		margin: 0;
		color: var(--font-color-dim);
		font-size: 13px;
	}
</style>
