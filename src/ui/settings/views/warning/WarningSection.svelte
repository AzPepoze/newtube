<script lang="ts">
	import type { Setting } from "@settings/types/styleshiftTypes";
	import Icon from "@base/Icon.svelte";
	import { WarningSectionController } from "../../WarningSectionController.svelte";

	let {
		isLocked,
		lockMessage,
		requirementsMet,
		require,
		requiredSettings,
	}: {
		isLocked: boolean;
		lockMessage?: string;
		requirementsMet: boolean;
		require?: Setting["require"];
		requiredSettings: Record<string, any>;
	} = $props();

	const controller = $derived(
		new WarningSectionController({
			isLocked,
			lockMessage,
			requirementsMet,
			require,
			requiredSettings,
		}),
	);

	function scrollToSetting(id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "center" });
		el.classList.add("highlight-flash");
		setTimeout(() => el.classList.remove("highlight-flash"), 2000);
	}
</script>

{#if isLocked || !requirementsMet}
	<div class="styleshift-warning-section" class:is-locked={isLocked}>
		<div class="warning-list">
			{#if isLocked}
				<div class="warning-item">
					<div class="icon-box">
						<Icon name="lock" size={16} color="var(--callout-accent)" />
					</div>
					<span class="message">{lockMessage || "This setting is currently locked."}</span>
				</div>
			{/if}

			{#if !requirementsMet && controller.unmetRequirements.length > 0}
				<div class="warning-item">
					<div class="icon-box">
						<Icon name="warning" size={18} color="var(--callout-accent)" />
					</div>
					<div class="requirement-content">
						<span class="title">Missing Requirements:</span>
						<ul class="unmet-list">
							{#each controller.unmetRequirements as req (req.id)}
								<li>
									<button class="nav-tag" onclick={() => scrollToSetting(req.id)} title="Go to {req.name}">
										<span>{req.name}</span>
										<Icon name="arrow_forward" size={10} />
									</button>
									<span class="action-text">{controller.formatValue(req)}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.styleshift-warning-section {
		--callout-accent: var(--callout-warning);
		--callout-bg: var(--callout-warning-bg);
		--callout-border: var(--callout-warning-border);
		margin-top: 12px;
		padding: 12px 16px;
		background: var(--callout-bg);
		border: 1px solid var(--callout-border);
		border-radius: 12px;
		animation: slideIn 0.3s ease-out;

		&.is-locked {
			--callout-accent: var(--callout-error);
			--callout-bg: var(--callout-error-bg);
			--callout-border: var(--callout-error-border);
		}
	}

	.warning-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.warning-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;

		.icon-box {
			flex-shrink: 0;
			width: 24px;
			height: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.message {
			font-size: 13px;
			color: var(--fg-opacity-90);
			line-height: 1.5;
			padding-top: 2px;
		}
	}

	.requirement-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 2px;
		min-width: 0;

		.title {
			font-size: 13px;
			font-weight: 600;
			color: var(--fg-opacity-100);
		}
	}

	.unmet-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 4px;

		li {
			font-size: 12px;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 8px;
			min-width: 0;

			&::before {
				content: "•";
				color: var(--fg-opacity-30);
			}
		}
	}

	.nav-tag {
		display: flex;
		align-items: center;
		gap: 4px;
		max-width: 100%;
		background: var(--fg-opacity-08);
		border: 1px solid var(--fg-opacity-10);
		padding: 2px 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--fg-opacity-100);
		font-weight: 500;
		font-family: inherit;
		font-size: 11px;

		span {
			overflow-wrap: anywhere;
		}

		&:hover {
			background: var(--fg-opacity-15);
			border-color: var(--fg-opacity-20);
			filter: brightness(1.2);
			box-shadow: 0 2px 8px var(--shadow-subtle);
		}
	}

	.action-text {
		color: var(--fg-opacity-50);
		font-style: italic;
		overflow-wrap: anywhere;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.highlight-flash) {
		animation: flash-animation 2s ease-out;
	}

	@keyframes flash-animation {
		0% {
			box-shadow: 0 0 0 0 var(--theme-0);
		}
		20% {
			box-shadow: 0 0 0 4px var(--theme-0);
		}
		100% {
			box-shadow: 0 0 0 0 transparent;
		}
	}
</style>
