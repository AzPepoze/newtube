<script lang="ts">
	import { getFromStorage } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";

	type CropMode = "vertical" | "horizontal" | "both";
	type BarSide = "top" | "bottom" | "left" | "right";

	const OPTIONS: { id: CropMode; label: string; bars: BarSide[]; experimental?: boolean }[] = [
		{ id: "vertical", label: "Vertical", bars: ["top", "bottom"] },
		{ id: "horizontal", label: "Horizontal", bars: ["left", "right"], experimental: true },
		{ id: "both", label: "Both", bars: ["top", "bottom", "left", "right"] },
	];

	let {
		setting,
		disabled = false,
	}: {
		setting: Extract<Setting, { type: "custom" }> | any;
		disabled?: boolean;
	} = $props();

	let value = $state<CropMode>("vertical");

	async function init() {
		if (setting.id) {
			const stored = await getFromStorage(setting.id);
			if (stored === "vertical" || stored === "horizontal" || stored === "both") {
				value = stored;
			} else if (setting.value) {
				value = setting.value as CropMode;
			}
		} else if (setting.value) {
			value = setting.value as CropMode;
		}
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			value = setting.value as CropMode;
		}
	});

	const name = $derived(setting.name || "Crop Direction");
	const description = $derived(setting.description || "Choose direction for black bar removal.");

	async function selectMode(mode: CropMode) {
		if (disabled) return;
		value = mode;
		if (setting.id) {
			await setAndSave(setting, value);
			triggerSettingUpdate(setting.id);
		} else if (typeof (setting as any).updateFunction === "function") {
			(setting as any).updateFunction(value);
		}
	}
</script>

<div class="styleshift-blackbars-options-container">
	<Description {name} {description} />

	<div class="styleshift-blackbars-grid" role="radiogroup" aria-label={name}>
		{#each OPTIONS as option (option.id)}
			<button
				type="button"
				class="styleshift-blackbars-card"
				class:selected={value === option.id}
				class:disabled
				role="radio"
				aria-checked={value === option.id}
				aria-label={option.label}
				onclick={() => selectMode(option.id)}
			>
				<div class="preview" data-mode={option.id}>
					{#each option.bars as side (side)}
						<span class="bar bar-{side}"></span>
					{/each}
				</div>

				<div class="card-label">
					<span>{option.label}</span>
					{#if option.experimental}<span class="experimental-badge">Experimental</span>{/if}
				</div>

				<span class="check" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.5">
						<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	.styleshift-blackbars-options-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.styleshift-blackbars-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 10px;
		width: 100%;
	}

	.styleshift-blackbars-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: var(--bg-overlay-20);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 12px;
		padding: 10px;
		cursor: pointer;
		outline: none;
		transition:
			transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
			border-color 0.25s ease,
			background 0.25s ease,
			box-shadow 0.25s ease;

		&:hover:not(.disabled) {
			border-color: var(--fg-opacity-30);
			background: var(--bg-overlay-30);
			transform: translateY(-3px);
		}

		&:focus-visible {
			border-color: var(--theme-0);
			box-shadow: 0 0 0 2px var(--theme-0-20);
		}

		&.selected {
			border-color: var(--theme-0);
			background: var(--theme-0-10);
			box-shadow:
				0 0 0 1px var(--theme-0-30),
				0 8px 20px var(--shadow-color);
			animation: card-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

			.card-label span {
				color: var(--text-primary);
				font-weight: 700;
			}
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.preview {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 6px;
		overflow: hidden;
		background: var(--bg-overlay-60);
		box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.6);
	}

	.bar {
		position: absolute;
		z-index: 2;
		background: var(--theme-error-30);
		border: 1px dashed var(--theme-error);

		&.bar-top {
			top: 0;
			left: 0;
			right: 0;
			height: 24%;
			border-width: 0 0 1px 0;
			animation: crop-vertical 3.2s ease-in-out infinite;
		}

		&.bar-bottom {
			bottom: 0;
			left: 0;
			right: 0;
			height: 24%;
			border-width: 1px 0 0 0;
			animation: crop-vertical 3.2s ease-in-out infinite;
		}

		&.bar-left {
			top: 0;
			left: 0;
			bottom: 0;
			width: 24%;
			border-width: 0 1px 0 0;
			animation: crop-horizontal 3.2s ease-in-out infinite;
		}

		&.bar-right {
			top: 0;
			right: 0;
			bottom: 0;
			width: 24%;
			border-width: 0 0 0 1px;
			animation: crop-horizontal 3.2s ease-in-out infinite;
		}
	}

	.styleshift-blackbars-card:hover:not(.disabled) {
		.preview {
			box-shadow:
				inset 0 0 6px rgba(0, 0, 0, 0.6),
				0 0 0 1px var(--fg-opacity-20);
		}
	}

	.card-label {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		justify-content: center;

		span {
			font-size: 12px;
			color: var(--fg-opacity-80);
			font-weight: 500;
			transition: color 0.25s ease;
		}
	}

	.experimental-badge {
		font-size: 9px !important;
		font-weight: 700 !important;
		padding: 2px 5px;
		border-radius: 4px;
		background: var(--theme-warning-15);
		border: 1px solid var(--theme-warning-20);
		color: var(--theme-warning) !important;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.check {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		color: var(--text-primary);
		background: var(--theme-0);
		box-shadow: 0 2px 8px var(--shadow-color);
		opacity: 0;
		transform: scale(0.4);
		transition:
			opacity 0.2s ease,
			transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.styleshift-blackbars-card.selected .check {
		opacity: 1;
		transform: scale(1);
	}

	@keyframes crop-vertical {
		0%,
		100% {
			height: 24%;
			opacity: 1;
		}
		50% {
			height: 10%;
			opacity: 1;
		}
	}

	@keyframes crop-horizontal {
		0%,
		100% {
			width: 24%;
			opacity: 1;
		}
		50% {
			width: 10%;
			opacity: 1;
		}
	}

	@keyframes card-pop {
		0% {
			transform: scale(1);
		}
		45% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.styleshift-blackbars-card,
		.bar,
		.check {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
