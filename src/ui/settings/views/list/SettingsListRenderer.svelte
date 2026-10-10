<script lang="ts">
	import type { Category, SeparateCategory } from "@settings/types/styleshiftTypes";
	import Title from "@base/Title.svelte";
	import { getCategoryParts } from "@ui/window/utils";
	import SettingRenderer from "@renderers/setting/SettingRenderer.svelte";
	import SettingsGroup from "@base/SettingsGroup.svelte";
	import AddSettingButton from "../developer/AddSettingButton.svelte";
	import { categoryKey, settingKeys } from "@ui/settings/listKeys";
	import { addDropTarget, removeDropTarget } from "@ui/settings/reorder";

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

	/** Lets a setting be dropped on a category's list, so empty categories can receive settings. */
	function categoryDropZone(node: HTMLElement, category: Category) {
		const parent = node.parentElement!;
		addDropTarget(node, parent, category, "categoryList");
		return {
			update: (next: Category) => addDropTarget(node, parent, next, "categoryList"),
			destroy: () => removeDropTarget(node),
		};
	}
</script>

{#each items as item (categoryKey(item))}
	{#if isHeaderItem(item)}
		<div class="styleshift-category-separator"></div>
	{:else}
		{@const category = item}
		{@const parts = getCategoryParts(category.category)}
		{@const keys = settingKeys(category.settings)}
		<SettingsGroup className="styleshift-category-frame" attrs={{ "data-category": parts.text }}>
			<Title
				text={parts.text}
				icon={parts.icon}
				rainbow={category.rainbow}
				{isDeveloperMode}
				editable={category.editable}
			/>
			<div class="styleshift-settings-items" class:grid={category.layout === "grid"} use:categoryDropZone={category}>
				{#each category.settings as setting, j (keys[j])}
					<SettingRenderer {setting} {category} highlight={searchQuery} layout={category.layout} />
				{/each}
				{#if isDeveloperMode && category.editable}
					<AddSettingButton {category} />
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

	/* Flex wrap with grow fills every row, including a partly filled last row, for any card count. */
	.styleshift-settings-items.grid {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: stretch;

		> :global(*) {
			flex: 1 1 150px;
		}
	}
</style>
