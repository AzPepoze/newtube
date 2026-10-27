<script lang="ts">
	import { NEWTUBE_STORE_THEMES_URL } from "@extensions/youtube/constants";
	import Icon from "@base/Icon.svelte";
	import IconButton from "@base/IconButton.svelte";
	import { fade } from "svelte/transition";
	import YoutubeHomePreview from "./YoutubeHomePreview.svelte";
	import { getPreviewColors } from "../previewColors";
	import { openThemePreviewOverlay } from "../themeManagerService";

	let {
		id,
		name,
		preview,
		themeId,
		rawTheme,
		isActive,
		isLoading = false,
		isStoreItem = false,
		isInstalled = false,
		creator,
		animationDelay = 0,
		onApply,
		onApplyLivePreview,
		onSave,
		onExport,
		onDelete,
	}: {
		id: string;
		name: string;
		preview: { bgImg: string; bgColor: string };
		themeId?: string;
		rawTheme?: any;
		isActive: boolean;
		isLoading?: boolean;
		isStoreItem?: boolean;
		isInstalled?: boolean;
		creator?: { displayName: string; avatarUrl: string; profileUrl: string };
		animationDelay?: number;
		onApply: (id: string) => void;
		onApplyLivePreview?: (theme: any) => void;
		onSave?: (id: string) => void;
		onExport?: (id: string) => void;
		onDelete?: (id: string) => void;
	} = $props();

	let isHovered = $state(false);
	let slideIndex = $state(0);
	let slideInterval: any = null;

	let imageList = $derived.by(() => {
		const list: string[] = [];
		if (rawTheme?.coverImage) list.push(rawTheme.coverImage);
		if (Array.isArray(rawTheme?.images)) {
			for (const img of rawTheme.images) {
				if (typeof img === "string" && img && !list.includes(img)) list.push(img);
			}
		}
		return list;
	});

	let previewColors = $derived(getPreviewColors(rawTheme?.currentSettings));

	function handleMouseEnter() {
		isHovered = true;
		if (imageList.length > 1) {
			slideInterval = setInterval(() => {
				slideIndex = (slideIndex + 1) % imageList.length;
			}, 1400);
		}
	}

	function handleMouseLeave() {
		isHovered = false;
		slideIndex = 0;
		if (slideInterval) {
			clearInterval(slideInterval);
			slideInterval = null;
		}
	}

	let currentThemeObject = $derived(
		rawTheme || {
			themeId: themeId || id,
			themeName: name,
			currentSettings: {
				MainThemeColor: preview.bgColor,
				BackgroundImageUrl: preview.bgImg,
			},
		},
	);

	function handleCardClick() {
		if (isLoading) return;
		if (isStoreItem) {
			openThemePreviewOverlay({
				theme: currentThemeObject,
				isStoreItem,
				isInstalled,
				onApply: () => onApply(id),
				onApplyLivePreview: (t) => onApplyLivePreview?.(t),
				onSave: () => onSave?.(id),
			});
		} else {
			onApply(id);
		}
	}

	let creatorInitial = $derived(creator?.displayName?.charAt(0)?.toUpperCase() ?? "?");

	function stopCreatorActivation(event: Event) {
		event.stopPropagation();
	}
</script>

<div
	class="theme-card-wrapper"
	class:is-hovered={isHovered}
	style:animation-delay="{animationDelay}ms"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="region"
	aria-label="{name} theme card"
>
	<div
		class="theme-card"
		class:active={isActive}
		class:loading={isLoading}
		onclick={handleCardClick}
		onkeydown={(e) => e.key === "Enter" && handleCardClick()}
		role="button"
		tabindex="0"
	>
		{#if isActive}
			<div class="active-badge" role="img" aria-label="Active theme">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path class="check" d="M6.5 12.5l3.5 3.5 7.5-8" />
					<path class="sparkle" d="M19 1.5l.7 1.8 1.8.7-1.8.7L19 6.5l-.7-1.8-1.8-.7 1.8-.7z" />
					<path class="sparkle sparkle-delayed" d="M4.5 18.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
				</svg>
			</div>
		{/if}

		{#if isStoreItem && isInstalled}
			<div class="installed-badge" class:has-active={isActive} title="Installed">
				<Icon name="check_circle" size={16} />
			</div>
		{/if}

		{#if isLoading}
			<div class="loading-overlay" transition:fade={{ duration: 200 }}>
				<div class="spinner"></div>
			</div>
		{/if}

		<div class="preview-area" style:background-color={preview.bgColor}>
			<div class="overlay"></div>

			<div class="slideshow-container">
				{#if imageList.length > 0}
					<div class="slideshow-track" style="transform: translateX(-{slideIndex * 100}%);">
						{#each imageList as imgUrl, idx (idx)}
							<div class="slide-item" style:background-image="url({imgUrl})"></div>
						{/each}
					</div>
				{:else}
					<div class="slideshow-track">
						<div class="slide-item default-mockup">
							<YoutubeHomePreview colors={previewColors} backgroundImage={preview.bgImg} />
						</div>
					</div>
				{/if}
			</div>

			{#if imageList.length > 1 && isHovered}
				<div class="slide-indicators" transition:fade={{ duration: 150 }}>
					{#each imageList as _, idx (idx)}
						<div class="indicator-dot" class:active={idx === slideIndex}></div>
					{/each}
				</div>
			{/if}

			<div class="title-overlay">
				<div class="title-container" title={name}>
					{#if creator}
						<a
							class="creator-avatar"
							href={creator.profileUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Open ${creator.displayName}'s profile`}
							onclick={stopCreatorActivation}
							onkeydown={stopCreatorActivation}
						>
							{#if creator.avatarUrl}
								<img src={creator.avatarUrl} alt="" loading="lazy" />
							{:else}
								<span class="creator-fallback" aria-hidden="true">{creatorInitial}</span>
							{/if}
						</a>
					{/if}
					<div class="title-text">
						<span class="theme-name">{name}</span>
						{#if creator}
							<a
								class="creator-name"
								href={creator.profileUrl}
								target="_blank"
								rel="noopener noreferrer"
								onclick={stopCreatorActivation}
								onkeydown={stopCreatorActivation}
							>
								{creator.displayName}
							</a>
						{/if}
					</div>
				</div>
				{#if isStoreItem && (rawTheme?.downloads != null || rawTheme?.rating != null)}
					<div class="stats-container">
						{#if rawTheme?.downloads != null}
							<span class="stat-badge downloads" title="{(rawTheme.downloads || 0).toLocaleString()} downloads">
								<Icon name="download" size={13} />
								<span
									>{rawTheme.downloads >= 1000
										? (rawTheme.downloads / 1000).toFixed(1) + "k"
										: rawTheme.downloads}</span
								>
							</span>
						{/if}
						{#if rawTheme?.rating != null}
							<span class="stat-badge rating" title="{rawTheme.rating.toFixed(1)} rating">
								<Icon name="star" size={13} />
								<span>{rawTheme.rating.toFixed(1)}</span>
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="card-actions-drawer">
		<div class="card-actions">
			{#if onApplyLivePreview}
				<button
					type="button"
					class="live-preview-btn"
					title="Preview on YouTube"
					aria-label="Preview on YouTube"
					onclick={(e) => {
						e.stopPropagation();
						onApplyLivePreview?.(currentThemeObject);
					}}
				>
					<Icon name="play_arrow" size={18} />
				</button>
			{/if}
			<IconButton
				icon="visibility"
				onClick={(e) => {
					e.stopPropagation();
					openThemePreviewOverlay({
						theme: currentThemeObject,
						isStoreItem,
						isInstalled,
						onApply: () => onApply(id),
						onApplyLivePreview: (t) => onApplyLivePreview?.(t),
						onSave: () => onSave?.(id),
					});
				}}
				size={18}
				className="preview-btn"
			/>
			{#if !isStoreItem}
				{#if themeId}
					<IconButton
						icon="openInNew"
						onClick={(e) => {
							e.stopPropagation();
							window.open(`${NEWTUBE_STORE_THEMES_URL}/${themeId}`, "_blank");
						}}
						size={18}
						className="link-btn"
					/>
				{/if}
				<IconButton
					icon="export"
					onClick={(e) => {
						e.stopPropagation();
						onExport?.(id);
					}}
					size={18}
					className="export-btn"
				/>
				<IconButton
					icon="delete"
					onClick={(e) => {
						e.stopPropagation();
						onDelete?.(id);
					}}
					size={18}
					className="delete-btn"
				/>
			{:else if isInstalled}
				<IconButton
					icon="check_circle"
					onClick={(e) => {
						e.stopPropagation();
						onApply(id);
					}}
					size={18}
					className="apply-btn"
				/>
			{:else}
				<IconButton
					icon="save"
					onClick={(e) => {
						e.stopPropagation();
						onSave?.(id);
					}}
					size={18}
					className="save-btn"
				/>
				<IconButton
					icon="download"
					onClick={(e) => {
						e.stopPropagation();
						onApply(id);
					}}
					size={18}
					className="apply-btn"
				/>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.theme-card-wrapper {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		animation: card-entry 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		overflow: visible;
		margin-bottom: 5px;

		&:hover,
		&:focus-within {
			z-index: 5;

			.theme-card {
				border-color: var(--fg-opacity-20);
				box-shadow: 0 8px 25px var(--shadow-color);
			}

			.card-actions-drawer {
				transform: translateY(0);
				opacity: 1;
				pointer-events: auto;
				box-shadow: 0 8px 20px var(--shadow-color);
			}

			.creator-name {
				opacity: 1;
				transform: translateY(0);
				max-height: 16px;
			}
		}
	}

	.theme-card {
		position: relative;
		z-index: 2;
		width: 100%;
		aspect-ratio: 16 / 9;
		height: auto;
		background: var(--fg-opacity-05);
		border-radius: 16px;
		border: 1px solid var(--fg-opacity-10);
		overflow: hidden;
		transition:
			border-color 0.3s ease,
			box-shadow 0.3s ease;
		display: flex;
		flex-direction: column;

		&.active {
			border: 2px solid var(--theme-0);

			animation: active-glow 2.4s ease-in-out infinite;

			.active-badge {
				position: absolute;
				top: 8px;
				right: 8px;
				width: 28px;
				height: 28px;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				background: var(--theme-0);
				color: var(--fg-opacity-100);
				z-index: 10;
				box-shadow: 0 2px 8px var(--shadow-color);
				animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;

				svg {
					width: 22px;
					height: 22px;
					overflow: visible;
					fill: none;
					stroke: currentColor;
					stroke-linecap: round;
					stroke-linejoin: round;
				}

				.check {
					stroke-width: 2.4;
					stroke-dasharray: 16;
					stroke-dashoffset: 16;
					animation: check-draw 0.45s ease-out 0.35s forwards;
				}

				.sparkle {
					fill: currentColor;
					stroke: none;
					transform-box: fill-box;
					transform-origin: center;
					animation: sparkle-twinkle 2.2s ease-in-out infinite;
				}

				.sparkle-delayed {
					animation-delay: 1.1s;
				}
			}
		}

		.installed-badge {
			position: absolute;
			top: 10px;
			right: 10px;
			background: rgba(34, 197, 94, 0.9);
			color: #ffffff;
			width: 24px;
			height: 24px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

			&.has-active {
				right: 70px;
			}
		}

		&.loading {
			pointer-events: none;

			.preview-area {
				filter: grayscale(0.2);
			}
		}
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		background: var(--bg-overlay-30);
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--fg-opacity-10);
		border-top-color: var(--theme-0);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		box-shadow: 0 0 15px var(--shadow-color);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes active-glow {
		0%,
		100% {
			box-shadow: 0 0 10px color-mix(in srgb, var(--theme-0) 35%, transparent);
		}
		50% {
			box-shadow: 0 0 24px color-mix(in srgb, var(--theme-0) 75%, transparent);
		}
	}

	@keyframes check-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes sparkle-twinkle {
		0%,
		100% {
			transform: scale(0.2) rotate(0deg);
			opacity: 0;
		}
		30% {
			transform: scale(1) rotate(45deg);
			opacity: 1;
		}
		60% {
			transform: scale(0.4) rotate(90deg);
			opacity: 0.4;
		}
	}

	@keyframes badge-pop {
		0% {
			opacity: 0;
			transform: scale(0.4) translateY(-6px);
		}
		60% {
			opacity: 1;
			transform: scale(1.12);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.theme-card.active,
		.theme-card.active .active-badge,
		.theme-card.active .active-badge .sparkle {
			animation: none;
		}

		.theme-card.active .active-badge .check {
			animation: none;
			stroke-dashoffset: 0;
		}
	}

	@keyframes card-entry {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.preview-area {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;

		.overlay {
			position: absolute;
			inset: 0;
			z-index: 1;
			background: linear-gradient(to bottom, var(--bg-overlay-10) 0%, var(--bg-overlay-30) 100%);
			pointer-events: none;
		}

		.slideshow-container {
			position: relative;
			z-index: 2;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		.slideshow-track {
			display: flex;
			width: 100%;
			height: 100%;
			transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
		}

		.slide-item {
			min-width: 100%;
			height: 100%;
			background-size: cover;
			background-repeat: no-repeat;
			background-position: center;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.slide-indicators {
			position: absolute;
			top: 10px;
			left: 10px;
			z-index: 4;
			display: flex;
			gap: 4px;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
			padding: 3px 8px;
			border-radius: 10px;

			.indicator-dot {
				width: 5px;
				height: 5px;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.4);
				transition: all 0.2s ease;

				&.active {
					background: var(--theme-0);
					transform: scale(1.3);
				}
			}
		}

		.title-overlay {
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 5;
			padding: 28px 12px 10px;
			background: linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
			pointer-events: none;
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			gap: 8px;
		}
	}

	.stats-container {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;

		.stat-badge {
			display: flex;
			align-items: center;
			gap: 3px;
			font-size: 11px;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.9);
			background: rgba(0, 0, 0, 0.45);
			backdrop-filter: blur(4px);
			padding: 2px 6px;
			border-radius: 6px;

			&.downloads {
				color: #60a5fa;
			}

			&.rating {
				color: #f59e0b;
			}
		}
	}

	.title-container {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.title-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.theme-name {
		font-weight: 600;
		color: #ffffff;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
	}

	.creator-avatar {
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, 0.65);
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.45);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
		overflow: hidden;
		pointer-events: auto;
		text-decoration: none;
		outline-offset: 3px;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.creator-fallback {
		color: #fff;
		font-size: 12px;
		font-weight: 700;
	}

	.creator-name {
		max-height: 0;
		overflow: hidden;
		color: rgba(255, 255, 255, 0.88);
		font-size: 11px;
		line-height: 16px;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0;
		transform: translateY(-6px);
		pointer-events: auto;
		transition:
			opacity 0.2s ease,
			transform 0.25s ease,
			max-height 0.25s ease;
	}

	.card-actions-drawer {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 1;
		margin-top: -24px;
		padding: 32px 12px 10px;
		background: color-mix(in srgb, #000 80%, var(--bg-main));
		border-radius: 0 0 16px 16px;
		border: 1px solid var(--fg-opacity-10);
		border-top: none;
		display: flex;
		justify-content: center;
		align-items: center;
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
		transition:
			transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1),
			opacity 0.25s ease;
	}

	.card-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		justify-content: center;
		width: 100%;

		.live-preview-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 10px;
			border: 0;
			border-radius: 8px;
			background: color-mix(in srgb, var(--theme-0) 25%, #1d1d1f);
			color: color-mix(in srgb, var(--theme-0) 50%, white);
			font: inherit;
			cursor: pointer;
			transition:
				transform 0.2s,
				background 0.2s;

			&:hover {
				background: color-mix(in srgb, var(--theme-0) 40%, #1d1d1f);
				transform: scale(1.1);
			}
		}

		:global(.preview-btn) {
			background: var(--fg-opacity-10) !important;
			border-radius: 8px !important;

			&:hover {
				background: var(--theme-0) !important;
				color: #000 !important;
				opacity: 0.9;
			}
		}

		:global(.apply-btn) {
			background: var(--fg-opacity-10) !important;
			border-radius: 8px !important;

			&:hover {
				background: var(--theme-0) !important;
				opacity: 0.8;
			}
		}

		:global(.save-btn) {
			background: var(--fg-opacity-10) !important;
			border-radius: 8px !important;

			&:hover {
				background: var(--theme-0) !important;
				opacity: 0.8;
			}
		}

		:global(.export-btn) {
			background: var(--fg-opacity-10) !important;
			border-radius: 8px !important;

			&:hover {
				background: var(--theme-0) !important;
				opacity: 0.8;
			}
		}

		:global(.delete-btn) {
			background: var(--theme-error-10) !important;
			border-radius: 8px !important;

			&:hover {
				background: var(--theme-error-50) !important;
			}
		}
	}
</style>
