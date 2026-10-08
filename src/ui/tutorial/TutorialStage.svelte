<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { onMount } from "svelte";
	import CustomizeElementVisual from "./visuals/CustomizeElementVisual.svelte";
	import DeveloperModeVisual from "./visuals/DeveloperModeVisual.svelte";
	import MoreOptionsVisual from "./visuals/MoreOptionsVisual.svelte";
	import OpenPanelVisual from "./visuals/OpenPanelVisual.svelte";
	import QuickCustomizeVisual from "./visuals/QuickCustomizeVisual.svelte";
	import SaveExportVisual from "./visuals/SaveExportVisual.svelte";
	import ThemesStoreVisual from "./visuals/ThemesStoreVisual.svelte";
	import type { TutorialStep } from "./tutorialSteps";

	const BEAT_MS = 1700;

	let {
		step,
		onNavigate = () => {},
	}: {
		step: TutorialStep;
		onNavigate?: (category?: string) => void;
	} = $props();

	const lastBeat = $derived(step.beats - 1);
	const beatIndexes = $derived(Array.from({ length: step.beats }, (_, index) => index));
	let beat = $state(0);
	let playing = $state(false);
	const finished = $derived(beat >= lastBeat);
	const controlIcon = $derived(getControlIcon(playing, finished));

	onMount(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reducedMotion) beat = step.beats - 1;
		else playing = step.beats > 1;
	});

	$effect(() => {
		if (!playing) return;
		const timer = setInterval(advance, BEAT_MS);
		return () => clearInterval(timer);
	});

	function getControlIcon(isPlaying: boolean, isFinished: boolean) {
		if (isPlaying) return "pause";
		if (isFinished) return "replay";
		return "play_arrow";
	}

	function advance() {
		if (beat >= lastBeat) playing = false;
		else beat += 1;
	}

	function togglePlay() {
		if (finished) {
			beat = 0;
			playing = true;
		} else {
			playing = !playing;
		}
	}
</script>

<div class="stage" style="--accent: {step.accent}">
	<div class="stage-visual">
		{#if step.visual === "openPanel"}
			<OpenPanelVisual {beat} />
		{:else if step.visual === "quickCustomize"}
			<QuickCustomizeVisual {beat} />
		{:else if step.visual === "customizeElement"}
			<CustomizeElementVisual {beat} />
		{:else if step.visual === "themesStore"}
			<ThemesStoreVisual {beat} />
		{:else if step.visual === "saveExport"}
			<SaveExportVisual {beat} />
		{:else if step.visual === "developerMode"}
			<DeveloperModeVisual {beat} />
		{:else}
			<MoreOptionsVisual onSelect={onNavigate} />
		{/if}
	</div>

	<div class="stage-controls">
		<div class="beat-dots">
			{#each beatIndexes as index (index)}
				<span class="beat-dot" class:passed={index < beat} class:current={index === beat}></span>
			{/each}
		</div>
		<button class="control-button" aria-label="Play or pause the animation" onclick={togglePlay}>
			<Icon name={controlIcon} size={16} />
		</button>
	</div>
</div>

<style lang="scss">
	.stage {
		position: relative;
		flex: 1;
		min-height: 260px;
		border-radius: 16px;
		border: 1px solid var(--border-subtle);
		background:
			radial-gradient(circle at 15% 0%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 60%),
			radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%),
			var(--fg-opacity-03);
		overflow: hidden;
		transition: background 500ms ease;
	}

	.stage-visual {
		position: absolute;
		inset: 0;
	}

	.stage-controls {
		position: absolute;
		right: 14px;
		bottom: 12px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.beat-dots {
		display: flex;
		gap: 6px;
	}

	.beat-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--fg-opacity-20);
		transition:
			width 400ms cubic-bezier(0.22, 1, 0.36, 1),
			background 400ms ease;

		&.passed {
			background: color-mix(in srgb, var(--accent) 55%, transparent);
		}

		&.current {
			width: 18px;
			background: var(--accent);
		}
	}

	.control-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: 1px solid var(--accent);
		background: var(--window-bg);
		color: var(--font-color);
		cursor: pointer;
		transition:
			background 200ms ease,
			transform 200ms ease;

		&:hover {
			background: color-mix(in srgb, var(--accent) 25%, var(--window-bg));
		}

		&:active {
			transform: scale(0.92);
		}
	}
</style>
