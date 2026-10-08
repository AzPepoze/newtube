<script lang="ts">
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import MockRow from "../mock/MockRow.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { PANEL_NAV } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const transferItems = [
		{ id: "export", label: "Export Data", icon: "file_upload", color: "#1932ff" },
		{ id: "import", label: "Import Data", icon: "download", color: "#1932ff" },
	];

	const selected = $derived(beat >= 2 ? PANEL_CATEGORY.importExport : PANEL_CATEGORY.extensionSettings);
	const toastShown = $derived(beat === 1 || beat >= 3);
	const toastText = $derived(beat >= 3 ? "Copied to clipboard" : "Saved automatically");
</script>

<MockPage>
	<MockPanel items={PANEL_NAV} {selected} title={selected} open>
		{#if beat >= 2}
			<PaletteGrid items={transferItems} pressedId={beat === 3 ? "export" : ""} />
		{:else}
			<MockRow name="Realtime Updating" on={true} />
			<MockRow name="Glass UI" on={beat >= 1} highlight={beat === 1} />
			<MockRow name="Developer Mode" on={false} />
		{/if}
		<span class="toast" class:shown={toastShown}>{toastText}</span>
	</MockPanel>
</MockPage>

<style lang="scss">
	.toast {
		position: absolute;
		right: 12px;
		bottom: 12px;
		padding: 6px 12px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 30%, var(--window-bg));
		border: 1px solid var(--accent);
		font-size: 11px;
		font-weight: 700;
		color: var(--font-color);
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 400ms ease,
			transform 400ms cubic-bezier(0.22, 1, 0.36, 1);

		&.shown {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
