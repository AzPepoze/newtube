<script lang="ts">
	import { STYLESHIFT_STORE_PREVIEW_URL } from "@core/theme/config";
	import type { Theme } from "@core/theme/manager";
	import Icon from "@base/Icon.svelte";
	import { fade } from "svelte/transition";

	let {
		theme,
		isStoreItem = false,
		isOpen = false,
		onClose,
	}: {
		theme: Theme | null;
		isStoreItem?: boolean;
		isOpen: boolean;
		onClose: () => void;
	} = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let isLoading = $state(true);

	const baseUrl = STYLESHIFT_STORE_PREVIEW_URL || "https://newtube.azpepoze.com/themes/preview";

	let previewUrl = $derived.by(() => {
		if (!theme) return baseUrl;
		if (isStoreItem && theme.themeId) {
			return `${baseUrl}?id=${encodeURIComponent(theme.themeId)}`;
		}

		try {
			const payload = {
				themeId: theme.themeId || "local-preview",
				themeName: theme.themeName || "Local Theme",
				settings: theme.currentSettings || (theme as any).settings || {},
				addOnStyleShiftItems: theme.addOnStyleShiftItems || [],
			};
			const jsonStr = JSON.stringify(payload);
			const base64 = btoa(encodeURIComponent(jsonStr));
			return `${baseUrl}?data=${base64}`;
		} catch (e) {
			console.error("Failed to encode local theme preview payload", e);
			return baseUrl;
		}
	});

	function handleIframeLoad() {
		isLoading = false;
		if (!iframeEl || !theme) return;
		try {
			const payload = {
				themeId: theme.themeId || "local-preview",
				themeName: theme.themeName || "Local Theme",
				settings: theme.currentSettings || (theme as any).settings || {},
				addOnStyleShiftItems: theme.addOnStyleShiftItems || [],
			};
			iframeEl.contentWindow?.postMessage(
				{
					type: "SET_THEME_PREVIEW",
					theme: payload,
				},
				"*",
			);
		} catch (e) {
			console.warn("Could not postMessage to preview iframe", e);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen && theme}
	<div class="fullpage-iframe-overlay" transition:fade={{ duration: 200 }}>
		<div class="fullpage-header">
			<div class="title-section">
				<Icon name="palette" size={20} color="var(--theme-0)" />
				<span class="theme-title">{theme.themeName || "Theme Live Preview"}</span>
				<span class="theme-badge">{isStoreItem ? "Store Theme" : "Local Theme"}</span>
			</div>

			<button class="close-btn" onclick={onClose} aria-label="Close Preview" title="Close Preview (Esc)">
				<Icon name="close" size={20} />
			</button>
		</div>

		<div class="iframe-wrapper">
			{#if isLoading}
				<div class="loading-overlay">
					<div class="spinner"></div>
					<span>Loading Live YouTube Mockup Preview...</span>
				</div>
			{/if}
			<iframe
				bind:this={iframeEl}
				src={previewUrl}
				title="Theme Live Preview"
				class="preview-iframe"
				onload={handleIframeLoad}
			></iframe>
		</div>
	</div>
{/if}

<style lang="scss">
	.fullpage-iframe-overlay {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		z-index: 999999;
		background: #09090b;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.fullpage-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 20px;
		height: 52px;
		background: rgba(18, 18, 20, 0.95);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		box-sizing: border-border-box;

		.title-section {
			display: flex;
			align-items: center;
			gap: 12px;

			.theme-title {
				font-size: 15px;
				font-weight: 700;
				color: #ffffff;
			}

			.theme-badge {
				font-size: 11px;
				font-weight: 600;
				padding: 3px 10px;
				border-radius: 12px;
				background: rgba(255, 255, 255, 0.1);
				color: rgba(255, 255, 255, 0.85);
			}
		}

		.close-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 40px;
			padding: 0;
			border-radius: 50%;
			border: 1px solid rgba(255, 255, 255, 0.15);
			background: rgba(255, 255, 255, 0.08);
			color: #ffffff;
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				background: var(--theme-error, #ff4444);
				border-color: var(--theme-error, #ff4444);
				color: #ffffff;
				transform: translateY(-1px);
			}
		}
	}

	.iframe-wrapper {
		position: relative;
		flex: 1;
		width: 100vw;
		height: calc(100vh - 52px);
		background: #000;

		.preview-iframe {
			width: 100%;
			height: 100%;
			border: none;
			display: block;
		}

		.loading-overlay {
			position: absolute;
			inset: 0;
			background: #09090b;
			z-index: 10;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 14px;
			color: #aaaaaa;
			font-size: 14px;
			font-weight: 500;

			.spinner {
				width: 40px;
				height: 40px;
				border: 3px solid rgba(255, 255, 255, 0.1);
				border-top-color: var(--theme-0, #00ffcc);
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
			}
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
