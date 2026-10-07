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

	// Derived values that fallback to defaults if setting properties are missing
	const name = $derived(setting.name);
	const description = $derived(setting.description);
	const min = $derived(setting.min ?? 0);
	const max = $derived(setting.max ?? 100);
	const step = $derived(setting.step ?? 1);
	const unit = $derived(setting.unit ?? "");

	async function handleUpdate() {
		if (setting.id) {
			await setAndSave(setting, value);
			await triggerSettingUpdate(setting.id);
		} else if (typeof setting.updateFunction === "function") {
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

	<input
		type="range"
		class="styleshift-slider-range"
		{min}
		{max}
		{step}
		bind:value
		oninput={handleInput}
		onchange={handleChange}
	/>
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

	.styleshift-slider-range {
		--slider-thumb-size: 15px;
		--slider-thumb-radius: calc(var(--slider-thumb-size) / 2);

		appearance: none;
		-webkit-appearance: none;
		width: 100%;
		height: 15px;
		border-radius: 20px;
		background: var(--slider-track);
		outline: none;
		overflow: hidden;
		transition: all 0.2s;
		filter: brightness(1) drop-shadow(1px 1px 4px var(--bg-overlay-40));
		margin-top: 10px;

		&:hover {
			filter: brightness(1.3) drop-shadow(1px 1px 4px var(--bg-overlay-40));
		}

		&::-webkit-slider-runnable-track {
			height: 15px;
			background: var(--slider-track);
			border-radius: 20px;
		}

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: var(--slider-thumb-size);
			height: var(--slider-thumb-size);
			background-color: white;
			border-radius: 50%;
			border: 2px solid var(--theme-0);
			cursor: pointer;
			box-shadow: -2000px 0 0 calc(2000px + var(--slider-thumb-radius)) var(--theme-0);
		}

		&::-moz-range-track {
			height: 15px;
			background: var(--slider-track);
			border-radius: 20px;
		}

		&::-moz-range-progress {
			height: 15px;
			background: var(--theme-0);
			border-radius: 20px 0 0 20px;
		}

		&::-moz-range-thumb {
			width: var(--slider-thumb-size);
			height: var(--slider-thumb-size);
			background-color: white;
			border-radius: 50%;
			border: 2px solid var(--theme-0);
			cursor: pointer;
			box-sizing: border-box;
		}
	}
</style>
