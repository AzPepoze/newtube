<script lang="ts">
	import { STYLESHIFT_STORE_PREVIEW_URL } from "@core/theme/config";
	import type { Theme } from "@core/theme/manager";
	import { NEWTUBE_STORE_THEMES_URL } from "@extensions/youtube/constants";
	import Button from "@controls/Button.svelte";
	import Icon from "@base/Icon.svelte";
	import { logger } from "@shared/logger";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { onMount } from "svelte";
	import { fade, scale } from "svelte/transition";

	let {
		theme,
		isStoreItem = false,
		isInstalled = false,
		isOpen = $bindable(false),
		onClose,
		onCloseEnd,
		onApply,
		onApplyLivePreview,
		onSave,
	}: {
		theme: Theme | null;
		isStoreItem?: boolean;
		isInstalled?: boolean;
		isOpen?: boolean;
		onClose?: () => void;
		onCloseEnd?: () => void;
		onApply: (theme: Theme) => void;
		onApplyLivePreview: (theme: Theme) => void;
		onSave?: (theme: Theme) => void;
	} = $props();

	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let isLoading = $state(true);
	let mounted = $state(false);
	let previewSource = $state<"store" | "mockup">("store");

	onMount(() => {
		mounted = true;
	});

	let applyIcon = $derived(isStoreItem ? (isInstalled ? "check_circle" : "download") : "check_circle");

	let applyTitle = $derived(isStoreItem ? (isInstalled ? "Installed" : "Install") : "Apply Theme");

	$effect(() => {
		if (theme?.themeId && isStoreItem) {
			previewSource = "store";
		} else {
			previewSource = "mockup";
		}
	});

	const sourceTabOptions = [
		{ id: "store", label: "Store Web Page", icon: "storefront" },
		{ id: "mockup", label: "Mockup Stage", icon: "palette" },
	];

	const baseUrl = STYLESHIFT_STORE_PREVIEW_URL || "https://newtube.azpepoze.com/themes/preview";

	let previewUrl = $derived.by(() => {
		if (!theme) return `${baseUrl}?embedded=true`;

		let url = "";
		if (previewSource === "store" && theme.themeId) {
			url = `${NEWTUBE_STORE_THEMES_URL}/${encodeURIComponent(theme.themeId)}`;
		} else if (isStoreItem && theme.themeId) {
			url = `${baseUrl}?id=${encodeURIComponent(theme.themeId)}`;
		} else {
			try {
				const payload = {
					themeId: theme.themeId || "local-preview",
					themeName: theme.themeName || "Local Theme",
					settings: theme.currentSettings || (theme as any).settings || {},
					addOnStyleShiftItems: theme.addOnStyleShiftItems || [],
				};
				const jsonStr = JSON.stringify(payload);
				const base64 = btoa(encodeURIComponent(jsonStr));
				url = `${baseUrl}?data=${base64}`;
			} catch (e) {
				logger.error("Theme", "Failed to encode theme preview payload", e);
				url = baseUrl;
			}
		}

		return url.includes("?") ? `${url}&embedded=true` : `${url}?embedded=true`;
	});

	$effect(() => {
		if (previewUrl) {
			isLoading = true;
		}
	});

	function handleIframeLoad() {
		isLoading = false;
		if (!iframeEl || !theme || previewSource === "store") return;
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
			logger.warn("Theme", "Could not postMessage to preview iframe", e);
		}
	}

	function handleClose() {
		isOpen = false;
		onClose?.();
	}

	export function close() {
		handleClose();
	}

	export function reopen() {
		isOpen = true;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen && mounted && theme}
	<div
		class="styleshift-main top-level-preview-overlay"
		transition:fade={{ duration: 200 }}
		onoutroend={() => {
			if (!isOpen) {
				onCloseEnd?.();
			}
		}}
	>
		<div class="preview-modal-wrapper" transition:scale={{ duration: 250, start: 0.96 }}>
			<!-- Top Header Bar with Theme Title and Capsule Slider -->
			<div class="preview-header-bar">
				<div class="header-left">
					<h2 class="theme-title">{theme.themeName || "Untitled Theme"}</h2>
					<span class="type-badge">{isStoreItem ? "Store Theme" : "Local Collection"}</span>
				</div>

				<div class="header-center">
					{#if theme.themeId}
						<CapsuleTabs options={sourceTabOptions} bind:activeId={previewSource} />
					{/if}
				</div>

				<div class="header-right">
					<button
						class="preview-header-close"
						onclick={handleClose}
						aria-label="Close Preview"
						title="Close Preview (Esc)"
					>
						<Icon name="close" size={18} />
					</button>
				</div>
			</div>

			<!-- Content Container with border-radius and border -->
			<div class="preview-content-card">
				{#if isLoading}
					<div class="stage-loading">
						<div class="spinner"></div>
						<span>Loading {previewSource === "store" ? "Store Theme Page" : "Mockup Stage"}...</span>
					</div>
				{/if}
				<iframe
					bind:this={iframeEl}
					src={previewUrl}
					title="Theme Preview"
					class="preview-iframe"
					onload={handleIframeLoad}
				></iframe>
			</div>

			<!-- Floating Footer with shared Button components -->
			<div class="floating-footer-bar">
				<div class="footer-actions">
					<Button
						class="preview-footer-btn primary-live-btn"
						fontSize={12.5}
						iconSize={16}
						setting={{
							type: "button",
							name: "Apply as Live Preview",
							icon: "visibility",
							color: "var(--theme-0)",
							clickFunction: () => onApplyLivePreview(theme),
						}}
					/>

					<div title={applyTitle}>
						<Button
							class="preview-footer-btn apply-btn icon-only-btn"
							fontSize={0}
							iconSize={18}
							setting={{
								type: "button",
								name: "",
								icon: applyIcon,
								color: "var(--theme-0)",
								clickFunction: () => onApply(theme),
							}}
						/>
					</div>

					{#if isStoreItem && onSave}
						<div title="Save Theme">
							<Button
								class="preview-footer-btn save-btn icon-only-btn"
								fontSize={0}
								iconSize={18}
								setting={{
									type: "button",
									name: "",
									icon: "save",
									color: "var(--font-color)",
									clickFunction: () => onSave(theme),
								}}
							/>
						</div>
					{/if}

					{#if theme.themeId}
						<div title="Open Store Page">
							<Button
								class="preview-footer-btn store-btn icon-only-btn"
								fontSize={0}
								iconSize={18}
								setting={{
									type: "button",
									name: "",
									icon: "open_in_new",
									color: "var(--font-color-dim)",
									clickFunction: () => {
										const targetId = theme?.themeId;
										const storeUrl = targetId
											? `${NEWTUBE_STORE_THEMES_URL}/${encodeURIComponent(targetId)}`
											: NEWTUBE_STORE_THEMES_URL;
										window.open(storeUrl, "_blank");
									},
								}}
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.top-level-preview-overlay {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		z-index: 900000;
		background: var(--bg-overlay-60);
		backdrop-filter: blur(16px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		box-sizing: border-box;
	}

	.preview-modal-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 1420px;
		height: 92vh;
		max-height: 900px;
		box-sizing: border-box;
	}

	.preview-header-bar {
		margin-bottom: 12px;
		padding: 10px 20px;
		background: var(--window-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 18px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 16px;
		box-shadow: 0 10px 30px var(--shadow-color);

		.header-left {
			display: flex;
			align-items: center;
			gap: 12px;
			justify-content: flex-start;

			.theme-title {
				font-size: 16px;
				font-weight: 700;
				color: var(--font-color);
				margin: 0;
				max-width: 320px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.type-badge {
				font-size: 11px;
				font-weight: 600;
				padding: 3px 8px;
				border-radius: 6px;
				background: var(--fg-opacity-08);
				color: var(--font-color-dim);
				white-space: nowrap;
			}
		}

		.header-center {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.header-right {
			display: flex;
			align-items: center;
			justify-content: flex-end;
		}

		.preview-header-close {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 40px !important;
			height: 40px !important;
			padding: 0 !important;
			border-radius: 50% !important;
			background: var(--theme-error-10) !important;
			border: 1px solid var(--theme-error-50) !important;
			color: var(--theme-error) !important;
			cursor: pointer;
			box-shadow: 0 0 0 3px var(--theme-error-10) !important;

			&:hover {
				background: var(--theme-error) !important;
				color: #ffffff !important;
				transform: scale(1.05);
			}
		}
	}

	.preview-content-card {
		position: relative;
		flex: 1;
		width: 100%;
		height: 100%;
		background: var(--bg-main);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 20px 50px var(--shadow-color);

		.preview-iframe {
			width: 100%;
			height: 100%;
			border: none;
			display: block;
		}

		.stage-loading {
			position: absolute;
			inset: 0;
			background: var(--bg-surface);
			z-index: 10;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			color: var(--font-color-dim);
			font-size: 13.5px;

			.spinner {
				width: 36px;
				height: 36px;
				border: 3px solid var(--fg-opacity-10);
				border-top-color: var(--theme-0);
				border-radius: 50%;
				animation: spin 0.8s linear infinite;
			}
		}
	}

	.floating-footer-bar {
		margin-top: 14px;
		padding: 10px 20px;
		background: var(--window-bg);
		backdrop-filter: blur(20px);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 16px;
		box-shadow: 0 10px 30px var(--shadow-color);
		border-top: 2px solid var(--theme-0);

		.footer-actions {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-wrap: wrap;
			gap: 10px;
		}
	}

	:global(.preview-footer-btn) {
		height: 38px;
		padding: 0 16px !important;
		border-radius: 11px !important;
		width: auto !important;
		font-size: 13px !important;
		font-weight: 700 !important;
		box-shadow: none;
		transition: all 0.2s ease !important;
		cursor: pointer;
		box-sizing: border-box;

		:global(.styleshift-main-description .setting-name) {
			font-weight: 700 !important;
		}
	}

	:global(.preview-footer-btn.icon-only-btn) {
		width: 38px !important;
		height: 38px !important;
		padding: 0 !important;
		display: flex !important;
		justify-content: center !important;
		align-items: center !important;
		border-radius: 11px !important;

		:global(.styleshift-button-icon) {
			margin-right: 0 !important;
		}

		:global(.styleshift-main-description) {
			display: none !important;
		}
	}

	:global(.preview-footer-btn.primary-live-btn) {
		background: transparent !important;
		border: 1px solid var(--theme-0) !important;
		color: var(--theme-0) !important;
		box-shadow:
			0 0 0 1px var(--theme-0-20),
			0 6px 18px var(--theme-0-20) !important;
		font-size: 13.5px !important;

		&:hover {
			background: var(--theme-0) !important;
			color: #ffffff !important;
			transform: translateY(-1px);
			box-shadow: 0 4px 15px var(--theme-0-30) !important;
		}
	}

	:global(.preview-footer-btn.apply-btn) {
		background: var(--theme-0) !important;
		border: 1px solid var(--theme-0) !important;
		color: #ffffff !important;

		&:hover {
			filter: brightness(1.15);
			transform: translateY(-1px);
		}
	}

	:global(.preview-footer-btn.save-btn) {
		background: var(--fg-opacity-08) !important;
		border: 1px solid var(--fg-opacity-15) !important;
		color: var(--font-color) !important;

		&:hover {
			background: var(--fg-opacity-15) !important;
			transform: translateY(-1px);
		}
	}

	:global(.preview-footer-btn.store-btn) {
		background: var(--fg-opacity-05) !important;
		border: 1px solid var(--fg-opacity-10) !important;
		color: var(--font-color-dim) !important;

		&:hover {
			background: var(--fg-opacity-12) !important;
			border-color: var(--fg-opacity-20) !important;
			color: var(--font-color) !important;
			transform: translateY(-1px);
		}
	}

	:global(.preview-footer-btn.close-btn) {
		background: var(--theme-error-10) !important;
		border: 1px solid var(--theme-error-30) !important;
		color: var(--theme-error) !important;
		border-radius: 50% !important;
		width: 40px !important;
		height: 40px !important;
		padding: 0 !important;
		margin-left: 4px;
		box-shadow: 0 0 0 2px var(--theme-error-10) !important;

		&:hover {
			background: var(--theme-error-50) !important;
			color: #ffffff !important;
			transform: translateY(-1px);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
