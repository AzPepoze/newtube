<script lang="ts">
	import { createSettingPreset, isSettingKind } from "@settings/registry/defaultItems";
	import { addSettingToCategory } from "@settings/registry/items";
	import type { Category } from "@settings/types/styleshiftTypes";
	import { openSettingCatalog } from "@ui/window/settingCatalog";
	import Button from "../controls/Button.svelte";

	let { category }: { category: Category } = $props();

	async function handleSelect(selected: string) {
		if (!isSettingKind(selected)) return;
		await addSettingToCategory(category, {
			...createSettingPreset(selected),
			editable: true,
		});
	}

	function openCatalog() {
		openSettingCatalog(handleSelect);
	}
</script>

<div class="styleshift-add-setting-button-wrapper">
	<Button
		setting={{
			type: "button",
			name: "+",
			color: "#FFFFFF",
			clickFunction: openCatalog,
		}}
		style="border-radius: 1000px; padding: 10px; width: 100%;"
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
