<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { logger } from "@shared/logger";
	import { onDestroy, onMount } from "svelte";
	import { TUTORIAL_STEPS } from "./tutorialSteps";
	import { markTutorialSeen } from "./tutorialStorage";
	import CustomizeElementVisual from "./visuals/CustomizeElementVisual.svelte";
	import DeveloperModeVisual from "./visuals/DeveloperModeVisual.svelte";
	import QuickCustomizeVisual from "./visuals/QuickCustomizeVisual.svelte";
	import SaveExportVisual from "./visuals/SaveExportVisual.svelte";

	let { onClose = () => {} }: { onClose?: () => void } = $props();

	let currentIndex = $state(0);

	const currentStep = $derived(TUTORIAL_STEPS[currentIndex]);
	const isLastStep = $derived(currentIndex === TUTORIAL_STEPS.length - 1);

	function goTo(index: number) {
		currentIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
	}

	function close() {
		markTutorialSeen();
		onClose();
	}

	function handleNext() {
		if (isLastStep) close();
		else goTo(currentIndex + 1);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") close();
	}

	onMount(() => {
		window.addEventListener("keydown", handleKeyDown);
		logger.debug("tutorial", "Tutorial overlay opened");
	});

	onDestroy(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<div class="tutorial-overlay">
	<button class="tutorial-backdrop" aria-label="Close tutorial" onclick={close}></button>

	<div class="tutorial-panel">
		<header class="tutorial-header">
			<div class="tutorial-title">
				<Icon name="school" size={18} />
				<span>Customization tutorial</span>
			</div>
			<button class="tutorial-close" aria-label="Close tutorial" onclick={close}>
				<Icon name="close" size={18} />
			</button>
		</header>

		<div class="tutorial-body">
			<nav class="tutorial-topics">
				{#each TUTORIAL_STEPS as step, index (step.id)}
					<button class="topic-item" class:active={index === currentIndex} onclick={() => goTo(index)}>
						<span class="topic-index">{index + 1}</span>
						<span class="topic-text">
							<span class="topic-title">{step.title}</span>
							<span class="topic-summary">{step.summary}</span>
						</span>
					</button>
				{/each}
			</nav>

			<section class="tutorial-step">
				{#key currentStep.id}
					<div class="step-content">
						<h2 class="step-title">{currentStep.title}</h2>
						<p class="step-body">{currentStep.body}</p>
						<div class="step-visual">
							{#if currentStep.visual === "developerMode"}
								<DeveloperModeVisual />
							{:else if currentStep.visual === "quickCustomize"}
								<QuickCustomizeVisual />
							{:else if currentStep.visual === "customizeElement"}
								<CustomizeElementVisual />
							{:else}
								<SaveExportVisual />
							{/if}
						</div>
						{#if currentStep.bullets.length}
							<ul class="step-bullets">
								{#each currentStep.bullets as bullet (bullet)}
									<li>{bullet}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/key}

				<footer class="step-footer">
					<button class="nav-button" onclick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>Back</button>
					<span class="step-progress">{currentIndex + 1} / {TUTORIAL_STEPS.length}</span>
					<button class="nav-button primary" onclick={handleNext}>{isLastStep ? "Done" : "Next"}</button>
				</footer>
			</section>
		</div>
	</div>
</div>

<style lang="scss">
	.tutorial-overlay {
		position: fixed;
		inset: 0;
		z-index: 15000;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--font-color);
	}

	.tutorial-backdrop {
		position: absolute;
		inset: 0;
		border: none;
		padding: 0;
		cursor: pointer;
		background: var(--bg-overlay-60);
	}

	.tutorial-panel {
		position: relative;
		width: min(860px, calc(100vw - 40px));
		height: min(600px, calc(100vh - 40px));
		display: flex;
		flex-direction: column;
		border-radius: 16px;
		border: 1px solid var(--border-subtle);
		background: var(--window-bg);
		backdrop-filter: var(--window-blur) var(--window-saturate);
		-webkit-backdrop-filter: var(--window-blur) var(--window-saturate);
		box-shadow: 0 20px 60px var(--shadow-color);
		overflow: hidden;
		animation: panel-in 0.2s ease-out;
	}

	.tutorial-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.tutorial-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 700;
		color: var(--font-color);
	}

	.tutorial-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--font-color-dim);
		cursor: pointer;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}
	}

	.tutorial-body {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: 240px 1fr;
	}

	.tutorial-topics {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px;
		border-right: 1px solid var(--border-subtle);
		background: var(--fg-opacity-03);
		overflow-y: auto;
	}

	.topic-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border: 1px solid transparent;
		border-radius: 10px;
		background: transparent;
		text-align: left;
		cursor: pointer;
		color: var(--font-color-dim);

		&:hover {
			background: var(--fg-opacity-05);
		}

		&.active {
			border-color: var(--theme-0-30);
			background: var(--theme-0-15);
			color: var(--font-color);
		}
	}

	.topic-index {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--fg-opacity-10);
		font-size: 11px;
		font-weight: 700;

		.topic-item.active & {
			background: var(--theme-0);
			color: var(--fg-opacity-100);
		}
	}

	.topic-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.topic-title {
		font-size: 13px;
		font-weight: 700;
	}

	.topic-summary {
		font-size: 11px;
		opacity: 0.75;
	}

	.tutorial-step {
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 20px 24px 16px;
	}

	.step-content {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow-y: auto;
		animation: step-in 0.25s ease-out;
	}

	.step-title {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--font-color);
	}

	.step-body {
		margin: 0;
		font-size: 13px;
		line-height: 1.55;
		color: var(--font-color-dim);
	}

	.step-visual {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 180px;
		padding: 16px;
		border-radius: 12px;
		border: 1px solid var(--border-subtle);
		background: var(--fg-opacity-03);
	}

	.step-bullets {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--font-color-dim);
	}

	.step-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 16px;
	}

	.step-progress {
		font-size: 12px;
		color: var(--font-color-dim);
	}

	.nav-button {
		padding: 9px 22px;
		border-radius: 10px;
		border: 1px solid var(--fg-opacity-20);
		background: transparent;
		color: var(--font-color);
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;

		&:hover:not(:disabled) {
			background: var(--fg-opacity-05);
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&.primary {
			border-color: var(--theme-0);
			background: var(--theme-0);
			color: var(--fg-opacity-100);

			&:hover {
				filter: brightness(1.1);
			}
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes step-in {
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
