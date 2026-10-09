<script lang="ts">
	import type { Snippet } from "svelte";
	import { onDestroy } from "svelte";
	import Icon from "@base/Icon.svelte";
	import { copyToClipboard } from "@core/shared/extensionHelpers";

	let {
		code,
		tone = "default",
		children,
	}: {
		/** Raw text copied to the clipboard. */
		code: string;
		tone?: "default" | "accent";
		children: Snippet;
	} = $props();

	let copied = $state(false);
	let timer: number | null = null;

	function copy() {
		copyToClipboard(code);
		copied = true;
		if (timer) clearTimeout(timer);
		timer = window.setTimeout(() => (copied = false), 1500);
	}

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

<div class="shared-code-block" class:tone-accent={tone === "accent"}>
	<button
		class="shared-code-copy"
		class:copied
		onclick={copy}
		aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
		title={copied ? "Copied!" : "Copy"}
	>
		<Icon name={copied ? "check" : "content_copy"} size={14} />
	</button>
	<pre class="shared-code-pre">{@render children()}</pre>
</div>

<style lang="scss">
	.shared-code-block {
		position: relative;
		border-radius: 8px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);

		&.tone-accent {
			border-left: 3px solid var(--accent);
		}
	}

	.shared-code-copy {
		position: absolute;
		top: 8px;
		right: 8px;
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

	.shared-code-pre {
		margin: 0;
		padding: 12px 44px 12px 14px;
		font-family: ui-monospace, monospace;
		font-size: 14px;
		line-height: 1.7;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
