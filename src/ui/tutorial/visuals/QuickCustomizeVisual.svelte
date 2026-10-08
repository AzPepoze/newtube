<script lang="ts">
	import MockCursor from "../mock/MockCursor.svelte";
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import MockRow from "../mock/MockRow.svelte";
	import MockWindow from "../mock/MockWindow.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { CUSTOM_NAV, PANEL_NAV, QUICK_PALETTE_ITEMS } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const isPicking = $derived(beat === 2 || beat === 3);
	const isCustomView = $derived(beat >= 4);
	const navItems = $derived(isCustomView ? [...PANEL_NAV, CUSTOM_NAV] : PANEL_NAV);
	const selected = $derived(isCustomView ? CUSTOM_NAV.label : PANEL_CATEGORY.quickPalette);
	const hotId = $derived(beat === 0 ? "quickCustomize" : "");
	const pressedId = $derived(beat === 1 ? "quickCustomize" : "");
</script>

<MockPage pickMode={isPicking} hoverCard={isPicking ? 1 : -1}>
	<MockCursor x="51%" y="141px" visible={beat === 2} />

	<MockWindow title="Quick Customize" open={beat === 3} placement="left: 22%; top: 16%; width: 56%;">
		<span class="field">Glow</span>
		<div class="color-row">
			<span>Color</span>
			<span class="swatch"></span>
		</div>
		<span class="save-button">Save</span>
	</MockWindow>

	<MockPanel items={navItems} {selected} title={selected} open={!isPicking && beat !== 3}>
		{#if isCustomView}
			<MockRow name="Glow" on={true} highlight />
		{:else}
			<PaletteGrid items={QUICK_PALETTE_ITEMS} {hotId} {pressedId} />
		{/if}
	</MockPanel>
</MockPage>

<style lang="scss">
	.field {
		padding: 7px 10px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-15);
		font-size: 12px;
		color: var(--font-color);
	}

	.color-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
		font-size: 12px;
		color: var(--font-color);
	}

	.swatch {
		width: 22px;
		height: 14px;
		border-radius: 4px;
		background: #e45eff;
	}

	.save-button {
		align-self: flex-end;
		padding: 6px 18px;
		border-radius: 8px;
		background: var(--accent);
		color: var(--fg-opacity-100);
		font-size: 12px;
		font-weight: 700;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 40%, transparent);
	}
</style>
