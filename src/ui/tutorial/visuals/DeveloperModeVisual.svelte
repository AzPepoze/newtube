<script lang="ts">
	import MockPage from "../mock/MockPage.svelte";
	import MockPanel from "../mock/MockPanel.svelte";
	import MockRow from "../mock/MockRow.svelte";
	import { PANEL_NAV } from "../mock/palette";
	import { PANEL_CATEGORY } from "../tutorialSteps";

	let { beat }: { beat: number } = $props();

	const devOn = $derived(beat >= 1);
	const showActions = $derived(beat >= 2);
	const isAdding = $derived(beat >= 3);
</script>

<MockPage>
	<MockPanel
		items={PANEL_NAV}
		selected={PANEL_CATEGORY.extensionSettings}
		title={PANEL_CATEGORY.extensionSettings}
		open
		devMode={devOn}
	>
		<MockRow name="Developer Mode" on={devOn} highlight={beat === 1} />
		<MockRow name="Realtime Updating" on={true} dev={devOn} actions={showActions} />
		<MockRow name="Auto Update Themes" on={true} dev={devOn} actions={showActions} />
		<MockRow name="Glass UI" on={false} dev={devOn} actions={showActions} highlight={beat === 2} />
		{#if devOn}
			<span class="add-setting" class:hot={beat === 2} class:pressed={beat === 3}>+ Add Setting</span>
		{/if}
		{#if isAdding}
			<MockRow name="New setting" on={true} dev isNew />
		{/if}
	</MockPanel>
</MockPage>

<style lang="scss">
	.add-setting {
		padding: 7px;
		border-radius: 999px;
		border: 1px dashed var(--accent);
		text-align: center;
		font-size: 11px;
		font-weight: 700;
		color: var(--accent);
		animation: add-in 500ms cubic-bezier(0.22, 1, 0.36, 1);
		transition:
			transform 200ms ease,
			box-shadow 400ms ease;

		&.hot {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
		}

		&.pressed {
			transform: scale(0.94);
		}
	}

	@keyframes add-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
