<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import type { TutorialStep } from "../tutorialSteps";

	let {
		step,
		steps,
		index,
		trialMode,
		tierLabel,
		canProceed,
		isFirstStep,
		isLastStep,
		positionStyle,
		isPositioned,
		isPanelOpen,
		panelNeeded,
		closing = false,
		cardEl = $bindable(null),
		onShow,
		onSecondaryShow,
		onTry,
		onChoice,
		onStopTrial,
		onBack,
		onNext,
		onClose,
		onGoTo,
		onReopen,
	}: {
		step: TutorialStep;
		steps: TutorialStep[];
		index: number;
		trialMode: boolean;
		tierLabel: string;
		canProceed: boolean;
		isFirstStep: boolean;
		isLastStep: boolean;
		positionStyle: string;
		isPositioned: boolean;
		isPanelOpen: boolean;
		panelNeeded: boolean;
		closing?: boolean;
		cardEl: HTMLElement | null;
		onShow: () => void;
		onSecondaryShow: () => void;
		onTry: () => void;
		onChoice: (accepted: boolean) => void;
		onStopTrial: () => void;
		onBack: () => void;
		onNext: () => void;
		onClose: () => void;
		onGoTo: (index: number) => void;
		onReopen: () => void;
	} = $props();
</script>

<aside
	bind:this={cardEl}
	class="tutorial-card"
	class:visible={isPositioned}
	class:trial-mode={trialMode}
	class:closing
	style={positionStyle}
	aria-label="Tutorial coach mark"
>
	<header class="card-header">
		<div class="header-left">
			<span class="step-tier" class:trial={trialMode}>
				{trialMode ? "Trial Mode" : tierLabel}
			</span>
			<span class="step-count">{index + 1} / {steps.length}</span>
		</div>
		<button class="card-close" aria-label="Close tutorial" onclick={onClose}>
			<Icon name="close" size={16} />
		</button>
	</header>

	<div class="card-body">
		{#if trialMode}
			<h2 class="step-title">Trying: {step.title}</h2>
			{#if step.try === "quickCustomize"}
				<p class="step-text">
					Click any element on the page to customize it. When you're done trying, click <strong>Done trial</strong> or
					<strong>Next</strong>.
				</p>
			{:else if step.try === "customize"}
				<p class="step-text">
					Hover over parts of YouTube to inspect them, and click one to edit. When you're done trying, click
					<strong>Done trial</strong> or <strong>Next</strong>.
				</p>
			{/if}
		{:else}
			<h2 class="step-title">{step.title}</h2>
			<p class="step-text">{step.body}</p>

			{#if step.bullets.length}
				<ul class="step-bullets">
					{#each step.bullets as bullet (bullet)}
						<li>{bullet}</li>
					{/each}
				</ul>
			{/if}

			{#if panelNeeded && !isPanelOpen}
				<div class="panel-notice" role="status">
					<Icon name="open_in_new" size={14} />
					<span>Settings panel is minimized or closed.</span>
					<button class="notice-btn" onclick={onReopen}>Reopen panel</button>
				</div>
			{/if}

			{#if step.show || step.try || step.secondaryShow}
				<div class="action-row">
					{#if step.show}
						<button class="action-btn show-btn" onclick={onShow}>
							<Icon name="arrow_forward" size={15} />
							<span>{step.actionLabel || "Show me"}</span>
						</button>
					{/if}

					{#if step.secondaryShow}
						<button class="action-btn secondary-btn" onclick={onSecondaryShow}>
							<Icon name="storefront" size={15} />
							<span>{step.secondaryShow.label}</span>
						</button>
					{/if}

					{#if step.try}
						<button class="action-btn try-btn" onclick={onTry}>
							<Icon name="auto_fix_high" size={15} />
							<span>Try it</span>
						</button>
					{/if}
				</div>
			{/if}
		{/if}
	</div>

	{#if trialMode}
		<footer class="card-footer trial-footer">
			<button class="nav-btn" onclick={onStopTrial}>Done trial</button>
			<button class="nav-btn primary" onclick={onNext}>Next</button>
		</footer>
	{:else if step.choice}
		<footer class="card-footer choice-footer">
			<button class="nav-btn" onclick={onBack} disabled={isFirstStep}>Back</button>
			<button class="nav-btn" onclick={() => onChoice(false)}>{step.choice.declineLabel}</button>
			<button class="nav-btn primary" onclick={() => onChoice(true)}>{step.choice.acceptLabel}</button>
		</footer>
	{:else}
		<footer class="card-footer">
			<button class="nav-btn" onclick={onBack} disabled={isFirstStep}>Back</button>

			<div class="nav-dots" role="tablist" aria-label="Tour steps">
				{#each steps as dotStep, dotIndex (dotStep.id)}
					<button
						class="dot"
						class:active={dotIndex === index}
						class:done={dotIndex < index}
						aria-label="Go to step {dotIndex + 1}"
						onclick={() => onGoTo(dotIndex)}
					></button>
				{/each}
			</div>

			<button
				class="nav-btn primary"
				onclick={onNext}
				disabled={!canProceed}
				title={!canProceed ? "Open the panel to proceed" : undefined}
			>
				{isLastStep ? "Done" : "Next"}
			</button>
		</footer>
	{/if}
</aside>

<style lang="scss">
	.tutorial-card {
		position: fixed;
		pointer-events: auto;
		width: 380px;
		max-width: calc(100vw - 32px);
		border-radius: 14px;
		border: 1px solid var(--border-subtle);
		background: var(--window-bg);
		backdrop-filter: var(--window-blur) var(--window-saturate);
		-webkit-backdrop-filter: var(--window-blur) var(--window-saturate);
		box-shadow: 0 16px 48px var(--shadow-color);
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		box-sizing: border-box;
		opacity: 0;
		transition:
			top 220ms cubic-bezier(0.2, 0, 0, 1),
			left 220ms cubic-bezier(0.2, 0, 0, 1),
			right 220ms cubic-bezier(0.2, 0, 0, 1),
			bottom 220ms cubic-bezier(0.2, 0, 0, 1),
			width 200ms ease,
			opacity 180ms ease,
			transform 200ms ease;

		&.visible {
			opacity: 1;
		}

		&.closing {
			opacity: 0;
			transform: scale(0.96) translateY(8px);
		}

		&.trial-mode {
			width: 340px;
			box-shadow: 0 12px 36px var(--shadow-color);
		}
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.step-tier {
		padding: 2px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--font-color);

		&.trial {
			background: color-mix(in srgb, var(--accent) 35%, transparent);
			border-color: var(--accent);
		}
	}

	.step-count {
		font-size: 12px;
		font-weight: 600;
		color: var(--font-color-dim);
	}

	.card-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--font-color-dim);
		cursor: pointer;
		transition:
			background 150ms ease,
			color 150ms ease;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.step-title {
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		color: var(--font-color);
		line-height: 1.3;
	}

	.step-text {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--font-color-dim);
	}

	.step-bullets {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 12px;
		color: var(--font-color-dim);

		li {
			position: relative;
			padding-left: 14px;

			&::before {
				content: "";
				position: absolute;
				left: 0;
				top: 6px;
				width: 5px;
				height: 5px;
				border-radius: 50%;
				background: var(--accent);
			}
		}
	}

	.panel-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		font-size: 12px;
		font-weight: 600;
		color: var(--font-color);
	}

	.notice-btn {
		margin-left: auto;
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--fg-opacity-100);
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;

		&:hover {
			filter: brightness(1.1);
		}
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background 150ms ease,
			transform 100ms ease;

		&:active {
			transform: scale(0.97);
		}

		&.show-btn {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			border-color: color-mix(in srgb, var(--accent) 50%, transparent);
			color: var(--font-color);

			&:hover {
				background: color-mix(in srgb, var(--accent) 35%, transparent);
			}
		}

		&.secondary-btn {
			background: var(--fg-opacity-05);
			border-color: var(--fg-opacity-15);
			color: var(--font-color);

			&:hover {
				background: var(--fg-opacity-10);
			}
		}

		&.try-btn {
			background: var(--accent);
			border-color: var(--accent);
			color: var(--fg-opacity-100);

			&:hover {
				filter: brightness(1.1);
			}
		}
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-top: 6px;
		border-top: 1px solid var(--border-subtle);

		&.trial-footer {
			justify-content: flex-end;
		}

		&.choice-footer {
			.nav-btn {
				padding: 6px 10px;
				white-space: nowrap;
			}
		}
	}

	.nav-dots {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dot {
		width: 8px;
		height: 8px;
		padding: 0;
		border-radius: 50%;
		border: none;
		background: var(--fg-opacity-15);
		cursor: pointer;
		transition:
			background 180ms ease,
			transform 180ms ease;

		&:hover {
			background: var(--fg-opacity-35);
		}

		&.active {
			background: var(--accent);
			transform: scale(1.25);
		}

		&.done {
			background: color-mix(in srgb, var(--accent) 50%, transparent);
		}
	}

	.nav-btn {
		padding: 6px 14px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-15);
		background: transparent;
		color: var(--font-color);
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition:
			background 150ms ease,
			transform 100ms ease;

		&:hover:not(:disabled) {
			background: var(--fg-opacity-05);
		}

		&:active:not(:disabled) {
			transform: scale(0.97);
		}

		&:disabled {
			opacity: 0.35;
			cursor: not-allowed;
		}

		&.primary {
			background: var(--accent);
			border-color: var(--accent);
			color: var(--fg-opacity-100);

			&:hover {
				filter: brightness(1.1);
			}
		}
	}
</style>
