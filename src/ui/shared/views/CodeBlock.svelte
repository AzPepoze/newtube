<script lang="ts">
	import type { Snippet } from "svelte";
	import { onDestroy } from "svelte";
	import Icon from "@base/Icon.svelte";
	import CodeEditor from "@ui/settings/views/base/editor/CodeEditor.svelte";
	import { copyToClipboard } from "@core/shared/extensionHelpers";

	let {
		code,
		tone = "default",
		language = "",
		onTry = undefined,
		tryLabel = "Try this code",
		children,
	}: {
		/** Raw text copied to the clipboard. */
		code: string;
		tone?: "default" | "accent";
		/** Set to highlight the code with a read-only editor. */
		language?: string;
		/** Set to show the "Try" button in a header bar. */
		onTry?: () => void;
		tryLabel?: string;
		children?: Snippet;
	} = $props();

	let copied = $state(false);
	let timer: number | null = null;
	let nearViewport = $state(false);

	const showEditor = $derived(Boolean(language) && nearViewport);

	function copy() {
		copyToClipboard(code);
		copied = true;
		if (timer) clearTimeout(timer);
		timer = window.setTimeout(() => (copied = false), 1500);
	}

	/** Mounts the highlighted editor only once the block is near the viewport. */
	function watchViewport(node: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				nearViewport = true;
				observer.disconnect();
			},
			{ rootMargin: "200px" },
		);
		observer.observe(node);
		return {
			destroy: () => observer.disconnect(),
		};
	}

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

{#snippet copyButton()}
	<button
		class="shared-code-copy"
		class:copied
		onclick={copy}
		aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
		title={copied ? "Copied!" : "Copy"}
	>
		<Icon name={copied ? "check" : "content_copy"} size={14} />
	</button>
{/snippet}

<div class="shared-code-block" class:tone-accent={tone === "accent"} use:watchViewport>
	{#if onTry}
		<div class="shared-code-bar">
			<button class="shared-code-try" onclick={onTry}>
				<Icon name="play_arrow" size={16} />
				<span>{tryLabel}</span>
			</button>
			{@render copyButton()}
		</div>
	{:else}
		{@render copyButton()}
	{/if}
	{#if showEditor}
		<CodeEditor value={code} {language} readOnly height="auto" />
	{:else}
		<pre class="shared-code-pre">{#if children}{@render children()}{:else}{code}{/if}</pre>
	{/if}
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

	.shared-code-bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		padding: 6px 6px 0;
	}

	.shared-code-try {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: var(--font-color);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms ease;

		&:hover {
			background: color-mix(in srgb, var(--accent) 34%, transparent);
		}
	}

	.shared-code-copy {
		position: absolute;
		top: 8px;
		right: 8px;
		z-index: 1;
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

	.shared-code-bar .shared-code-copy {
		position: static;
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
