<script lang="ts">
	import { sequencedTask } from "@/core/shared/utilities";
	import { getFromStorage, getRootValue } from "@core/storage/manager";
	import { colorObjToHex, hexToColorObj } from "@core/utils/colors";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Slider from "../controls/Slider.svelte";
	import Description from "../base/Description.svelte";

	let {
		setting,
	}: {
		setting: Extract<Setting, { type: "color" }>;
	} = $props();

	let hex = $state("#ffffff");
	let alpha = $state(100);

	async function init() {
		let value;
		if (setting.id) {
			value = await getFromStorage(setting.id);
		} else {
			value = setting.value;
		}
		const colorObj = hexToColorObj(value || "#ffffff");
		hex = colorObj.hex;
		alpha = colorObj.alpha;
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			const colorObj = hexToColorObj(setting.value || "#ffffff");
			hex = colorObj.hex;
			alpha = colorObj.alpha;
		}
	});

	const name = $derived(setting.name);
	const description = $derived(setting.description);

	async function handleUpdate() {
		const hexValue = colorObjToHex({ hex, alpha });
		if (setting.id) {
			await setAndSave(setting, hexValue);
			await triggerSettingUpdate(setting.id);
		} else if (typeof (setting as any).updateFunction === "function") {
			await (setting as any).updateFunction(hexValue);
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

	async function handleAlphaChange(newAlpha: number) {
		alpha = newAlpha;
		await sequencedUpdate();
	}
</script>

<div class="styleshift-color-top-section">
	<Description {name} {description} />
	<div class="styleshift-color-preview-wrapper">
		<div class="styleshift-color-preview" style="background-color: {hex}; opacity: {alpha / 100}"></div>
		<input type="color" class="styleshift-color-input" bind:value={hex} oninput={handleInput} onchange={handleChange} />
	</div>
</div>

<div class="styleshift-color-alpha-section">
	<Slider
		showHoverPreview={false}
		setting={{
			type: "numberSlide",
			name: "Opacity",
			min: 0,
			max: 100,
			unit: "%",
			value: alpha,
			id: "",
			updateFunction: handleAlphaChange,
		}}
	/>
</div>

<style lang="scss">
	.styleshift-color-top-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		margin-bottom: 12px;
	}

	.styleshift-color-preview-wrapper {
		position: relative;
		min-width: 50px;
		width: 50px;
		min-height: 50px;
		height: 50px;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: rgba(0, 0, 0, 0.34) 1px 1px 7px;
		transition: all 0.2s;
		background-image:
			linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%);
		background-size: 10px 10px;

		&:hover {
			transform: scale(1.1);
		}
	}

	.styleshift-color-preview {
		width: 100%;
		height: 100%;
	}

	.styleshift-color-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}

	.styleshift-color-alpha-section {
		width: 100%;

		:global(.styleshift-setting-frame) {
			background: transparent !important;
			border: none !important;
			padding: 0 !important;
			margin: 0 !important;
		}

		:global(.setting-name) {
			font-size: 14px !important;
			opacity: 0.7 !important;
		}
	}
</style>
