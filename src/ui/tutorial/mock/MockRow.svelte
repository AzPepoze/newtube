<script lang="ts">
	import Icon from "@base/Icon.svelte";

	let {
		name,
		on,
		dev = false,
		actions = false,
		highlight = false,
		isNew = false,
	}: {
		name: string;
		on?: boolean;
		dev?: boolean;
		actions?: boolean;
		highlight?: boolean;
		isNew?: boolean;
	} = $props();
</script>

<div class="row" class:dev class:highlight class:is-new={isNew}>
	<span class="handle"><Icon name="drag" size={14} /></span>
	<span class="row-name">{name}</span>
	<span class="row-actions" class:shown={actions}>
		<span class="action" class:active={highlight}><Icon name="edit" size={13} /></span>
		<span class="action"><Icon name="delete" size={13} /></span>
	</span>
	{#if on !== undefined}
		<span class="toggle" class:on>
			<span class="knob"></span>
		</span>
	{/if}
</div>

<style lang="scss">
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-03);
		font-size: 12px;
		color: var(--font-color);
		transition:
			border-color 400ms ease,
			box-shadow 400ms ease;

		&.highlight {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent);
		}

		&.is-new {
			border-style: dashed;
			border-color: var(--accent);
			animation: row-in 600ms cubic-bezier(0.22, 1, 0.36, 1);
		}
	}

	.handle {
		display: flex;
		width: 0;
		overflow: hidden;
		opacity: 0;
		color: var(--accent);
		transition:
			width 400ms ease,
			opacity 400ms ease;

		.dev & {
			width: 14px;
			opacity: 1;
		}
	}

	.row-name {
		flex: 1;
		min-width: 0;
		font-weight: 600;
	}

	.row-actions {
		display: flex;
		gap: 6px;
		color: var(--font-color-dim);
		opacity: 0;
		transition: opacity 400ms ease;

		&.shown {
			opacity: 1;
		}
	}

	.action {
		display: flex;
		padding: 2px;
		border-radius: 5px;
		transition:
			background 300ms ease,
			color 300ms ease;

		&.active {
			background: color-mix(in srgb, var(--accent) 35%, transparent);
			color: var(--font-color);
		}
	}

	.toggle {
		position: relative;
		width: 34px;
		height: 18px;
		border-radius: 999px;
		background: var(--fg-opacity-20);
		transition: background 400ms ease;
		flex-shrink: 0;

		&.on {
			background: var(--accent);
		}
	}

	.knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--fg-opacity-100);
		transition: transform 400ms cubic-bezier(0.22, 1, 0.36, 1);

		.on & {
			transform: translateX(16px);
		}
	}

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
