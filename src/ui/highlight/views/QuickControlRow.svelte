<script lang="ts">
	import Checkbox from "@controls/Checkbox.svelte";
	import ColorPicker from "@controls/ColorPicker.svelte";
	import Dropdown from "@controls/Dropdown.svelte";
	import Slider from "@controls/Slider.svelte";
	import TextInput from "@controls/TextInput.svelte";
	import type { QuickControl } from "../quickCustomizeControls";

	let {
		ctrl,
		enabled = $bindable(false),
		value = $bindable(""),
	}: {
		ctrl: QuickControl;
		enabled: boolean;
		value: any;
	} = $props();

	// Touching a control turns its row on, so changes are never silently dropped.
	const currentSetting: any = $derived({
		...ctrl,
		name: ctrl.label,
		value,
		id: "",
		updateFunction: (val: any) => {
			value = val;
			enabled = true;
		},
	});
</script>

<div class="control-row">
	<div class="toggle-side">
		<Checkbox
			hideLabel={true}
			setting={{
				type: "checkbox",
				id: "",
				name: "",
				value: enabled,
				updateFunction: (v) => (enabled = v),
			}}
		/>
	</div>
	<div class="input-side">
		{#if ctrl.type === "color"}
			<ColorPicker setting={currentSetting} />
		{:else if ctrl.type === "textInput"}
			<TextInput setting={currentSetting} placeholder={ctrl.placeholder} />
		{:else if ctrl.type === "numberSlide"}
			<Slider setting={currentSetting} />
		{:else if ctrl.type === "dropdown"}
			<Dropdown setting={currentSetting} inline={true} />
		{/if}
	</div>
</div>

<style lang="scss">
	.control-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		min-width: 0;
		border-radius: 14px;
		transition: background 0.2s ease;

		&:hover {
			background: var(--fg-opacity-03);
		}

		.toggle-side {
			flex-shrink: 0;
		}

		.input-side {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;

			:global(.styleshift-main-description .setting-name) {
				font-size: 14px;
				font-weight: 600;
				opacity: 0.9;
			}
		}
	}
</style>
