<script lang="ts">
	import MockCursor from "../mock/MockCursor.svelte";
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { PANEL_NAV, QUICK_PALETTE_ITEMS } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const cursorX = $derived(beat >= 1 ? "calc(100% - 37px)" : "50%");
	const cursorY = $derived(beat >= 1 ? "26px" : "85%");
</script>

<MockPage ringLauncher pressLauncher={beat >= 2}>
	<MockCursor x={cursorX} y={cursorY} pressed={beat === 2} visible={beat < 3} />
	<MockPanel
		items={PANEL_NAV}
		selected={PANEL_CATEGORY.quickPalette}
		title={PANEL_CATEGORY.quickPalette}
		open={beat >= 3}
	>
		<PaletteGrid items={QUICK_PALETTE_ITEMS} />
	</MockPanel>
</MockPage>
