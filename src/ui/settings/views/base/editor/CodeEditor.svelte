<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import TextEditor from "../TextEditor.svelte";
	import { CodeEditorController } from "./CodeEditorController.svelte";

	let {
		value = $bindable(""),
		language = "javascript",
		height = 400 as string | number,
		onBlur,
		onInput,
	}: {
		value: string;
		language?: string;
		height?: string | number;
		onBlur?: (value: string) => void;
		onInput?: (value: string) => void;
	} = $props();

	const normalizedHeight = $derived(typeof height === "number" ? `${height}px` : height);

	const controller = new CodeEditorController({
		get language() {
			return language;
		},
		onInput: (v) => {
			value = v;
			onInput?.(v);
		},
		onBlur: (v) => {
			onBlur?.(v);
		},
	});

	let container: HTMLDivElement;
	let editorWrapper = $state<HTMLDivElement>();

	onMount(() => {
		if (editorWrapper) {
			controller.editorWrapper = editorWrapper;
			controller.init(value);
		}
	});

	onDestroy(() => {
		controller.destroy();
	});

	export function setValue(newVal: string) {
		controller.setValue(newVal);
	}

	export function getValue() {
		return controller.getValue();
	}
</script>

<div bind:this={container} class="styleshift-code-editor-container" style:height={normalizedHeight}>
	{#if !controller.fallbackMode}
		<div bind:this={editorWrapper} class="editor-wrapper"></div>
	{:else}
		<TextEditor bind:value {onInput} {onBlur} className="fallback-mode" />
	{/if}
</div>

<style lang="scss">
	.styleshift-code-editor-container {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
		transition: border-color 0.2s;

		&:focus-within {
			border-color: var(--theme-0);
		}
	}

	.editor-wrapper {
		width: 100%;
		height: 100%;
		min-height: 0;
		:global(.cm-editor) {
			height: 100%;
			padding: 10px;
		}

		:global(.cm-scroller) {
			font-family: "Fira Code", monospace;
			font-size: 16px;
		}
	}

	:global(.cm-styleshift-tooltip) {
		background: #1f2330;
		border: 1px solid #6272a4;
		border-radius: 10px;
		padding: 10px;
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55);
		z-index: 10000000 !important;
	}

	:global(.cm-tooltip-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px solid rgba(189, 147, 249, 0.28);
		margin-bottom: 10px;
		padding-bottom: 8px;
	}

	:global(.cm-tooltip-title) {
		font-weight: bold;
		font-size: 18px;
		color: #f8f8f2;
		line-height: 1.2;
	}

	:global(.cm-tooltip-badge) {
		font-size: 14px;
		line-height: 1;
		padding: 5px 10px;
		border-radius: 999px;
		border: 1px solid rgba(189, 147, 249, 0.5);
		background: rgba(189, 147, 249, 0.15);
		color: #bd93f9;
		white-space: nowrap;
	}

	:global(.cm-tooltip-info) {
		word-break: break-word;
		font-size: 14px;
		line-height: 1.6;
		color: #e6e6f2;
		margin-top: 10px;
	}

	:global(.cm-metadata-doc) {
		display: grid;
		gap: 10px;
	}

	:global(.cm-metadata-summary) {
		white-space: pre-wrap;
		font-size: 14px;
		line-height: 1.6;
		color: #f1f2f8;
	}

	:global(.cm-metadata-tags) {
		display: grid;
		gap: 8px;
	}

	:global(.cm-metadata-tag-row) {
		display: grid;
		grid-template-columns: 85px 1fr;
		gap: 10px;
		align-items: start;
	}

	:global(.cm-metadata-example-row) {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	:global(.cm-metadata-tag) {
		font-family: monospace;
		font-size: 13px;
		padding: 3px 0;
		text-align: center;
		border-radius: 6px;
		background: rgba(80, 250, 123, 0.12);
		border: 1px solid rgba(80, 250, 123, 0.5);
		color: #50fa7b;
		white-space: nowrap;
		line-height: 1.5;
		width: 100%;
		display: inline-block;
		box-sizing: border-box;
	}

	:global(.cm-metadata-type-badge) {
		font-family: "Fira Code", monospace;
		font-size: 12px;
		padding: 2px 8px;
		margin-inline: 4px;
		border-radius: 6px;
		background: rgba(139, 233, 253, 0.1);
		border: 1px solid rgba(139, 233, 253, 0.4);
		color: #8be9fd;
		display: inline-block;
		vertical-align: middle;
		font-weight: 500;
	}

	:global(.cm-metadata-tag-body) {
		white-space: pre-wrap;
		font-size: 14px;
		line-height: 1.5;
		color: #d7d9e4;
		width: 100%;
		box-sizing: border-box;
	}

	:global(.cm-metadata-example) {
		font-family: "Fira Code", monospace;
		background: rgba(0, 0, 0, 0.2);
		padding: 8px;
		border-radius: 6px;
		border: 1px solid rgba(189, 147, 249, 0.15);
		margin-top: 4px;
		display: block;
	}

	:global(.cm-tooltip) {
		border: none !important;
		z-index: 10000000 !important;
	}

	:global(.cm-completionInfo) {
		max-width: min(88ch, 66vw);
		max-height: 52vh;
		overflow: auto;
		padding: 14px 16px;
		background: #1f2330;
		border: 1px solid #6272a4;
		border-radius: 10px;
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55);
		font-size: 14px;
		line-height: 1.55;
		color: #e6e6f2;
	}

	:global(.cm-tooltip-autocomplete) {
		z-index: 10000001 !important;
		min-width: 480px;
		max-width: min(86ch, 62vw);
		background: #1f2330 !important;
		border: 1px solid #6272a4 !important;
		border-radius: 8px !important;
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55) !important;
	}

	:global(.cm-tooltip.cm-tooltip-autocomplete > ul) {
		max-height: 320px;
		overflow-y: auto;
		background: #1f2330;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	:global(.cm-tooltip.cm-tooltip-autocomplete > ul > li) {
		font-size: 14px;
		line-height: 1.45;
		padding: 8px 12px;
		color: #f8f8f2;
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid rgba(98, 114, 164, 0.15);
	}

	:global(.cm-tooltip.cm-tooltip-autocomplete > ul > li:last-child) {
		border-bottom: none;
	}

	:global(.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]) {
		background: rgba(189, 147, 249, 0.15);
		outline: 1px solid #bd93f9;
	}

	:global(.cm-completionLabel) {
		font-weight: 600;
		font-size: 14px;
		color: #f8f8f2;
	}

	:global(.cm-completionDetail) {
		font-size: 13px;
		opacity: 1;
		color: #d7d9e4;
		flex: 1;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.cm-completionIcon) {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	:global(.cm-panels) {
		background: #1a1f2b;
		border-bottom: 1px solid rgba(98, 114, 164, 0.45);
		color: #e6e6f2;
	}

	:global(.cm-panels-top) {
		position: absolute;
		top: 10px;
		right: 10px;
		left: auto;
		width: auto;
		max-width: min(760px, calc(100% - 20px));
		background: transparent;
		border: none;
		z-index: 30;
		pointer-events: none;
	}

	:global(.cm-panels-top .cm-panel.cm-search) {
		pointer-events: auto;
		margin: 0;
		border: 1px solid rgba(98, 114, 164, 0.6);
		border-radius: 10px;
	}

	:global(.cm-panel.cm-search) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 10px;
		padding: 10px 12px;
		font-size: 14px;
		line-height: 1.35;
		background: #1f2330;
		border-top: 1px solid rgba(98, 114, 164, 0.3);
	}

	:global(.cm-panel.cm-search label) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #d7d9e4;
	}

	:global(.cm-textfield) {
		height: 34px;
		min-width: 200px;
		padding: 0 11px;
		border-radius: 9px;
		border: 1px solid rgba(98, 114, 164, 0.7);
		background: linear-gradient(180deg, #181d2b 0%, #141927 100%);
		color: #f8f8f2;
		font-size: 14px !important;
		line-height: 1.2;
		outline: none;
		transition:
			border-color 0.16s ease,
			box-shadow 0.16s ease,
			background-color 0.16s ease;
	}

	:global(.cm-textfield:hover) {
		border-color: rgba(139, 233, 253, 0.6);
	}

	:global(.cm-textfield::placeholder) {
		color: rgba(230, 230, 242, 0.48);
	}

	:global(.cm-textfield:focus),
	:global(.cm-textfield:focus-visible) {
		border-color: #bd93f9;
		box-shadow:
			0 0 0 2px rgba(189, 147, 249, 0.22),
			0 4px 16px rgba(0, 0, 0, 0.32);
	}

	:global(.cm-textfield.cm-invalid) {
		border-color: rgba(255, 85, 85, 0.85);
		box-shadow: 0 0 0 2px rgba(255, 85, 85, 0.2);
	}

	:global(.cm-panel.cm-search input[type="text"]) {
		height: 32px;
		min-width: 180px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid rgba(98, 114, 164, 0.65);
		background: #151924;
		color: #f8f8f2;
		outline: none;
	}

	:global(.cm-panel.cm-search input[type="text"]:focus) {
		border-color: #bd93f9;
		box-shadow: 0 0 0 2px rgba(189, 147, 249, 0.2);
	}

	:global(.cm-panel.cm-search input[type="checkbox"]) {
		accent-color: #bd93f9;
	}

	:global(.cm-panel.cm-search button) {
		height: 32px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid rgba(98, 114, 164, 0.65);
		background: #202638;
		color: #e6e6f2;
		font-size: 13px;
		cursor: pointer;
	}

	:global(.cm-panel.cm-search button:hover) {
		background: #2a3248;
		border-color: rgba(189, 147, 249, 0.7);
	}

	:global(.cm-panel.cm-search button:active) {
		transform: translateY(1px);
	}

	:global(.cm-panel.cm-search button[name="close"]) {
		margin-left: auto;
		width: 32px;
		padding: 0;
		font-size: 16px;
		line-height: 1;
	}

	:global(.cm-searchMatch) {
		background: rgba(255, 184, 108, 0.3);
		outline: 1px solid rgba(255, 184, 108, 0.65);
	}

	:global(.cm-searchMatch.cm-searchMatch-selected) {
		background: rgba(255, 121, 198, 0.32);
		outline-color: rgba(255, 121, 198, 0.75);
	}
</style>
