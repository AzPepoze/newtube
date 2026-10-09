<script lang="ts">
	import { logger } from "@shared/logger";
	import { onDestroy, onMount } from "svelte";
	import TourCard from "./tour/TourCard.svelte";
	import TourSpotlight from "./tour/TourSpotlight.svelte";
	import { playCelebration } from "./celebrationService";
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
		revealPanelTarget,
		spotlightStyleFor,
		toTargetRect,
		TRIAL_DOCK_STYLE,
	} from "./tour/tourPosition";
	import { TUTORIAL_STEPS, hasSpotlight, needsDeveloperMode, requiresSettingsPanel } from "./tutorialSteps";
	import { isThemeManagerOpen } from "@ui/themes/themeManagerService";
	import { markTutorialSeen } from "./tutorialStorage";
	import { getRootValue } from "@core/storage/manager";
	import { registerSettingListener, unregisterSettingListener } from "@settings/engine/functions";

	let { onClose = () => {} }: { onClose?: () => void } = $props();

	const CLOSE_ANIMATION_MS = 200;

	let currentIndex = $state(0);
	let cardEl = $state<HTMLElement | null>(null);
	let positionStyle = $state("");
	let isPositioned = $state(false);
	let isClosing = $state(false);

	let spotlightStyle = $state("");
	let isSpotlightVisible = $state(false);
	let isPanelOpen = $state(false);
	let isTrialMode = $state(false);
	let isDeveloperMode = $state(false);

	let autoProceedTimer: number | null = null;
	let closeTimer: number | null = null;
	let activeTargetClickListener: { target: HTMLElement; handler: () => void } | null = null;

	const currentStep = $derived(TUTORIAL_STEPS[currentIndex]);
	const isFirstStep = $derived(currentIndex === 0);
	const isLastStep = $derived(currentIndex === TUTORIAL_STEPS.length - 1);
	const tierLabel = $derived(currentStep.tier === "core" ? "Core" : "Optional");

	const devGateFailed = $derived(needsDeveloperMode(currentStep) && !isDeveloperMode);
	const canProceed = $derived((currentIndex !== 0 || isPanelOpen) && !devGateFailed);
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
			!isTrialMode && hasSpotlight(currentStep) && currentStep.targetSelector
				? document.querySelector<HTMLElement>(currentStep.targetSelector)
				: null;
		const visibleTarget = target && isElementVisible(target) ? target : null;
		const usableTarget = visibleTarget && isTargetOnTop(visibleTarget) ? visibleTarget : null;

		if (usableTarget) {
			ensureTargetVisible(usableTarget);
			attachTargetClickListener(usableTarget);
			const rect = toTargetRect(usableTarget.getBoundingClientRect());
			const style = spotlightStyleFor(rect, viewport);
			spotlightStyle = style ?? "";
			isSpotlightVisible = style !== null;
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
			if (!isTrialMode && target) {
				revealPanelTarget(target);
			}
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
		if (isLastStep) {
			close();
			void playCelebration({ accent: currentStep.accent });
		} else void goTo(currentIndex + 1);
	}

	function close() {
		if (isClosing) return;
		isClosing = true;
		if (autoProceedTimer) {
			clearTimeout(autoProceedTimer);
			autoProceedTimer = null;
		}
		closeTimer = window.setTimeout(() => {
			closeTimer = null;
			isTrialMode = false;
			cleanupTourModes();
			detachTargetClickListener();
			markTutorialSeen();
			onClose();
		}, CLOSE_ANIMATION_MS);
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

	function handleChoice(accepted: boolean) {
		if (isTrialMode) {
			cleanupTourModes();
			isTrialMode = false;
		}
		if (accepted) {
			if (!isLastStep) void goTo(currentIndex + 1);
			return;
		}
		const targetId = currentStep.choice?.declineToId;
		if (targetId) {
			const targetIndex = TUTORIAL_STEPS.findIndex((step) => step.id === targetId);
			if (targetIndex >= 0) void goTo(targetIndex);
			return;
		}
		// No decline target: "I'm fine" ends the tutorial with a celebration.
		close();
		void playCelebration({ accent: currentStep.accent });
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

	function handleDeveloperModeChange(value: unknown) {
		isDeveloperMode = value === true;
	}

	onMount(() => {
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("resize", scheduleUpdate);
		document.addEventListener("scroll", scheduleUpdate, true);
		// Hover-revealed controls (e.g. the sidebar + button, opacity 0 until
		// hover) fail isElementVisible, so the spotlight never lands on them.
		// Force them visible for the whole tour; removed on destroy.
		document.body.classList.add("styleshift-tour-active");
		registerSettingListener("developerMode", handleDeveloperModeChange);
		void getRootValue("developerMode").then((value) => {
			isDeveloperMode = value === true;
		});

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
		if (closeTimer) clearTimeout(closeTimer);
		document.body.classList.remove("styleshift-tour-active");
		window.removeEventListener("keydown", handleKeyDown);
		window.removeEventListener("resize", scheduleUpdate);
		document.removeEventListener("scroll", scheduleUpdate, true);
		observer?.disconnect();
		if (updateDebounceTimer) cancelAnimationFrame(updateDebounceTimer);
		detachTargetClickListener();
		unregisterSettingListener("developerMode", handleDeveloperModeChange);
		cleanupTourModes();
	});
</script>

<div class="tutorial-tour-container" style="--accent: {currentStep.accent}">
	<TourSpotlight visible={isSpotlightVisible} style={spotlightStyle} closing={isClosing} />

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
		closing={isClosing}
		onShow={handleShow}
		onSecondaryShow={handleSecondaryShow}
		onTry={handleTry}
		onChoice={handleChoice}
		onStopTrial={handleStopTrial}
		onBack={handleBack}
		onNext={handleNext}
		onClose={close}
		onGoTo={goTo}
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

	/* While the tour runs, keep hover-revealed tour targets opaque so
		isElementVisible() accepts them and the ring lands on a real button. */
	:global(body.styleshift-tour-active .styleshift-add-category-button) {
		opacity: 1 !important;
	}

	@media (prefers-reduced-motion: reduce) {
		.tutorial-tour-container :global(*) {
			transition: none !important;
			animation: none !important;
		}
	}
</style>
