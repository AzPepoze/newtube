<script lang="ts">
	import { logger } from "@/shared/logger";
	import { IS_FIREFOX } from "@core/index";
	import { alertPrompt } from "@core/shared/dialogs";
	import { onMount } from "svelte";
	import { backOut, quintOut } from "svelte/easing";
	import { fade, fly, scale } from "svelte/transition";
	import WelcomeButton from "./WelcomeButton.svelte";
	import WelcomeHeading from "./WelcomeHeading.svelte";
	import WelcomeLogo from "./WelcomeLogo.svelte";

	let { onDone }: { onDone: () => void } = $props();

	let visible = $state(false);
	let step = $state(1);
	let commands: chrome.commands.Command[] = $state([]);

	onMount(() => {
		visible = true;
	});

	function nextStep() {
		step += 1;
		if (step === 2) void fetchCommandsShortcut();
	}

	async function fetchCommandsShortcut() {
		logger.info("ui", "Fetching all keyboard shortcuts");
		try {
			const response = await chrome.runtime.sendMessage({ Command: "getCommands" });
			if (Array.isArray(response)) commands = response.filter((command) => command.shortcut);
		} catch (error) {
			logger.error("ui", "Failed to fetch commands:", error);
		}
	}

	function manageShortcuts() {
		if (IS_FIREFOX) {
			void alertPrompt({
				title: "Shortcuts Management",
				message:
					'Cannot open shortcut settings in Firefox.\nPlease navigate to "about:addons" manually to manage shortcuts.',
			});
			return;
		}

		void chrome.runtime.sendMessage({ Command: "editCommands" });
	}

	function close() {
		visible = false;
		setTimeout(onDone, 500);
	}
</script>

{#if visible}
	<div class="Welcome-Overlay styleshift-main" transition:fade={{ duration: 1000 }}>
		<div class="Glow-Effect"></div>
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
				{:else if step === 2}
					<div class="Step-Container" in:fade={{ duration: 600, delay: 200 }} out:fade={{ duration: 400 }}>
						<div class="Shortcuts-Panel" in:fly|global={{ x: -30, duration: 800, easing: backOut }}>
							<div class="Shortcuts-Label">Current Shortcuts</div>
							{#if commands.length > 0}
								<div class="shortcuts-list">
									{#each commands as command (command.name)}
										<div class="shortcut-item">
											<span class="shortcut-desc">{command.description || command.name}</span>
											<kbd>{command.shortcut}</kbd>
										</div>
									{/each}
								</div>
							{:else}
								<div class="Shortcuts-Empty"><span>⌨️</span><strong>No shortcuts configured</strong></div>
							{/if}
						</div>
						<div class="Copy-Panel" in:fly|global={{ x: 30, duration: 800, delay: 300, easing: backOut }}>
							<WelcomeHeading text="Keyboard shortcuts" />
							<p class="Lead">You can change these in your browser's extension settings.</p>
							<div class="Button-Stack">
								<WelcomeButton label="Manage Shortcuts" onClick={manageShortcuts} variant="secondary" />
								<WelcomeButton label="Next" onClick={nextStep} variant="highlight" />
							</div>
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

	.Button-Stack {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
	}

	.Shortcuts-Panel {
		min-width: 0;
		min-height: 390px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		max-height: min(560px, 70vh);
		padding: clamp(28px, 5vw, 56px);
		box-sizing: border-box;
	}
	.Shortcuts-Label {
		margin-bottom: 18px;
		color: var(--fg-opacity-60);
		font-size: 14px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-align: center;
		text-transform: uppercase;
	}
	.shortcuts-list {
		width: 100%;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-right: 6px;
	}
	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 13px 15px;
		border: 1px solid var(--fg-opacity-10);
		border-radius: 14px;
		background: var(--fg-opacity-08);
		box-shadow: 0 8px 24px var(--bg-overlay-20);
	}
	.shortcut-desc {
		min-width: 0;
		color: var(--fg-opacity-60);
		font-size: 14px;
	}
	kbd {
		flex: 0 0 auto;
		padding: 5px 8px;
		border: 1px solid var(--theme-0-30);
		border-radius: 6px;
		color: var(--theme-0-Text);
		background: var(--theme-0-15);
		font:
			700 12px ui-monospace,
			monospace;
	}
	.Shortcuts-Empty {
		flex: 1;
		display: grid;
		place-items: center;
		align-content: center;
		gap: 16px;
		color: var(--fg-opacity-40);
	}
	.Shortcuts-Empty span {
		font-size: 72px;
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
		.Button-Stack {
			justify-content: center;
		}
		.Shortcuts-Panel {
			min-height: 250px;
			max-height: 42vh;
			padding: 26px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.Glow-Effect {
			animation: none;
		}
	}
</style>
