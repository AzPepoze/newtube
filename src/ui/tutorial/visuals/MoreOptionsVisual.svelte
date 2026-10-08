<script lang="ts">
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { PANEL_NAV, type PaletteItem } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { onSelect = () => {} }: { onSelect?: (category?: string) => void } = $props();

	const options = [
		{
			id: "share",
			label: "Share Your Theme",
			icon: "ios_share",
			color: "#ffb020",
			category: PANEL_CATEGORY.quickPalette,
		},
		{
			id: "realtime",
			label: "Realtime Updating",
			icon: "bolt",
			color: "#3eadad",
			category: PANEL_CATEGORY.extensionSettings,
		},
		{
			id: "autoUpdate",
			label: "Auto Update Themes",
			icon: "system_update",
			color: "#7f5db7",
			category: PANEL_CATEGORY.extensionSettings,
		},
		{ id: "glass", label: "Glass UI", icon: "blur_on", color: "#2196f3", category: PANEL_CATEGORY.extensionSettings },
		{
			id: "shortcuts",
			label: "Keyboard Shortcuts",
			icon: "keyboard",
			color: "#e45eff",
			category: PANEL_CATEGORY.extensionSettings,
		},
	];

	const items: PaletteItem[] = options.map(({ id, label, icon, color }) => ({ id, label, icon, color }));

	function handleSelect(id: string) {
		const option = options.find((item) => item.id === id);
		onSelect(option?.category);
	}
</script>

<MockPage>
	<MockPanel items={PANEL_NAV} selected="" title="More options" open>
		<PaletteGrid {items} onSelect={handleSelect} />
	</MockPanel>
</MockPage>
