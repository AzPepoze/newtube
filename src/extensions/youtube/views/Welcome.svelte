<script lang="ts">
	import { onMount } from "svelte";
	import { backOut, quintOut } from "svelte/easing";
	import { fade, fly, scale } from "svelte/transition";
	import WelcomeButton from "./WelcomeButton.svelte";
	import WelcomeHeading from "./WelcomeHeading.svelte";
	import WelcomeLogo from "./WelcomeLogo.svelte";
	import ConfettiOverlay from "../../../ui/tutorial/tour/ConfettiOverlay.svelte";

	let { onDone }: { onDone: () => void } = $props();

	let visible = $state(false);
	let step = $state(1);

	onMount(() => {
		visible = true;
	});

	function nextStep() {
		step += 1;
	}

	function close() {
		visible = false;
		setTimeout(onDone, 500);
	}
</script>

{#if visible}
	<div class="Welcome-Overlay styleshift-main" transition:fade={{ duration: 1000 }}>
		<div class="Glow-Effect"></div>
		<ConfettiOverlay mode="rain" />
		<div
			class="Welcome-Content-Wrapper"
			in:scale={{ start: 0.7, duration: 2500, easing: quintOut }}
			out:scale={{ start: 0.9, duration: 400 }}
		>
			<div class="Welcome-Content">
				{#if step === 1}
					<div class="Step-Container" out:fade={{ duration: 400 }}>
						<div
							class="Visual-Panel Branding-Panel"
							in:fly|global={{ x: -30, duration: 1000, delay: 300, easing: backOut }}
						>
							<WelcomeLogo />
						</div>
						<div class="Copy-Panel" in:fly|global={{ x: 30, duration: 1000, delay: 500, easing: backOut }}>
							<WelcomeHeading text="Welcome to NewTube" level="h1" variant="main" />
							<WelcomeButton label="YAY!" onClick={nextStep} withMemes />
						</div>
					</div>
				{:else}
					<div class="Step-Container" in:fade={{ duration: 600, delay: 200 }}>
						<div class="Visual-Panel Branding-Panel" in:fly|global={{ x: -30, duration: 800, easing: backOut }}>
							<WelcomeLogo />
						</div>
						<div class="Copy-Panel" in:fly|global={{ x: 30, duration: 800, delay: 300, easing: backOut }}>
							<WelcomeHeading text="Enjoy your new experience!" />
							<p class="Lead">
								NewTube is a free, open-source project. If you enjoy using it, please consider supporting its
								development to help me keep improving the experience for everyone!
							</p>
							<p class="Secondary-Text">If you encounter any issues, please report them on GitHub.</p>
							<WelcomeButton label="Let's GO!!!" onClick={close} variant="highlight" withMemes />
						</div>
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
		background-image:
			linear-gradient(to right, var(--fg-opacity-03) 1px, transparent 1px),
			linear-gradient(to bottom, var(--fg-opacity-03) 1px, transparent 1px);
		background-size: 40px 40px;
	}

	.Glow-Effect {
		position: absolute;
		width: 150%;
		height: 150%;
		z-index: 2;
		pointer-events: none;
		background: radial-gradient(circle at center, var(--theme-0-12) 0%, transparent 60%);
		animation: pulseGlow 8s infinite alternate ease-in-out;
	}

	.Welcome-Content-Wrapper {
		z-index: 20;
		width: min(1120px, 100%);
	}
	.Welcome-Content {
		position: relative;
		min-height: min(620px, calc(100vh - 40px));
	}
	.Step-Container {
		position: absolute;
		inset: 0;
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

	@keyframes pulseGlow {
		from {
			transform: scale(1);
			opacity: 0.4;
		}
		to {
			transform: scale(1.3);
			opacity: 0.7;
		}
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

	@media (prefers-reduced-motion: reduce) {
		.Glow-Effect {
			animation: none;
		}
	}
</style>
