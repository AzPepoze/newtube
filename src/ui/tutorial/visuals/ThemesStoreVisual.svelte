<script lang="ts">
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import MockWindow from "../mock/MockWindow.svelte";
	import PaletteGrid from "../mock/PaletteGrid.svelte";
	import { PANEL_NAV, QUICK_PALETTE_ITEMS } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const themes = [
		{ name: "Neon Night", from: "#7f5db7", to: "#e45eff" },
		{ name: "Soft Pastel", from: "#3eadad", to: "#ffb020" },
		{ name: "Forest", from: "#2e7d32", to: "#a5d6a7" },
	];

	const isStore = $derived(beat >= 2);
	const hotId = $derived(beat === 0 ? "themes" : "");
	const pressedId = $derived(beat === 1 ? "themes" : "");

	function cardAction(index: number) {
		if (!isStore) return "Apply";
		if (index === 1 && beat >= 3) return "Added";
		return "Get";
	}
</script>

<MockPage>
	<MockWindow title="Themes" open={beat >= 1} placement="left: 6%; top: 10%; width: 88%;">
		<div class="theme-grid">
			{#each themes as theme, index (theme.name)}
				<div class="theme-card">
					<span class="thumb" style="--from: {theme.from}; --to: {theme.to};"></span>
					<span class="theme-name">{theme.name}</span>
					<span class="card-action" class:added={cardAction(index) === "Added"}>{cardAction(index)}</span>
				</div>
			{/each}
		</div>
		<div class="footer">
			<span class="footer-button" class:pressed={beat === 2}>Store</span>
			<span class="footer-button">Save</span>
			<span class="footer-button">Import</span>
			<span class="footer-button">Share</span>
		</div>
	</MockWindow>

	<MockPanel
		items={PANEL_NAV}
		selected={PANEL_CATEGORY.quickPalette}
		title={PANEL_CATEGORY.quickPalette}
		open={beat === 0}
	>
		<PaletteGrid items={QUICK_PALETTE_ITEMS} {hotId} {pressedId} />
	</MockPanel>
</MockPage>

<style lang="scss">
	.theme-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 6px;
		border-radius: 10px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-03);
	}

	.thumb {
		height: 60px;
		border-radius: 7px;
		background: linear-gradient(135deg, var(--from), var(--to));
	}

	.theme-name {
		font-size: 11px;
		font-weight: 600;
		color: var(--font-color);
	}

	.card-action {
		align-self: flex-start;
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--accent);
		color: var(--fg-opacity-100);
		font-size: 10px;
		font-weight: 700;
		transition:
			background 300ms ease,
			color 300ms ease;

		&.added {
			background: transparent;
			border: 1px solid var(--accent);
			color: var(--font-color);
		}
	}

	.footer {
		display: flex;
		gap: 8px;
		margin-top: auto;
	}

	.footer-button {
		padding: 5px 12px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-15);
		font-size: 11px;
		font-weight: 600;
		color: var(--font-color);
		transition: transform 200ms ease;

		&.pressed {
			transform: scale(0.94);
			background: color-mix(in srgb, var(--accent) 25%, transparent);
		}
	}
</style>
