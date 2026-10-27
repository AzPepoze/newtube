<script lang="ts">
	import { showThemeManager, subscribeLivePreview, subscribeThemeManagerOpen } from "@ui/themes/themeManagerService";
	import { onMount } from "svelte";
	import { backOut, quintOut } from "svelte/easing";
	import { fade, fly, scale } from "svelte/transition";
	import ConfettiOverlay from "../../../ui/tutorial/tour/ConfettiOverlay.svelte";
	import WelcomeButton from "./WelcomeButton.svelte";
	import WelcomeHeading from "./WelcomeHeading.svelte";
	import WelcomeLogo from "./WelcomeLogo.svelte";

	let { onDone }: { onDone: () => void } = $props();

	let visible = $state(false);
	let stepIndex = $state(0);
	let themeWindowOpen = $state(false);
	let livePreviewActive = $state(false);

	/** `showPage` steps drop the background so the real YouTube page shows through. */
	const steps = [
		{ render: hello, showPage: false },
		{ render: look, showPage: true },
		{ render: support, showPage: false },
	];
	const currentStep = $derived(steps[stepIndex]);

	onMount(() => {
		visible = true;
		const unsubscribeManager = subscribeThemeManagerOpen((open) => {
			themeWindowOpen = open;
		});
		const unsubscribePreview = subscribeLivePreview((active) => {
			livePreviewActive = active;
		});
		return () => {
			unsubscribeManager();
			unsubscribePreview();
		};
	});

	function next() {
		if (stepIndex === steps.length - 1) {
			finish();
			return;
		}
		stepIndex += 1;
	}

	function back() {
		stepIndex = Math.max(stepIndex - 1, 0);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (themeWindowOpen || livePreviewActive) return;
		if (event.key === "ArrowRight") next();
		if (event.key === "ArrowLeft") back();
	}

	/** Hides the welcome while the Theme window is open. It fades back in when the window closes. */
	function openThemeWindow() {
		void showThemeManager("installed");
	}

	function finish() {
		visible = false;
		setTimeout(onDone, 500);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet hello()}
	<div class="Step-Container">
		<div class="Visual-Panel Branding-Panel" in:fly|global={{ x: -30, duration: 1000, delay: 300, easing: backOut }}>
			<WelcomeLogo />
		</div>
		<div class="Copy-Panel" in:fly|global={{ x: 30, duration: 1000, delay: 500, easing: backOut }}>
			<WelcomeHeading text="Welcome to StyleShift" level="h1" variant="main" />
			<p class="Lead">Make YouTube look the way you like. Setup takes about a minute.</p>
			<WelcomeButton label="YAY!" onClick={next} withMemes />
		</div>
	</div>
{/snippet}

{#snippet look()}
	<div class="Look-Step">
		<WelcomeHeading text="Pick your look" />
		<p class="Lead">Open the theme window to try a look on YouTube. Keep it to save it.</p>
		<WelcomeButton label="Open themes" onClick={openThemeWindow} variant="highlight" />
	</div>
{/snippet}

{#snippet support()}
	<div class="Step-Container">
		<div class="Visual-Panel Branding-Panel" in:fly|global={{ x: -30, duration: 800, easing: backOut }}>
			<WelcomeLogo />
		</div>
		<div class="Copy-Panel" in:fly|global={{ x: 30, duration: 800, delay: 300, easing: backOut }}>
			<WelcomeHeading text="Enjoy your new experience!" />
			<p class="Lead">
				StyleShift is a free, open-source project. If you enjoy it, please consider supporting its development!
			</p>
			<p class="Secondary-Text">If you run into any issues, please report them on GitHub.</p>
			<WelcomeButton label="Next" onClick={next} variant="highlight" />
		</div>
	</div>
{/snippet}

{#if visible && !themeWindowOpen && !livePreviewActive}
	<div
		class="Welcome-Overlay styleshift-main"
		class:Show-Page={currentStep.showPage}
		transition:fade={{ duration: 400 }}
	>
		{#if !currentStep.showPage}
			<ConfettiOverlay mode="rain" />
		{/if}
		<div
			class="Welcome-Content-Wrapper"
			in:scale={{ start: 0.7, duration: 2500, easing: quintOut }}
			out:scale={{ start: 0.9, duration: 400 }}
		>
			<div class="Welcome-Content">
				{#key stepIndex}
					<div class="Step" in:fade={{ duration: 450, delay: 200 }} out:fade={{ duration: 200 }}>
						{@render currentStep.render()}
					</div>
				{/key}
			</div>
		</div>
		<div class="Footer">
			<div class="Footer-Start" class:Invisible={stepIndex === 0}>
				<WelcomeButton label="Back" onClick={back} variant="secondary" />
			</div>
			<div class="Dots">
				{#each steps as _, index (index)}
					<span class="Dot" class:Active={index === stepIndex}></span>
				{/each}
			</div>
			<div class="Footer-End">
				{#if currentStep.showPage}
					<div transition:fade={{ duration: 300 }}>
						<WelcomeButton label="Next" onClick={next} variant="highlight" />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.Welcome-Overlay {
		position: fixed;
		inset: 0;
		z-index: 19999;
		display: grid;
		place-items: center;
		padding: clamp(20px, 5vw, 72px);
		box-sizing: border-box;
		overflow: hidden;
		color: var(--font-color);
		font-family: "Inter", system-ui, sans-serif;
		background-color: var(--bg-welcome);
		transition: background-color 0.6s ease;
	}
	/* The grid is a layer of its own so it can fade out. */
	.Welcome-Overlay::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(to right, var(--fg-opacity-03) 1px, transparent 1px),
			linear-gradient(to bottom, var(--fg-opacity-03) 1px, transparent 1px);
		background-size: 40px 40px;
		transition: opacity 0.6s ease;
		pointer-events: none;
	}
	/* The real page shows through while the user tests a look. */
	.Welcome-Overlay.Show-Page {
		background-color: transparent;
	}
	.Welcome-Overlay.Show-Page::before {
		opacity: 0;
	}

	.Welcome-Content-Wrapper {
		z-index: 20;
		width: min(1120px, 100%);
	}
	.Welcome-Content {
		position: relative;
		min-height: min(560px, calc(100vh - 140px));
	}
	.Step {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.Step-Container {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: clamp(32px, 6vw, 80px);
		align-items: center;
	}

	.Visual-Panel {
		min-width: 0;
		min-height: 390px;
		box-sizing: border-box;
		border: 1px solid var(--fg-opacity-10);
		border-radius: 38px;
		background: linear-gradient(145deg, var(--fg-opacity-08), var(--fg-opacity-02));
		box-shadow:
			inset 0 1px 0 var(--fg-opacity-10),
			0 30px 80px var(--bg-overlay-50);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: clamp(28px, 5vw, 56px);
	}
	.Branding-Panel {
		border: 0;
		background: none;
		box-shadow: none;
	}

	.Copy-Panel {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 24px;
		text-align: left;
	}
	.Lead {
		max-width: 580px;
		margin: 0;
		color: var(--fg-opacity-50);
		font-size: clamp(17px, 2vw, 22px);
		line-height: 1.55;
	}
	.Secondary-Text {
		margin: -10px 0 0;
		color: var(--fg-opacity-30);
		font-size: 15px;
	}

	.Look-Step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		text-align: center;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
	}
	.Look-Step .Lead {
		color: var(--fg-opacity-80);
	}

	.Footer {
		position: fixed;
		left: 24px;
		right: 24px;
		bottom: 24px;
		z-index: 20;
		height: 56px;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
	}
	.Footer-Start {
		justify-self: start;
		display: flex;
		align-items: center;
	}
	.Footer-Start.Invisible {
		visibility: hidden;
	}
	.Footer-End {
		justify-self: end;
		display: flex;
		align-items: center;
	}
	.Dots {
		display: flex;
		gap: 8px;
	}
	.Dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--fg-opacity-20);
		transition:
			width 0.3s ease,
			background 0.3s ease;
	}
	.Dot.Active {
		width: 24px;
		border-radius: 999px;
		background: var(--theme-0-12);
	}

	@media (max-width: 760px) {
		.Welcome-Overlay {
			padding: 18px;
			overflow-y: auto;
		}
		.Welcome-Content {
			min-height: max(720px, calc(100vh - 36px));
		}
		.Step-Container {
			grid-template-columns: 1fr;
			grid-template-rows: minmax(260px, 0.8fr) auto;
			gap: 24px;
			align-content: center;
			padding-block: 18px;
			box-sizing: border-box;
		}
		.Visual-Panel {
			min-height: 250px;
			max-height: 42vh;
			padding: 26px;
			border-radius: 28px;
		}
		.Copy-Panel {
			align-items: center;
			gap: 17px;
			text-align: center;
		}
		.Lead {
			font-size: 16px;
		}
	}
</style>
