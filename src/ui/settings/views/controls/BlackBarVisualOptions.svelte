<script lang="ts">
	import { getFromStorage } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";

	let {
		setting,
		disabled = false,
	}: {
		setting: Extract<Setting, { type: "custom" }> | any;
		disabled?: boolean;
	} = $props();

	let value = $state<"vertical" | "horizontal" | "both">("vertical");

	async function init() {
		if (setting.id) {
			const stored = await getFromStorage(setting.id);
			if (stored === "vertical" || stored === "horizontal" || stored === "both") {
				value = stored;
			} else if (setting.value) {
				value = setting.value as "vertical" | "horizontal" | "both";
			}
		} else if (setting.value) {
			value = setting.value as "vertical" | "horizontal" | "both";
		}
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			value = setting.value as "vertical" | "horizontal" | "both";
		}
	});

	const name = $derived(setting.name || "Crop Direction");
	const description = $derived(setting.description || "Choose direction for black bar removal.");

	async function selectMode(mode: "vertical" | "horizontal" | "both") {
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

	<div class="styleshift-blackbars-grid">
		<!-- Vertical Option -->
		<button
			type="button"
			class="styleshift-blackbars-card"
			class:selected={value === "vertical"}
			class:disabled
			onclick={() => selectMode("vertical")}
		>
			<div class="styleshift-blackbars-preview vertical-crop">
				<div class="bar bar-top"></div>
				<div class="content-area">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
				<div class="bar bar-bottom"></div>
			</div>
			<div class="card-label">
				<span>Vertical</span>
			</div>
		</button>

		<!-- Horizontal Option (Experimental) -->
		<button
			type="button"
			class="styleshift-blackbars-card"
			class:selected={value === "horizontal"}
			class:disabled
			onclick={() => selectMode("horizontal")}
		>
			<div class="styleshift-blackbars-preview horizontal-crop">
				<div class="bar bar-left"></div>
				<div class="content-area">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
				<div class="bar bar-right"></div>
			</div>
			<div class="card-label">
				<span>Horizontal</span>
				<span class="experimental-badge">Experimental</span>
			</div>
		</button>

		<!-- Both Option -->
		<button
			type="button"
			class="styleshift-blackbars-card"
			class:selected={value === "both"}
			class:disabled
			onclick={() => selectMode("both")}
		>
			<div class="styleshift-blackbars-preview both-crop">
				<div class="bar bar-top"></div>
				<div class="bar bar-bottom"></div>
				<div class="bar bar-left"></div>
				<div class="bar bar-right"></div>
				<div class="content-area">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path d="M8 5v14l11-7z" />
					</svg>
				</div>
			</div>
			<div class="card-label">
				<span>Both</span>
			</div>
		</button>
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
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: var(--bg-overlay-20, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--fg-opacity-10, rgba(255, 255, 255, 0.1));
		border-radius: 12px;
		padding: 10px;
		cursor: pointer;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		outline: none;

		&:hover:not(.disabled) {
			border-color: rgba(255, 255, 255, 0.3);
			transform: translateY(-2px);
			background: var(--bg-overlay-30, rgba(255, 255, 255, 0.08));
		}

		&.selected {
			border-color: rgba(255, 255, 255, 0.8);
			background: rgba(255, 255, 255, 0.15);
			box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);

			.card-label span {
				color: var(--text-primary, #ffffff);
				font-weight: 700;
			}
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.styleshift-blackbars-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #111;
		border-radius: 6px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.8);

		.content-area {
			display: flex;
			align-items: center;
			justify-content: center;
			color: rgba(255, 255, 255, 0.7);
			z-index: 1;
		}

		.bar {
			position: absolute;
			background: rgba(255, 68, 68, 0.6);
			backdrop-filter: blur(1px);
			z-index: 2;

			&.bar-top {
				top: 0;
				left: 0;
				right: 0;
				height: 22%;
				border-bottom: 1px dashed rgba(255, 255, 255, 0.5);
			}

			&.bar-bottom {
				bottom: 0;
				left: 0;
				right: 0;
				height: 22%;
				border-top: 1px dashed rgba(255, 255, 255, 0.5);
			}

			&.bar-left {
				top: 0;
				left: 0;
				bottom: 0;
				width: 22%;
				border-right: 1px dashed rgba(255, 255, 255, 0.5);
			}

			&.bar-right {
				top: 0;
				right: 0;
				bottom: 0;
				width: 22%;
				border-left: 1px dashed rgba(255, 255, 255, 0.5);
			}
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
			color: var(--fg-opacity-80, rgba(255, 255, 255, 0.8));
			font-weight: 500;
		}
	}

	.experimental-badge {
		font-size: 9px !important;
		font-weight: 700 !important;
		padding: 2px 5px;
		border-radius: 4px;
		background: var(--theme-warning-15, rgba(255, 187, 51, 0.15));
		border: 1px solid var(--theme-warning-20, rgba(255, 187, 51, 0.2));
		color: var(--theme-warning, #ffbb33) !important;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>
