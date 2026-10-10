<script lang="ts">
	import SettingsListRenderer from "@renderers/list/SettingsListRenderer.svelte";
	import type { Category, SeparateCategory } from "@settings/types/styleshiftTypes";
	import SidebarNavItem from "@base/SidebarNavItem.svelte";
	import SidebarHeader from "@base/SidebarHeader.svelte";
	import ResizeBar from "@ui/shared/views/ResizeBar.svelte";
	import SidebarScrollLayout from "@ui/shared/views/SidebarScrollLayout.svelte";
	import { slide } from "svelte/transition";
	import { getCategoryParts } from "@ui/window/utils";
	import Search from "../base/Search.svelte";
	import { SettingsWindowController } from "../../SettingsWindowController.svelte";

	let {
		internalSettings = [],
		externalSettings = [],
		showCategoryList = true,
		devOnlyItems = [],
		isDeveloperMode = false,
		isDevModulesLoaded = false,
		skipAnimation = false,
		onClose: _onClose = () => {},
		onAddCategory = () => {},
	}: {
		internalSettings: (Category | SeparateCategory)[];
		externalSettings?: Category[];
		showCategoryList?: boolean;
		devOnlyItems?: Category[];
		isDeveloperMode?: boolean;
		isDevModulesLoaded?: boolean;
		skipAnimation?: boolean;
		onClose?: () => void;
		onAddCategory?: () => void | Promise<void>;
	} = $props();

	const controller = new SettingsWindowController({
		get internalSettings() {
			return internalSettings;
		},
		get externalSettings() {
			return externalSettings || [];
		},
		get devOnlyItems() {
			return devOnlyItems || [];
		},
		get isDeveloperMode() {
			return isDeveloperMode;
		},
		get isDevModulesLoaded() {
			return isDevModulesLoaded;
		},
		get onAddCategory() {
			return onAddCategory;
		},
	});

	$effect(() => {
		if (controller.leftSidebar) {
			controller.clearTargets();
		}
	});
</script>

<div class="styleshift-settings-main" class:skip-animation={skipAnimation}>
	<SidebarScrollLayout
		attribute="data-category"
		bind:activeValue={controller.activeCategoryLabel}
		sidebarWidth={controller.sidebarWidth}
		showSidebar={showCategoryList}
		sidebarClass="styleshift-sidebar styleshift-scrollable"
		contentClass="styleshift-settings-list styleshift-scrollable"
		bind:sidebarEl={controller.leftSidebar}
	>
		{#snippet sidebar({ scrollTo })}
			{#each controller.sidebarData as item, i (controller.sidebarKey(item))}
				{#if controller.isHeaderItem(item)}
					<SidebarHeader
						label={item.label}
						centered={item.label === "BUILD-IN" || item.label === "ADD-ON"}
						delay={skipAnimation ? "0ms" : `${i * 50}ms`}
					/>
				{:else}
					{@const category = item}
					{@const parts = getCategoryParts(category.category)}
					<SidebarNavItem
						category={category.category}
						selected={controller.activeCategoryLabel === parts.text}
						{isDeveloperMode}
						editable={category.editable}
						onSelect={() => scrollTo(parts.text)}
						onMove={(dir) => controller.moveCategory(category, dir)}
						action={(node, arg) => controller.setupDragAndDrop(node, arg)}
						actionArg={category}
						style="animation-delay: {skipAnimation ? '0ms' : i * 50 + 'ms'};"
					/>
				{/if}
			{/each}

			{#if isDeveloperMode && isDevModulesLoaded}
				<button
					class="styleshift-add-category-button"
					onclick={controller.handleAddCategory}
					transition:slide={{ duration: 220 }}
				>
					+
				</button>
			{/if}
		{/snippet}

		{#snippet resizer()}
			<ResizeBar onResizeStart={controller.handleResizeStart} onResizeKeys={controller.handleResizeKeys} />
		{/snippet}

		{#snippet header()}
			<Search bind:value={controller.searchQuery} />
		{/snippet}

		{#if controller.buildInItemsData.length > 0}
			<SettingsListRenderer
				items={controller.buildInItemsData}
				searchQuery={controller.searchQuery}
				{isDeveloperMode}
			/>
		{/if}

		{#if controller.addOnItemsData.length > 0}
			<div class="styleshift-section-header">ADD-ON</div>
			<SettingsListRenderer items={controller.addOnItemsData} searchQuery={controller.searchQuery} {isDeveloperMode} />
		{/if}
	</SidebarScrollLayout>
</div>

<style lang="scss">
	.styleshift-settings-main {
		width: 100%;
		height: 100%;
	}

	:global(.styleshift-sidebar) {
		background: var(--category-left-bg);
	}

	.styleshift-add-category-button {
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
		color: var(--text-primary);
		padding: 8px 5px;
		margin: 3px 10px;
		border-radius: 1000px;
		cursor: pointer;
		font-weight: bold;
		font-size: 16px;
		transition: background-color 0.2s;
	}

	.styleshift-add-category-button:hover {
		background: var(--fg-opacity-10);
	}

	.styleshift-section-header {
		font-size: 28px;
		font-weight: 900;
		color: var(--fg-opacity-60);
		letter-spacing: 6px;
		margin-top: 40px;
		margin-bottom: 25px;
		text-transform: uppercase;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 25px;

		&::before,
		&::after {
			content: "";
			flex: 1;
			height: 1px;
			background: linear-gradient(to var(--direction), var(--fg-opacity-10), transparent);
		}

		&::before {
			--direction: left;
		}

		&::after {
			--direction: right;
		}
	}

	:global(.styleshift-settings-list) {
		gap: 20px;
		padding-inline: 20px;
		padding-bottom: 50px;
	}
</style>
