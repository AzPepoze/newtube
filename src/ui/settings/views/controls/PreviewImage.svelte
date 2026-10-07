<script lang="ts">
	import { computeImageTransformStyles, type ImageTransformParams } from "@/shared/utils/imageStyles";
	import { logger } from "@/shared/logger";
	import { getFromStorage } from "@core/storage/manager";
	import { registerSettingListener, unregisterSettingListener } from "@settings/engine/functions";
	import { getAssetUrl } from "@ui/window/utils";
	import { onMount } from "svelte";

	let {
		src = "",
		title = "",
		preset = "default",
		settingIds,
	}: {
		src?: string;
		title?: string;
		preset?: "default" | "topbar" | "banner" | "card" | "avatar";
		settingIds?: {
			url?: string;
			size?: string;
			positionX?: string;
			positionY?: string;
			cropTop?: string;
			cropBottom?: string;
			cropLeft?: string;
			cropRight?: string;
			flip?: string;
		};
	} = $props();

	let currentSrc = $state("");
	let transformParams = $state<ImageTransformParams>({
		scale: 1,
		positionX: 50,
		positionY: 50,
		cropTop: 0,
		cropBottom: 0,
		cropLeft: 0,
		cropRight: 0,
		flip: false,
	});

	let canvas: HTMLCanvasElement | null = $state(null);
	let container: HTMLDivElement | null = $state(null);
	let observer: IntersectionObserver;
	let isVisible = $state(false);
	let isLoading = $state(false);
	let hasError = $state(false);

	async function updateDynamicPreview() {
		if (!settingIds) return;

		if (settingIds.url) {
			currentSrc = (await getFromStorage(settingIds.url)) || src;
		} else {
			currentSrc = src;
		}

		const scale = settingIds.size ? await getFromStorage(settingIds.size) : 1;
		const posX = settingIds.positionX ? await getFromStorage(settingIds.positionX) : 50;
		const posY = settingIds.positionY ? await getFromStorage(settingIds.positionY) : 50;
		const cropTop = settingIds.cropTop ? await getFromStorage(settingIds.cropTop) : 0;
		const cropBottom = settingIds.cropBottom ? await getFromStorage(settingIds.cropBottom) : 0;
		const cropLeft = settingIds.cropLeft ? await getFromStorage(settingIds.cropLeft) : 0;
		const cropRight = settingIds.cropRight ? await getFromStorage(settingIds.cropRight) : 0;
		const flip = settingIds.flip ? await getFromStorage(settingIds.flip) : false;

		transformParams = {
			scale: typeof scale === "number" ? scale : 1,
			positionX: typeof posX === "number" ? posX : 50,
			positionY: typeof posY === "number" ? posY : 50,
			cropTop: typeof cropTop === "number" ? cropTop : 0,
			cropBottom: typeof cropBottom === "number" ? cropBottom : 0,
			cropLeft: typeof cropLeft === "number" ? cropLeft : 0,
			cropRight: typeof cropRight === "number" ? cropRight : 0,
			flip: Boolean(flip),
		};
	}

	const computedStyles = $derived(computeImageTransformStyles(transformParams));

	function drawImage(url: string) {
		if (!url || !canvas) return;
		isLoading = true;
		hasError = false;

		const img = new Image();

		img.onload = () => {
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const maxWidth = 800;
			const maxHeight = 600;
			let width = img.width || 1;
			let height = img.height || 1;

			const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
			width = Math.floor(width * ratio);
			height = Math.floor(height * ratio);

			canvas.width = width;
			canvas.height = height;

			ctx.drawImage(img, 0, 0, width, height);
			isLoading = false;

			logger.debug("ui", `Rendered preview: ${img.width}x${img.height} -> ${width}x${height}`);
		};

		img.onerror = () => {
			isLoading = false;
			hasError = true;
			logger.warn("ui", "Failed to load image for preview:", url);
		};

		img.src = getAssetUrl(url);
	}

	$effect(() => {
		if (!settingIds) {
			currentSrc = src;
		}
	});

	$effect(() => {
		if (isVisible && currentSrc && canvas && !settingIds) {
			drawImage(currentSrc);
		}
	});

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					isVisible = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);

		if (container) {
			observer.observe(container);
		}

		if (settingIds) {
			updateDynamicPreview();
			const keys = Object.values(settingIds).filter((k): k is string => Boolean(k));
			for (const key of keys) {
				registerSettingListener(key, updateDynamicPreview);
			}
		}

		return () => {
			if (observer) observer.disconnect();
			if (settingIds) {
				const keys = Object.values(settingIds).filter((k): k is string => Boolean(k));
				for (const key of keys) {
					unregisterSettingListener(key, updateDynamicPreview);
				}
			}
		};
	});
</script>

<div class="styleshift-preview-image-container preset-{preset}" bind:this={container}>
	{#if title}
		<div class="styleshift-preview-header">
			<span class="styleshift-preview-title">{title}</span>
		</div>
	{/if}

	{#if currentSrc}
		{#if settingIds}
			<div class="styleshift-preview-stage">
				<img
					src={currentSrc}
					alt="Preview"
					class="styleshift-preview-dynamic-img"
					style:scale={computedStyles.scale}
					style:translate={computedStyles.translate}
					style:clip-path={computedStyles.clipPath}
					style:transform={computedStyles.transform}
				/>
			</div>
		{:else}
			{#if !isVisible || isLoading}
				<div class="styleshift-loading">Loading preview...</div>
			{/if}

			{#if hasError}
				<div class="styleshift-no-image">Failed to load preview</div>
			{/if}

			<canvas
				bind:this={canvas}
				class="styleshift-preview-canvas"
				style:display={isVisible && !isLoading && !hasError ? "block" : "none"}
			></canvas>
		{/if}
	{:else}
		<div class="styleshift-no-image">No image selected</div>
	{/if}
</div>

<style lang="scss">
	.styleshift-preview-image-container {
		width: fit-content;
		min-width: 200px;
		max-width: 100%;
		min-height: 100px;
		max-height: 600px;
		background: var(--bg-overlay-40);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 2px solid var(--fg-opacity-10);
		box-shadow:
			0 10px 30px var(--bg-overlay-50),
			0 0 0 1px var(--fg-opacity-05);
		transition: transform 0.3s;
		padding: 10px;
		box-sizing: border-box;

		&:hover {
			border-color: var(--theme-0, #7f5db7);
		}
	}

	.styleshift-preview-header {
		width: 100%;
		display: flex;
		align-items: center;
		margin-bottom: 8px;
	}

	.styleshift-preview-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--fg-opacity-60, rgba(255, 255, 255, 0.6));
	}

	.styleshift-preview-stage {
		position: relative;
		width: 100%;
		height: 56px;
		background: var(--bg-overlay-50, rgba(15, 15, 15, 0.8));
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		border: 1px dashed var(--fg-opacity-20, rgba(255, 255, 255, 0.2));
	}

	.preset-banner .styleshift-preview-stage {
		height: 120px;
	}

	.preset-avatar .styleshift-preview-stage {
		height: 80px;
		width: 80px;
		border-radius: 50%;
		margin: 0 auto;
	}

	.styleshift-preview-dynamic-img {
		height: 100%;
		width: auto;
		object-fit: contain;
		position: absolute;
		left: -50%;
		top: -50%;
		pointer-events: none;
		transition:
			scale 0.1s ease-out,
			translate 0.1s ease-out,
			clip-path 0.1s ease-out;
	}

	.styleshift-preview-canvas {
		max-width: 100%;
		max-height: 600px;
		object-fit: contain;
		display: block;
	}

	.styleshift-no-image,
	.styleshift-loading {
		font-size: 13px;
		opacity: 0.5;
		padding: 20px;
		text-align: center;
	}
</style>
