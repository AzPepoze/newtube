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
		}
		if (typeof (setting as any).updateFunction === "function") {
			(setting as any).updateFunction(value);
		}
	}
</script>

{#if !hideLabel}
	<Description {name} {description} />
{/if}
<label class="styleshift-switch" class:is-disabled={isLocked}>
	<input
		type="checkbox"
		class="styleshift-switch-input"
		bind:checked={value}
		onchange={handleChange}
		disabled={isLocked}
	/>
	<span class="styleshift-switch-track">
		<span class="styleshift-switch-knob"></span>
	</span>
</label>

<style lang="scss">
	.styleshift-switch {
		position: relative;
		display: inline-block;
		width: 3.6em;
		height: 1.8em;
		font-size: 20px;
		flex-shrink: 0;
		cursor: pointer;

		&.is-disabled {
			cursor: not-allowed;
		}

		&:hover .styleshift-switch-track {
			filter: brightness(1.2);
			scale: 1.05;
		}
	}

	.styleshift-switch-input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		margin: 0;
	}

	.styleshift-switch-input:focus-visible + .styleshift-switch-track {
		outline: 3px solid var(--theme-0-light);
		outline-offset: 2px;
	}

	.styleshift-switch-track {
		position: absolute;
		inset: 0;
		border-radius: 99px;
		background: var(--bg-input);
		box-shadow: 0 0 3px var(--shadow-color);
		transition:
			background 0.2s ease,
			filter 0.2s ease,
			scale 0.2s ease;
	}

	.styleshift-switch-input:checked + .styleshift-switch-track {
		background: var(--theme-0);
	}

	.styleshift-switch-knob {
		position: absolute;
		top: 50%;
		left: 0.15em;
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		background: white;
		box-shadow: 0 0 0.25em var(--shadow-color);
		display: grid;
		place-items: center;
		translate: 0 -50%;
		transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.styleshift-switch-input:checked + .styleshift-switch-track .styleshift-switch-knob {
		transform: translateX(calc(3.6em - 1.5em - 0.3em));
	}
</style>
