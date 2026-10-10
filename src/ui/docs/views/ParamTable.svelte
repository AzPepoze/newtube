<script lang="ts">
	import { tokenizeType, type ApiDocRow } from "../apiReferenceData";

	let { rows }: { rows: ApiDocRow[] } = $props();

	const hasNames = $derived(rows.some((row) => row.name));
</script>

<div class="param-table-wrap">
	<table class="param-table">
		<thead>
			<tr>
				{#if hasNames}<th>Name</th>{/if}
				<th>Type</th>
				<th>Description</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row, i (i)}
				<tr>
					{#if hasNames}<td class="param-name">{row.name}</td>{/if}
					<td
						>{#if row.type}<code class="param-type"
								>{#each tokenizeType(row.type) as token, j (j)}<span class="tok-{token.kind}">{token.text}</span
									>{/each}</code
							>{/if}</td
					>
					<td class="param-text">{row.text}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	.param-table-wrap {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
	}

	.param-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
		line-height: 1.5;

		th,
		td {
			padding: 10px 14px;
			text-align: left;
			vertical-align: top;
			border-bottom: 1px solid var(--fg-opacity-08);
		}

		th {
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--font-color-dim);
			background: var(--fg-opacity-03);
		}

		tr:last-child td {
			border-bottom: none;
		}
	}

	.param-name {
		font-family: ui-monospace, monospace;
		color: var(--accent);
		white-space: nowrap;
	}

	.param-type {
		font-family: ui-monospace, monospace;
		font-size: 12px;
		color: var(--theme-0-text);
	}

	.tok-keyword {
		color: var(--code-keyword);
	}

	.tok-name {
		color: var(--code-type);
	}

	.tok-string {
		color: var(--code-string);
	}

	.tok-number {
		color: var(--code-number);
	}

	.tok-punct {
		color: var(--code-punct);
	}

	.param-text {
		color: var(--font-color-dim);
	}
</style>
