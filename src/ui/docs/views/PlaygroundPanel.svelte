<script lang="ts">
	import { untrack } from "svelte";
	import Icon from "@base/Icon.svelte";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import CodeEditor from "@ui/settings/views/base/editor/CodeEditor.svelte";
	import SettingRenderer from "@ui/settings/views/setting/SettingRenderer.svelte";
	import { parseKindJson, playground, type KindParse } from "../playground.svelte";
	import { runPlayground } from "../playgroundRunner";

	let editor: { setValue: (value: string) => void } | undefined = $state();

	const kindResult = $derived(parseKindJson(playground.kindsJson));
	const kindError = $derived(errorOf(kindResult));
	const kindPreview = $derived(previewOf(kindResult));

	function errorOf(result: KindParse): string | null {
		if (result.ok === true) return null;
		return result.error;
	}

	function previewOf(result: KindParse): Setting | null {
		if (result.ok !== true) return null;
		const value = result.value;
		return typeof value === "object" && value !== null && "type" in value ? (value as Setting) : null;
	}

	function currentCode(): string {
		return playground.mode === "functions" ? playground.functionsCode : playground.kindsJson;
	}

	// Load new code into the editor when a Try button is used, without reacting to typing.
	$effect(() => {
		void playground.version;
		untrack(() => editor?.setValue(currentCode()));
	});

	async function run() {
		if (playground.running) return;
		playground.running = true;
		playground.output = [];
		try {
			await runPlayground(playground.functionsCode, (line) => playground.output.push(line));
		} finally {
			playground.running = false;
		}
	}

	function handleKeys(event: KeyboardEvent) {
		if (
			playground.open &&
			playground.mode === "functions" &&
			(event.ctrlKey || event.metaKey) &&
			event.key === "Enter"
		) {
			event.preventDefault();
			run();
		}
	}
</script>

<svelte:window onkeydown={handleKeys} />

<div class="playground" role="region" aria-label="Playground">
	<header class="playground-header">
		<span class="playground-title">Playground</span>
		{#if playground.mode === "functions"}
			<button class="playground-action primary" onclick={run} disabled={playground.running}>
				<Icon name="play_arrow" size={16} />
				<span>{playground.running ? "Running" : "Run"}</span>
			</button>
			<button class="playground-action" onclick={() => (playground.output = [])}>Clear</button>
		{/if}
		<button
			class="playground-close"
			onclick={() => (playground.open = false)}
			title="Close playground"
			aria-label="Close playground"
		>
			<Icon name="close" size={16} />
		</button>
	</header>

	<div class="playground-editor">
		{#key playground.mode}
			<CodeEditor
				bind:this={editor}
				value={currentCode()}
				language={playground.mode === "functions" ? "javascript" : "json"}
				height="100%"
				onInput={(value) => {
					if (playground.mode === "functions") playground.functionsCode = value;
					else playground.kindsJson = value;
				}}
			/>
		{/key}
	</div>

	{#if playground.mode === "functions"}
		<div class="playground-output" aria-live="polite">
			<div class="playground-section-title">Output</div>
			{#if playground.output.length === 0}
				<p class="playground-empty">Press Run or Ctrl+Enter. Runs in the current YouTube tab.</p>
			{/if}
			{#each playground.output as line, i (i)}
				<pre class="playground-line {line.kind}">{line.text}</pre>
			{/each}
		</div>
	{:else}
		<div class="playground-output" aria-live="polite">
			<div class="playground-section-title">Preview</div>
			{#if kindError}
				<p class="playground-error">{kindError}</p>
			{:else if kindPreview}
				<div class="playground-preview">
					<SettingRenderer setting={kindPreview} />
				</div>
			{:else}
				<p class="playground-empty">Add a "type" field to see the setting.</p>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	.playground {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		gap: 10px;
		color: var(--font-color);
	}

	.playground-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.playground-title {
		flex: 1;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--font-color-dim);
	}

	.playground-action,
	.playground-close {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 28px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-05);
		color: var(--font-color);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;

		&:hover:not(:disabled) {
			background: var(--fg-opacity-10);
		}

		&:disabled {
			opacity: 0.6;
			cursor: default;
		}

		&.primary {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			border-color: color-mix(in srgb, var(--accent) 50%, transparent);
		}
	}

	.playground-close {
		width: 28px;
		padding: 0;
		justify-content: center;
		color: var(--font-color-dim);
	}

	.playground-editor {
		flex: 1;
		min-height: 160px;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--fg-opacity-10);
	}

	.playground-output {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 35%;
		overflow-y: auto;
	}

	.playground-section-title {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--font-color-dim);
	}

	.playground-empty {
		margin: 0;
		font-size: 13px;
		color: var(--font-color-dim);
	}

	.playground-line {
		margin: 0;
		padding: 6px 10px;
		border-radius: 6px;
		background: var(--fg-opacity-05);
		font-family: ui-monospace, monospace;
		font-size: 13px;
		white-space: pre-wrap;
		word-break: break-word;
		color: var(--font-color);

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

	.playground-error {
		margin: 0;
		font-family: ui-monospace, monospace;
		font-size: 13px;
		color: var(--theme-error);
	}

	.playground-preview {
		padding: 12px 14px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-03);
		pointer-events: none;
	}
</style>
