<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { logger } from "@shared/logger";
	import { onDestroy, onMount } from "svelte";
	import { fade } from "svelte/transition";
	import TutorialStage from "./TutorialStage.svelte";
	import { openPanelAt } from "./tutorialNavigation";
	import { TUTORIAL_STEPS, type TutorialTier } from "./tutorialSteps";
	import { markTutorialSeen } from "./tutorialStorage";

	let { onClose = () => {} }: { onClose?: () => void } = $props();

	let currentIndex = $state(0);

	const currentStep = $derived(TUTORIAL_STEPS[currentIndex]);
	const isFirstStep = $derived(currentIndex === 0);
	const isLastStep = $derived(currentIndex === TUTORIAL_STEPS.length - 1);
	const tierLabel = $derived(currentStep.tier === "core" ? "Core" : "Optional");

	const navGroups: { label: string; tier: TutorialTier }[] = [
		{ label: "Core", tier: "core" },
		{ label: "Optional", tier: "optional" },
	];

	function stepsInTier(tier: TutorialTier) {
		return TUTORIAL_STEPS.map((step, index) => ({ step, index })).filter((item) => item.step.tier === tier);
	}

	function goTo(index: number) {
		currentIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
	}

	function close() {
		markTutorialSeen();
		onClose();
	}

	function openSetting(category?: string) {
		close();
		void openPanelAt(category);
	}

	function handleNext() {
		if (isLastStep) close();
		else goTo(currentIndex + 1);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") close();
		if (event.key === "ArrowRight") goTo(currentIndex + 1);
		if (event.key === "ArrowLeft") goTo(currentIndex - 1);
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
			<nav class="tutorial-nav">
				{#each navGroups as group (group.label)}
					<span class="nav-title">{group.label}</span>
					{#each stepsInTier(group.tier) as item (item.step.id)}
						<button
							class="nav-item"
							class:active={item.index === currentIndex}
							class:done={item.index < currentIndex}
							style="--accent: {item.step.accent}"
							onclick={() => goTo(item.index)}
						>
							<span class="nav-index">
								{#if item.index < currentIndex}
									<Icon name="check" size={12} />
								{:else}
									{item.index + 1}
								{/if}
							</span>
							<span class="nav-label">{item.step.title}</span>
						</button>
					{/each}
				{/each}
			</nav>

			<section class="tutorial-main">
				{#key currentStep.id}
					<div class="step-content" in:fade={{ duration: 260, delay: 200 }} out:fade={{ duration: 200 }}>
						<TutorialStage step={currentStep} onNavigate={openSetting} />

						<div class="step-copy" style="--accent: {currentStep.accent}">
							<span class="step-tier">{tierLabel}</span>
							<h2 class="step-title">{currentStep.title}</h2>
							<p class="step-body">{currentStep.body}</p>
							{#if currentStep.bullets.length}
								<ul class="step-bullets">
									{#each currentStep.bullets as bullet (bullet)}
										<li>{bullet}</li>
									{/each}
								</ul>
							{/if}
							{#if currentStep.actionLabel}
								<button class="action-button" onclick={() => openSetting(currentStep.panelCategory)}>
									<Icon name="arrow_forward" size={16} />
									<span>{currentStep.actionLabel}</span>
								</button>
							{/if}
						</div>
					</div>
				{/key}

				<footer class="step-footer">
					<button class="nav-button" onclick={() => goTo(currentIndex - 1)} disabled={isFirstStep}>Back</button>
					<span class="step-count">{currentIndex + 1} / {TUTORIAL_STEPS.length}</span>
					<button class="nav-button primary" style="--accent: {currentStep.accent}" onclick={handleNext}>
						{isLastStep ? "Done" : "Next"}
					</button>
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
		width: min(980px, calc(100vw - 40px));
		height: min(700px, calc(100vh - 40px));
		display: flex;
		flex-direction: column;
		border-radius: 16px;
		border: 1px solid var(--border-subtle);
		background: var(--window-bg);
		backdrop-filter: var(--window-blur) var(--window-saturate);
		-webkit-backdrop-filter: var(--window-blur) var(--window-saturate);
		box-shadow: 0 20px 60px var(--shadow-color);
		overflow: hidden;
		animation: panel-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
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

	.tutorial-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 10px;
		border-right: 1px solid var(--border-subtle);
		background: var(--fg-opacity-03);
		overflow-y: auto;
	}

	.nav-title {
		padding: 10px 8px 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--font-color-dim);

		&:not(:first-child) {
			margin-top: 8px;
			border-top: 1px solid var(--border-subtle);
		}
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border: 1px solid transparent;
		border-radius: 10px;
		background: transparent;
		color: var(--font-color-dim);
		text-align: left;
		cursor: pointer;
		transition:
			background 300ms ease,
			border-color 300ms ease;

		&:hover {
			background: var(--fg-opacity-05);
		}

		&.active {
			border-color: color-mix(in srgb, var(--accent) 50%, transparent);
			background: color-mix(in srgb, var(--accent) 18%, transparent);
			color: var(--font-color);
		}

		&.done .nav-index {
			background: var(--accent);
			color: var(--fg-opacity-100);
		}
	}

	.nav-index {
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
		transition: background 300ms ease;

		.nav-item.active & {
			background: var(--accent);
			color: var(--fg-opacity-100);
		}
	}

	.nav-label {
		font-size: 13px;
		font-weight: 600;
	}

	.tutorial-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		padding: 16px 22px;
		gap: 14px;
	}

	.step-content {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.step-copy {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.step-tier {
		align-self: flex-start;
		padding: 3px 10px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--font-color);
	}

	.step-title {
		margin: 2px 0 0;
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

	.step-bullets {
		margin: 2px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13px;
		color: var(--font-color-dim);

		li {
			position: relative;
			padding-left: 16px;

			&::before {
				content: "";
				position: absolute;
				left: 0;
				top: 7px;
				width: 6px;
				height: 6px;
				border-radius: 50%;
				background: var(--accent);
			}
		}
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 6px;
		align-self: flex-start;
		margin-top: 6px;
		padding: 7px 14px;
		border: 1px solid var(--accent);
		border-radius: 10px;
		background: color-mix(in srgb, var(--accent) 20%, transparent);
		color: var(--font-color);
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 200ms ease,
			transform 150ms ease;

		&:hover {
			background: color-mix(in srgb, var(--accent) 35%, transparent);
		}

		&:active {
			transform: scale(0.97);
		}
	}

	.step-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.step-count {
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
		transition:
			background 200ms ease,
			transform 150ms ease;

		&:hover:not(:disabled) {
			background: var(--fg-opacity-05);
		}

		&:active:not(:disabled) {
			transform: scale(0.97);
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&.primary {
			border-color: var(--accent);
			background: var(--accent);
			color: var(--fg-opacity-100);

			&:hover {
				filter: brightness(1.1);
			}
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: scale(0.97) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tutorial-overlay :global(*) {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
