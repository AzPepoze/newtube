<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		anchor,
		title,
		tag = "",
		children,
	}: {
		anchor: string;
		title: string;
		tag?: string;
		children: Snippet;
	} = $props();
</script>

<section class="doc-entry" data-docs-entry={anchor}>
	<header class="doc-entry-header">
		<h2 class="doc-entry-title">{title}</h2>
		{#if tag}<span class="doc-entry-tag">{tag}</span>{/if}
	</header>
	{@render children()}
</section>

<style lang="scss">
	.doc-entry {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-bottom: 32px;
		border-bottom: 1px solid var(--fg-opacity-10);
		color: var(--font-color);

		&:last-child {
			border-bottom: none;
		}

		:global(.doc-sub) {
			margin: 8px 0 0;
			padding-left: 10px;
			border-left: 3px solid var(--accent);
			font-size: 15px;
			font-weight: 800;
			color: var(--font-color);
			text-transform: uppercase;
			letter-spacing: 0.08em;
		}

		:global(.doc-hint) {
			margin: 0;
			font-size: 13px;
			color: var(--font-color-dim);
		}

		:global(.doc-summary) {
			margin: 0;
			font-size: 15px;
			line-height: 1.6;
			color: var(--font-color-dim);
		}

		:global(.doc-preview) {
			padding: 12px 14px;
			border-radius: 8px;
			border: 1px solid var(--fg-opacity-10);
			background: var(--fg-opacity-03);
			pointer-events: none;
		}
	}

	.doc-entry-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.doc-entry-title {
		margin: 0;
		font-family: ui-monospace, monospace;
		font-size: 22px;
		font-weight: 700;
		color: var(--font-color);
	}

	.doc-entry-tag {
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--theme-0-15);
		border: 1px solid var(--theme-0-30);
		color: var(--theme-0-text);
		font-size: 12px;
		white-space: nowrap;
	}
</style>
