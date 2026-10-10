<script lang="ts">
	import type { RunLine } from "../run/script";

	let {
		lines,
		label = "Output",
	}: {
		lines: RunLine[];
		label?: string;
	} = $props();

	let boxEl: HTMLElement | null = $state(null);
	let followOutput = true;

	/** Keeps following new lines only while the reader is at the bottom. */
	function handleScroll() {
		if (!boxEl) return;
		followOutput = boxEl.scrollHeight - boxEl.scrollTop - boxEl.clientHeight < 8;
	}

	$effect(() => {
		void lines.length;
		if (boxEl && followOutput) boxEl.scrollTop = boxEl.scrollHeight;
	});
</script>

<div class="output-box" bind:this={boxEl} onscroll={handleScroll} role="log" aria-live="polite" aria-label={label}>
	{#if lines.length === 0}
		<p class="output-empty">No output yet.</p>
	{/if}
	{#each lines as line, i (i)}
		<pre class="output-line {line.kind}">{line.text}</pre>
	{/each}
</div>

<style lang="scss">
	.output-box {
		height: 160px;
		min-height: 80px;
		max-height: 60vh;
		resize: vertical;
		overflow: auto;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		background: var(--bg-input);
		color: var(--font-color);
		font-family: ui-monospace, monospace;
		font-size: 13px;
		line-height: 1.5;
	}

	.output-empty {
		margin: 0;
		color: var(--font-color-dim);
	}

	.output-line {
		margin: 0 0 4px;
		font-family: inherit;
		white-space: pre-wrap;
		word-break: break-word;

		&.result {
			color: var(--theme-success);
		}

		&.error {
			color: var(--theme-error);
		}

		&.note {
			color: var(--font-color-dim);
		}
	}
</style>
