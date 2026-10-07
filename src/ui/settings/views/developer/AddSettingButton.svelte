<script lang="ts">
	import { createSettingPreset, isSettingKind } from "@settings/registry/defaultItems";
	import { addSetting } from "@settings/registry/items";
	import Button from "../controls/Button.svelte";
	import * as mainSettingUi from "../controls/controls";
	import Dropdown from "../controls/Dropdown.svelte";

	let { categorySettings } = $props();
	let isOpen = $state(false);
	let triggerEl = $state<HTMLElement | null>(null);

	const options = Object.keys(mainSettingUi).filter((key) => key !== "search");

	async function handleSelect(selected: string) {
		if (!isSettingKind(selected)) return;
		await addSetting(categorySettings, {
			...createSettingPreset(selected),
			editable: true,
		});
	}
</script>

<div bind:this={triggerEl} class="styleshift-add-setting-button-wrapper">
	<Button
		setting={{
			type: "button",
			name: "+",
			color: "#FFFFFF",
			clickFunction: () => (isOpen = !isOpen),
		}}
		style="border-radius: 1000px; padding: 10px; width: 100%;"
	/>
	<Dropdown
		justMenu={true}
		bind:isOpen
		{triggerEl}
		setting={{
			type: "dropdown",
			id: "addSettingDropdown",
			name: "Add Setting",
			value: "",
			options: options.map((opt) => ({ label: opt, value: opt })),
			updateFunction: handleSelect,
		}}
	/>
</div>

<style lang="scss">
	.styleshift-add-setting-button-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		position: relative;
	}
</style>
