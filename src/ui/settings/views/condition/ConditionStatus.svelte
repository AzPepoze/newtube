<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { ConditionStatusController } from "../../ConditionStatusController.svelte";

	let {
		conditionsMet,
		condition,
		requiredSettings,
	}: {
		conditionsMet: boolean;
		condition: Record<string, any>;
		requiredSettings: Record<string, { name: string; value: any; type: string; options?: any }>;
	} = $props();

	const controller = $derived(
		new ConditionStatusController({
			conditionsMet,
			condition,
			requiredSettings,
		}),
	);
</script>

<div class="styleshift-condition-status-container" class:is-all-met={conditionsMet}>
	<div class="status-header">
		<Icon
			name={conditionsMet ? "check_circle" : "rule"}
			size={16}
			color={conditionsMet ? "var(--theme-success)" : "var(--fg-opacity-80)"}
		/>
		<span class="status-title">{conditionsMet ? "All conditions met" : "Conditions pending"}</span>
	</div>

	<ul class="conditions-list">
		{#each controller.conditionItems as item (item.id)}
			<li class:is-met={item.met}>
				<span class="item-icon">
					{#if item.met}
						<Icon name="check" size={12} color="var(--theme-success)" />
					{:else}
						<span class="dot"></span>
					{/if}
				</span>
				<span class="item-name">{item.name}</span>
				<span class="item-target">{controller.formatCondition(item)}</span>
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	.styleshift-condition-status-container {
		margin-top: 8px;
		width: 100%;
		box-sizing: border-box;
		padding: 10px 12px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;

		&.is-all-met {
			border-color: var(--theme-success-20);
		}
	}

	.status-header {
		display: flex;
		align-items: center;
		gap: 6px;

		.status-title {
			font-size: 12.5px;
			font-weight: 600;
			letter-spacing: 0.2px;
			color: var(--fg-opacity-80);
		}
	}

	.conditions-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 4px;

		li {
			display: grid;
			grid-template-columns: 16px minmax(0, 1fr) auto;
			align-items: center;
			gap: 8px;

			.item-icon {
				width: 16px;
				height: 16px;
				display: flex;
				align-items: center;
				justify-content: center;

				.dot {
					width: 5px;
					height: 5px;
					border-radius: 50%;
					background: var(--fg-opacity-30);
				}
			}

			.item-name {
				font-size: 12px;
				font-weight: 500;
				color: var(--fg-opacity-70);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.item-target {
				font-size: 11.5px;
				color: var(--fg-opacity-50);
				background: var(--fg-opacity-05);
				padding: 1px 7px;
				border-radius: 5px;
				white-space: nowrap;
			}

			&.is-met {
				.item-name {
					color: var(--fg-opacity-90);
				}

				.item-target {
					color: var(--theme-success);
					background: var(--theme-success-20);
				}
			}
		}
	}
</style>
