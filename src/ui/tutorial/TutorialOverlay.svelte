<script lang="ts">
	import { logger } from "@shared/logger";
	import { onDestroy, onMount } from "svelte";
	import TourCard from "./tour/TourCard.svelte";
	import TourSpotlight from "./tour/TourSpotlight.svelte";
	import { cleanupTourModes, isPanelOpenAndVisible, openPanelAt, runStepShow, runStepTry } from "./tutorialNavigation";
	import {
		cardPlacementFor,
		DEFAULT_CARD_HEIGHT,
		DEFAULT_CARD_WIDTH,
		ensureTargetVisible,
		fallbackCardPlacement,
		findOpenWindowRect,
		findWindowRect,
		isElementVisible,
		isTargetOnTop,
		spotlightStyleFor,
		toTargetRect,
		TRIAL_DOCK_STYLE,
	} from "./tour/tourPosition";
	import { TUTORIAL_STEPS, requiresSettingsPanel } from "./tutorialSteps";
	import { isThemeManagerOpen } from "@ui/themes/themeManagerService";
	import { markTutorialSeen } from "./tutorialStorage";

	let { onClose = () => {} }: { onClose?: () => void } = $props();

	let currentIndex = $state(0);
	let cardEl = $state<HTMLElement | null>(null);
	let positionStyle = $state("");
	let isPositioned = $state(false);

	let spotlightStyle = $state("");
	let isSpotlightVisible = $state(false);
	let isPanelOpen = $state(false);
	let isTrialMode = $state(false);

	let autoProceedTimer: number | null = null;
	let activeTargetClickListener: { target: HTMLElement; handler: () => void } | null = null;

	const currentStep = $derived(TUTORIAL_STEPS[currentIndex]);
	const isFirstStep = $derived(currentIndex === 0);
	const isLastStep = $derived(currentIndex === TUTORIAL_STEPS.length - 1);
	const tierLabel = $derived(currentStep.tier === "core" ? "Core" : "Optional");

	const canProceed = $derived(currentIndex !== 0 || isPanelOpen);
	const panelNeeded = $derived(requiresSettingsPanel(currentStep));

	function detachTargetClickListener() {
		if (!activeTargetClickListener) return;
		const { target, handler } = activeTargetClickListener;
		target.removeEventListener("click", handler);
		activeTargetClickListener = null;
	}

	function attachTargetClickListener(target: HTMLElement) {
		detachTargetClickListener();
		if (currentStep.try) {
			const handler = () => {
				void handleTry();
			};
			target.addEventListener("click", handler, { once: true });
			activeTargetClickListener = { target, handler };
		}
	}

	function queueAutoProceed() {
		if (autoProceedTimer) return;
		autoProceedTimer = window.setTimeout(() => {
			autoProceedTimer = null;
			if (currentIndex === 0) void goTo(1);
		}, 350);
	}

	function updatePosition() {
		const viewport = { width: window.innerWidth, height: window.innerHeight };
		const card = {
			width: cardEl?.offsetWidth || DEFAULT_CARD_WIDTH,
			height: cardEl?.offsetHeight || DEFAULT_CARD_HEIGHT,
		};

		const panelNowOpen = isPanelOpenAndVisible();
		const wasPanelOpen = isPanelOpen;
		isPanelOpen = panelNowOpen;

		if (currentIndex === 0 && !wasPanelOpen && panelNowOpen) queueAutoProceed();

		const target =
			!isTrialMode && currentStep.targetSelector
				? document.querySelector<HTMLElement>(currentStep.targetSelector)
				: null;
		const visibleTarget = target && isElementVisible(target) ? target : null;
		const usableTarget = visibleTarget && isTargetOnTop(visibleTarget) ? visibleTarget : null;

		if (usableTarget) {
			ensureTargetVisible(usableTarget);
			attachTargetClickListener(usableTarget);
			const rect = toTargetRect(usableTarget.getBoundingClientRect());
			spotlightStyle = spotlightStyleFor(rect);
			isSpotlightVisible = true;
			positionStyle = cardPlacementFor({
				target: rect,
				card,
				viewport,
				trialMode: false,
				windowRect: findWindowRect(usableTarget),
			});
		} else {
			detachTargetClickListener();
			isSpotlightVisible = false;
			spotlightStyle = "";
			if (isTrialMode) {
				positionStyle = TRIAL_DOCK_STYLE;
			} else {
				positionStyle = fallbackCardPlacement(viewport, card, isThemeManagerOpen(), findOpenWindowRect());
			}
		}
		isPositioned = true;
	}

	async function goTo(index: number) {
		if (autoProceedTimer) {
			clearTimeout(autoProceedTimer);
			autoProceedTimer = null;
		}
		if (isTrialMode) {
			cleanupTourModes();
			isTrialMode = false;
		}
		detachTargetClickListener();
		currentIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));

		const nextStep = TUTORIAL_STEPS[currentIndex];
		if (requiresSettingsPanel(nextStep)) {
			await openPanelAt(nextStep.panelCategory ?? nextStep.show?.panelCategory);
		}
		scheduleUpdate();
	}

	function handleBack() {
		if (isTrialMode) {
			cleanupTourModes();
			isTrialMode = false;
		}
		if (!isFirstStep) void goTo(currentIndex - 1);
	}

	function handleNext() {
		if (isTrialMode) {
			cleanupTourModes();
			isTrialMode = false;
		}
		if (!canProceed) return;
		if (isLastStep) close();
		else void goTo(currentIndex + 1);
	}

	function close() {
		if (autoProceedTimer) {
			clearTimeout(autoProceedTimer);
			autoProceedTimer = null;
		}
		isTrialMode = false;
		cleanupTourModes();
		detachTargetClickListener();
		markTutorialSeen();
		onClose();
	}

	async function handleShow() {
		await runStepShow(currentStep);
		requestAnimationFrame(() => updatePosition());
	}

	async function handleSecondaryShow() {
		if (!currentStep.secondaryShow) return;
		await runStepShow(currentStep, currentStep.secondaryShow.themeTab);
		requestAnimationFrame(() => updatePosition());
	}

	async function handleTry() {
		isTrialMode = true;
		requestAnimationFrame(() => updatePosition());
		await runStepTry(currentStep);
	}

	function handleStopTrial() {
		cleanupTourModes();
		isTrialMode = false;
		requestAnimationFrame(() => updatePosition());
	}

	async function handleOptionClick(category: string) {
		await openPanelAt(category);
		requestAnimationFrame(() => updatePosition());
	}

	async function handleReopen() {
		await openPanelAt(currentStep.panelCategory ?? currentStep.show?.panelCategory);
		requestAnimationFrame(() => updatePosition());
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
		} else if (event.key === "ArrowRight") {
			if (canProceed) handleNext();
		} else if (event.key === "ArrowLeft") {
			handleBack();
		}
	}

	let observer: MutationObserver | null = null;
	let updateDebounceTimer: number | null = null;

	function scheduleUpdate() {
		if (updateDebounceTimer) cancelAnimationFrame(updateDebounceTimer);
		updateDebounceTimer = requestAnimationFrame(() => {
			updateDebounceTimer = null;
			updatePosition();
		});
	}

	$effect(() => {
		const _id = currentStep.id;
		scheduleUpdate();
	});

	onMount(() => {
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", scheduleUpdate);
		document.addEventListener("scroll", scheduleUpdate, true);

		observer = new MutationObserver(() => scheduleUpdate());
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class", "style"],
		});

		scheduleUpdate();
		logger.debug("tutorial", "Live guided tour opened");
	});

	onDestroy(() => {
		if (autoProceedTimer) clearTimeout(autoProceedTimer);
		window.removeEventListener("keydown", handleKeyDown);
		window.removeEventListener("resize", scheduleUpdate);
		document.removeEventListener("scroll", scheduleUpdate, true);
		observer?.disconnect();
		if (updateDebounceTimer) cancelAnimationFrame(updateDebounceTimer);
		detachTargetClickListener();
		cleanupTourModes();
	});
</script>

<div class="tutorial-tour-container" style="--accent: {currentStep.accent}">
	<TourSpotlight visible={isSpotlightVisible} style={spotlightStyle} />

	<TourCard
		bind:cardEl
		step={currentStep}
		steps={TUTORIAL_STEPS}
		index={currentIndex}
		trialMode={isTrialMode}
		{tierLabel}
		{canProceed}
		{isFirstStep}
		{isLastStep}
		{positionStyle}
		{isPositioned}
		{isPanelOpen}
		{panelNeeded}
		onShow={handleShow}
		onSecondaryShow={handleSecondaryShow}
		onTry={handleTry}
		onStopTrial={handleStopTrial}
		onBack={handleBack}
		onNext={handleNext}
		onClose={close}
		onGoTo={goTo}
		onOption={handleOptionClick}
		onReopen={handleReopen}
	/>
</div>

<style lang="scss">
	.tutorial-tour-container {
		position: fixed;
		inset: 0;
		z-index: 15000;
		pointer-events: none;
		color: var(--font-color);
	}

	@media (prefers-reduced-motion: reduce) {
		.tutorial-tour-container :global(*) {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
