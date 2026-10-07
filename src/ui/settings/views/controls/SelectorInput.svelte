<script lang="ts">
	import { sequencedTask } from "@/core/shared/utilities";
	import { getFromStorage, getRootValue } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { openSelectorPicker, closeSelectorPicker } from "@ui/highlight/selectorPicker";
	import { setAndSave } from "@ui/settings/settingsApi";
	import Description from "../base/Description.svelte";
	import Icon from "../base/Icon.svelte";

	let {
		setting,
		placeholder = "CSS Selector...",
	}: {
		setting: Extract<Setting, { type: "selectorInput" }>;
		placeholder?: string;
	} = $props();

	let value = $state("");
	let isPicking = $state(false);

	async function init() {
		value = (setting.value as string) || "";
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

	async function handleUpdate(newValue: string) {
		value = newValue;
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
			sequencedUpdate(value);
		}
	}

	async function handleChange() {
		await sequencedUpdate(value);
	}

	async function togglePicking() {
		if (isPicking) {
			closeSelectorPicker();
			isPicking = false;
			return;
		}

		isPicking = true;
		await openSelectorPicker(
			(newSelector) => {
				handleUpdate(newSelector);
				isPicking = false;
			},
			() => {
				// On Cancel (Esc or manual stop)
				isPicking = false;
			},
		);
	}
</script>

<div class="styleshift-selector-input-container">
	<Description {name} {description} />
	<div class="styleshift-input-group">
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
		<button class="styleshift-pick-button" class:is-picking={isPicking} onclick={togglePicking} type="button">
			<Icon name="⌖" size={18} />
			<span>{isPicking ? "Cancel Picking" : "Pick Element"}</span>
		</button>
	</div>
</div>

<style lang="scss">
	.styleshift-selector-input-container {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		width: 100%;
	}

	.styleshift-input-group {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 250px;
		gap: 12px;
		align-items: stretch;
	}

	.styleshift-input-wrapper {
		flex: 1;
	}

	.styleshift-input {
		width: -webkit-fill-available;
		background: var(--text-editor-bg);
		color: var(--font-color);
		border-radius: 20px;
		padding: 12px 20px;
		font-family: "Fira Code", monospace;
		font-size: 14px;
		outline: none;
		transition: all 0.2s;
		border: 1px gray solid;

		&:focus {
			border-color: var(--theme-0);
			box-shadow: 0 0 15px rgba(127, 93, 183, 0.2);
		}

		&::placeholder {
			color: var(--fg-opacity-20);
		}
	}

	.styleshift-pick-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background: var(--theme-0);
		color: white;
		border: none;
		border-radius: 20px;
		padding: 0 20px;
		height: 42px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 10px rgba(127, 93, 183, 0.3);
		font-weight: 600;
		font-size: 14px;
		white-space: nowrap;

		&:hover {
			transform: translateY(-2px);
			filter: brightness(1.1);
			box-shadow: 0 6px 15px rgba(127, 93, 183, 0.5);
		}

		&:active {
			transform: translateY(0);
		}

		&.is-picking {
			background: #f44336;
			animation: pulse 1.5s infinite;
		}

		span {
			line-height: 1;
		}
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
		}
	}
</style>
