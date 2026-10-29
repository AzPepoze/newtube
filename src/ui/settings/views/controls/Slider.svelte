<script lang="ts">
	import { sequencedTask } from "@/core/shared/utilities";
	import { getFromStorage, getRootValue } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";

	let {
		setting,
		showHoverPreview = true,
	}: {
		setting: Extract<Setting, { type: "numberSlide" }>;
		showHoverPreview?: boolean;
	} = $props();

	let value = $state(0);

	async function init() {
		value = setting.value ?? 0;
		if (setting.id) {
			const storedValue = await getFromStorage(setting.id);
			if (storedValue !== undefined && storedValue !== null) value = storedValue;
		}
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			value = setting.value;
		}
	});

	const name = $derived(setting.name);
	const description = $derived(setting.description);
	const min = $derived(setting.min ?? 0);
	const max = $derived(setting.max ?? 100);
	const step = $derived(setting.step ?? 1);
	const unit = $derived(setting.unit ?? "");

	function getRatio(current: number, low: number, high: number) {
		if (high === low) return 0;
		return Math.min(1, Math.max(0, ((Number(current) || 0) - low) / (high - low)));
	}

	const ratio = $derived(getRatio(value, min, max));
	const trackStyle = $derived(`--p: ${ratio * 100}%; --ratio: ${ratio};`);

	async function handleUpdate() {
		if (setting.id) {
			await setAndSave(setting, value);
			await triggerSettingUpdate(setting.id);
		}
		if (typeof setting.updateFunction === "function") {
			await setting.updateFunction(value);
		}
	}

	const sequencedUpdate = sequencedTask(handleUpdate);

	async function handleInput() {
		if (await getRootValue("enableRealtimeExtension")) {
			sequencedUpdate();
		}
	}

	async function handleChange() {
		await sequencedUpdate();
	}
</script>

<div class="styleshift-slider-container">
	<div class="styleshift-slider-header">
		<Description {name} {description} {showHoverPreview} />
		<div class="styleshift-slider-value-wrapper">
			<input
				type="number"
				class="styleshift-slider-number-input"
				bind:value
				oninput={handleInput}
				onchange={handleChange}
				{min}
				{max}
				{step}
			/>
			{#if unit}
				<span class="styleshift-slider-unit">{unit}</span>
			{/if}
		</div>
	</div>

	<div class="styleshift-slider-track" style={trackStyle}>
		<span class="styleshift-slider-bubble">{value}{unit}</span>
		<div class="styleshift-slider-line">
			<div class="styleshift-slider-fill"></div>
		</div>
		<input
			type="range"
			class="styleshift-slider-range"
			aria-label={name}
			{min}
			{max}
			{step}
			bind:value
			oninput={handleInput}
			onchange={handleChange}
		/>
	</div>
</div>

<style lang="scss">
	.styleshift-slider-container {
		width: 100%;
	}

	.styleshift-slider-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		gap: 10px;
	}

	.styleshift-slider-value-wrapper {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.styleshift-slider-number-input {
		width: 50px;
		height: 18px;
		background: var(--bg-input);
		border: none;
		box-shadow: 0px 0px 3px white;
		padding-inline: 8px;
		padding-block: 4px;
		text-align: center;
		color: var(--fg-opacity-100);
		font-family: inherit;
		font-size: 14px;
		font-weight: bold;
		outline: none;
		border-radius: 20px;
		appearance: textfield;
		-moz-appearance: textfield;

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
	}

	.styleshift-slider-unit {
		font-size: 12px;
		opacity: 0.6;
		font-weight: bold;
		color: white;
	}

	/* Room above the track for the value bubble. */
	.styleshift-slider-track {
		position: relative;
		display: flex;
		align-items: center;
		height: 28px;
		margin-top: 26px;
	}

	.styleshift-slider-line {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		height: 14px;
		border-radius: 999px;
		background: var(--fg-opacity-20);
		box-shadow: inset 0 0 0 1px var(--fg-opacity-10);
		overflow: hidden;
	}

	.styleshift-slider-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: var(--p);
		border-radius: 999px;
		background-color: var(--theme-0);
		background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.3) 0 8px, transparent 8px 16px);
		box-shadow: 0 0 10px var(--theme-0);
		background-size: 23px 23px;
		animation: styleshift-slider-stripes 0.8s linear infinite;
		transition: width 0.12s ease-out;
	}

	@keyframes styleshift-slider-stripes {
		to {
			background-position: 23px 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.styleshift-slider-fill {
			animation: none;
		}
	}

	.styleshift-slider-bubble {
		position: absolute;
		bottom: 100%;
		left: calc(9px + (100% - 18px) * var(--ratio));
		transform: translate(-50%, -4px);
		padding: 3px 8px;
		border-radius: 8px;
		background: var(--theme-0);
		color: #ffffff;
		font-size: 12px;
		font-weight: 700;
		line-height: 1.4;
		text-align: center;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.15s,
			transform 0.15s;

		&::after {
			content: "";
			position: absolute;
			top: 100%;
			left: 50%;
			transform: translateX(-50%);
			border: 5px solid transparent;
			border-top-color: var(--theme-0);
		}
	}

	.styleshift-slider-track:is(:hover, :focus-within, :active) .styleshift-slider-bubble {
		opacity: 1;
		transform: translate(-50%, -8px);
	}

	.styleshift-slider-range {
		position: relative;
		width: 100%;
		height: 28px;
		margin: 0;
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
		cursor: pointer;
		outline: none;

		&::-webkit-slider-runnable-track {
			height: 28px;
			background: transparent;
		}

		&::-moz-range-track {
			height: 28px;
			background: transparent;
		}

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 18px;
			height: 18px;
			margin-top: 5px;
			border-radius: 50%;
			background: #ffffff;
			border: 0;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
			transition:
				transform 0.15s ease,
				box-shadow 0.15s ease;
		}

		&::-moz-range-thumb {
			width: 18px;
			height: 18px;
			border-radius: 50%;
			background: #ffffff;
			border: 0;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
			transition: transform 0.15s ease;
		}

		&:focus-visible::-webkit-slider-thumb {
			box-shadow: 0 0 0 4px rgba(127, 93, 183, 0.5);
		}

		&:active::-webkit-slider-thumb {
			transform: scale(1.2);
		}

		&:active::-moz-range-thumb {
			transform: scale(1.2);
		}
	}
</style>
