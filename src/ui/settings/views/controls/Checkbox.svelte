<script lang="ts">
	import { getFromStorage } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";

	let {
		setting,
		value = $bindable(false),
		hideLabel = false,
		disabled = false,
	}: {
		setting: Extract<Setting, { type: "checkbox" }>;
		value?: boolean;
		hideLabel?: boolean;
		disabled?: boolean;
	} = $props();

	const isLocked = $derived(disabled || (setting.lock?.condition ?? false));

	async function init() {
		if (isLocked) {
			value = false;
			return;
		}
		if (setting.id) {
			value = await getFromStorage(setting.id);
		} else {
			value = setting.value;
		}
	}
	init();

	$effect(() => {
		if (isLocked) {
			value = false;
		} else if (!setting.id && setting.value !== undefined) {
			value = setting.value;
		}
	});

	const name = $derived(setting.name || "");
	const description = $derived(setting.description || "");

	async function handleChange() {
		if (isLocked) return;
		if (setting.id) {
			await setAndSave(setting, value);
			triggerSettingUpdate(setting.id);
		} else if (typeof (setting as any).updateFunction === "function") {
			(setting as any).updateFunction(value);
		}
	}
</script>

{#if !hideLabel}
	<Description {name} {description} />
{/if}
<input type="checkbox" class="styleshift-checkbox" bind:checked={value} onchange={handleChange} disabled={isLocked} />

<style lang="scss">
	.styleshift-checkbox {
		font-size: 20px;
		appearance: none;
		width: 3.6em;
		height: 1.8em;
		background: var(--bg-input);
		border-radius: 99px;
		position: relative;
		cursor: pointer;
		outline: none;
		transition: all 0.2s;
		box-shadow: 0px 0px 3px var(--shadow-color);
		margin: 0px;

		&:hover {
			filter: brightness(1.2);
			scale: 1.05;
		}

		&:checked {
			background: var(--theme-0, #7f5db7);

			&:after {
				left: calc(100% - 1.5em - 0.15em) !important;
				transform: rotate(180deg) !important;
				filter: drop-shadow(0px 0px 2px var(--shadow-color));
			}
		}

		&:after {
			position: absolute;
			display: flex;
			content: "❖";
			font-weight: 1000;
			width: 1.5em;
			height: 1.5em;
			border-radius: 50%;
			background: white !important;
			box-shadow: 0 0 0.25em var(--shadow-color);
			left: 0.15em;
			top: 50%;
			translate: 0 -50%;
			transition: all 0.3s;
			justify-content: center;
			color: black !important;
			align-items: center;
			font-size: 20px;
		}
	}
</style>
