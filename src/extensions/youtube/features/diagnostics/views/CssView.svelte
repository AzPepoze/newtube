<script lang="ts">
	import { logger } from "@shared/logger";

	import type { CssSnapshot } from "../types";

	let { css }: { css: CssSnapshot } = $props();

	const styleNames = $derived(Array.from(new Set(css.computed.flatMap((item) => Object.keys(item.styles ?? {})))));

	let copyLabel = $state("Copy CSS");

	async function copyInjectedCss(): Promise<void> {
		try {
			await navigator.clipboard.writeText(css.injected);
			copyLabel = "Copied";
		} catch (error) {
			logger.error("diagnostics", "Failed to copy injected CSS from the viewer", error);
			copyLabel = "Copy failed";
		}
	}
</script>

<div class="css">
	<section class="block">
		<div class="head">
			<h2 class="title">Injected CSS</h2>
			<span class="meta">{css.injectedBytes} bytes, {css.stylesheetCount} stylesheets</span>
			<button class="button" type="button" onclick={copyInjectedCss}>{copyLabel}</button>
		</div>
		{#if css.injected}
			<pre class="code">{css.injected}</pre>
		{:else}
			<p class="empty">No StyleShift CSS was injected.</p>
		{/if}
	</section>

	<section class="block">
		<h2 class="title">Computed styles</h2>
		{#if css.computed.length}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Selector</th>
							<th>Present</th>
							{#each styleNames as name (name)}
								<th>{name}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each css.computed as item (item.selector)}
							<tr>
								<td class="selector">{item.selector}</td>
								<td>{item.present ? "yes" : "no"}</td>
								{#each styleNames as name (name)}
									<td>{item.styles?.[name] ?? ""}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="empty">No computed styles were recorded.</p>
		{/if}
	</section>
</div>

<style>
	.css {
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

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.title {
		margin: 0;
		font-size: 15px;
	}

	.meta,
	.empty {
		margin: 0;
		color: var(--font-color-dim);
		font-size: 13px;
	}

	.button {
		margin-left: auto;
		padding: 6px 12px;
		border: 1px solid var(--border-color);
		border-radius: 999px;
		background: var(--theme-0);
		color: #ffffff;
		font: inherit;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
	}

	.code {
		max-height: 320px;
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

	.table-wrap {
		max-width: 100%;
		max-height: 420px;
		overflow: auto;
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
		vertical-align: top;
		white-space: nowrap;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--bg-main);
		color: var(--font-color-dim);
		font-weight: 600;
	}

	.selector {
		white-space: normal;
		overflow-wrap: anywhere;
		min-width: 160px;
	}
</style>
