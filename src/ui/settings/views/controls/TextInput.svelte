<script lang="ts">
	import { sequencedTask } from "@/core/shared/utilities";
	import { getFromStorage, getRootValue } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";

	let {
		setting,
		placeholder = "Type here...",
	}: {
		setting: Extract<Setting, { type: "textInput" }>;
		placeholder?: string;
	} = $props();

	let value = $state("");

	async function init() {
		value = setting.value ?? "";
		if (setting.id) {
			const storedValue = await getFromStorage(setting.id);
			if (storedValue !== undefined && storedValue !== null) value = storedValue;
		}
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			value = setting.value as string;
		}
	});

	const name = $derived(setting.name);
	const description = $derived(setting.description);

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

<div class="styleshift-text-input-container">
	<Description {name} {description} />
	<div class="styleshift-input-wrapper">
		<input
			type="text"
			class="styleshift-input"
			{placeholder}
			bind:value
			oninput={handleInput}
			onchange={handleChange}
		/>
	</div>
</div>

<style lang="scss">
	.styleshift-text-input-container {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		width: 100%;
	}

	.styleshift-input-wrapper {
		flex: 1;
		min-width: 200px;
	}

	.styleshift-input {
		width: -webkit-fill-available;
		background: var(--text-editor-bg);
		color: white;
		border-radius: 20px;
		padding: 10px 20px;
		font-family: inherit;
		font-size: 15px;
		outline: none;
		transition: all 0.2s;
		border: 1px gray solid;

		&:focus {
			border-color: var(--theme-0);
		}

		&::placeholder {
			color: var(--fg-opacity-20);
		}
	}
</style>
