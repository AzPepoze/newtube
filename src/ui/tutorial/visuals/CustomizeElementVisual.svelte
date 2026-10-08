<script lang="ts">
	import MockCursor from "../mock/MockCursor.svelte";
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import MockRow from "../mock/MockRow.svelte";
	import MockWindow from "../mock/MockWindow.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { PANEL_NAV, QUICK_PALETTE_ITEMS } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const panelOpen = $derived(beat === 0);
	const isPicking = $derived(beat >= 1 && beat <= 4);
	const hoverCard = $derived(beat >= 2 && beat <= 4 ? 1 : -1);
	const dimCard = $derived(beat >= 4 ? 1 : -1);
	const editorOpen = $derived(beat >= 3);
	const hotId = $derived(beat === 0 ? "customizeElements" : "");
	const pressedId = $derived(beat === 1 ? "customizeElements" : "");
</script>

<MockPage pickMode={isPicking} {hoverCard} {dimCard}>
	<MockCursor x="51%" y="141px" pressed={beat === 3} visible={beat === 2 || beat === 3} />

	<MockWindow title="Video player" open={editorOpen} placement="left: 66%; top: 14%; width: 32%;">
		<MockRow name="Dim video" on={beat >= 4} highlight={beat === 4} />
		<MockRow name="Show title" on={true} />
	</MockWindow>

	<MockPanel
		items={PANEL_NAV}
		selected={PANEL_CATEGORY.quickPalette}
		title={PANEL_CATEGORY.quickPalette}
		open={panelOpen}
	>
		<PaletteGrid items={QUICK_PALETTE_ITEMS} {hotId} {pressedId} />
	</MockPanel>
</MockPage>
