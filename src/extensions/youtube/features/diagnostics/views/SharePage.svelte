<script lang="ts">
	import type { SharePageState } from "../sharePage.svelte";
	import { getCaptureSize } from "../shareFormat";
	import ExposurePanel from "./ExposurePanel.svelte";

	interface Props {
		share: SharePageState;
	}

	let { share }: Props = $props();

	let pane = $state<HTMLElement>();
	let paneWidth = $state(0);
	let paneHeight = $state(0);

	$effect(() => {
		const element = pane;
		if (!element) return;
		const observer = new ResizeObserver((entries) => {
			paneWidth = entries[0]?.contentRect.width ?? 0;
			paneHeight = entries[0]?.contentRect.height ?? 0;
		});
		observer.observe(element);
		return () => observer.disconnect();
	});

	const captureSize = $derived(share.filteredReport ? getCaptureSize(share.filteredReport) : null);
	// Fit the whole capture inside the pane; the stage is centered by the pane.
	const scale = $derived(
		captureSize && paneWidth && paneHeight
			? Math.min(paneWidth / captureSize.width, paneHeight / captureSize.height)
			: 1,
	);
	const stageStyle = $derived(
		captureSize ? `width: ${captureSize.width * scale}px; height: ${captureSize.height * scale}px;` : "",
	);
	const frameStyle = $derived(
		captureSize ? `width: ${captureSize.width}px; height: ${captureSize.height}px; transform: scale(${scale});` : "",
	);
	const hasSnapshot = $derived(Boolean(share.filteredReport?.snapshot?.root));

	function handleChange(key: Parameters<SharePageState["setOption"]>[0], value: boolean): void {
		share.setOption(key, value);
	}
</script>

<svelte:head>
	<title>StyleShift share report</title>
</svelte:head>

<main class="share">
	<section class="preview" bind:this={pane}>
		{#if captureSize && hasSnapshot}
			<div class="stage" style={stageStyle}>
				<iframe class="frame" title="Report preview" srcdoc={share.previewHtml} sandbox="" style={frameStyle}></iframe>
			</div>
		{:else}
			<p class="empty">This report has no page snapshot.</p>
		{/if}
	</section>

	<ExposurePanel
		options={share.options}
		sizeLabel={share.sizeLabel}
		notice={share.notice}
		onChange={handleChange}
		onCancel={() => share.cancel()}
		onSaveFile={() => share.saveFile()}
		onCopyJson={() => share.copyJson()}
	/>
</main>

<style>
	:global(body) {
		margin: 0;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-main);
		color: var(--font-color);
	}

	.share {
		display: flex;
		height: 100vh;
		font-family: system-ui, sans-serif;
	}

	.preview {
		flex: 1;
		min-width: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: var(--bg-welcome);
	}

	.stage {
		position: relative;
		flex: none;
		overflow: hidden;
	}

	.frame {
		position: absolute;
		top: 0;
		left: 0;
		border: 0;
		transform-origin: top left;
	}

	.empty {
		margin: 24px;
		color: var(--font-color-dim);
	}
</style>
