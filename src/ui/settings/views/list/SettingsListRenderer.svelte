<script lang="ts">
	import type { Category, SeparateCategory } from "@settings/types/styleshiftTypes";
	import Title from "@base/Title.svelte";
	import { getCategoryParts } from "@ui/window/utils";
	import SettingRenderer from "@renderers/setting/SettingRenderer.svelte";
	import SettingsGroup from "@base/SettingsGroup.svelte";
	import AddSettingButton from "../developer/AddSettingButton.svelte";

	let {
		items = [],
		searchQuery = "",
		isDeveloperMode = false,
	}: {
		items: (Category | SeparateCategory)[];
		searchQuery?: string;
		isDeveloperMode?: boolean;
	} = $props();

	function isHeaderItem(item: Category | SeparateCategory): item is SeparateCategory {
		return "isHeader" in item;
	}
</script>

{#each items as item, i (i)}
	{#if isHeaderItem(item)}
		<div class="styleshift-category-separator"></div>
	{:else}
		{@const category = item}
		{@const parts = getCategoryParts(category.category)}
		<SettingsGroup className="styleshift-category-frame" attrs={{ "data-category": parts.text }}>
			<Title
				text={parts.text}
				icon={parts.icon}
				rainbow={category.rainbow}
				{isDeveloperMode}
				editable={category.editable}
			/>
			<div class="styleshift-settings-items" class:grid={category.layout === "grid"}>
				{#each category.settings as setting, j (j)}
					<SettingRenderer {setting} {category} highlight={searchQuery} layout={category.layout} />
				{/each}
				{#if isDeveloperMode && category.editable}
					<AddSettingButton categorySettings={category.settings} />
				{/if}
			</div>
		</SettingsGroup>
	{/if}
{/each}

<style lang="scss">
	.styleshift-category-separator {
		height: 1px;
		background: var(--fg-opacity-10);
		margin: 20px 0 10px;
	}

	.styleshift-settings-items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@container settings-group (min-width: 520px) {
		.styleshift-settings-items.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
			align-items: stretch;
		}
	}
</style>
