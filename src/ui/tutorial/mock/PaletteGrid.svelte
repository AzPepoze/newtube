<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import type { PaletteItem } from "./palette";

	let {
		items,
		hotId = "",
		pressedId = "",
		onSelect = () => {},
	}: {
		items: PaletteItem[];
		hotId?: string;
		pressedId?: string;
		onSelect?: (id: string) => void;
	} = $props();
</script>

<div class="palette">
	{#each items as item, index (item.id)}
		<button
			class="palette-button"
			class:hot={item.id === hotId}
			class:pressed={item.id === pressedId}
			style="--btn: {item.color}; --i: {index};"
			onclick={() => onSelect(item.id)}
		>
			<Icon name={item.icon} size={15} />
			<span>{item.label}</span>
		</button>
	{/each}
</div>

<style lang="scss">
	.palette {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.palette-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid color-mix(in srgb, var(--btn) 60%, transparent);
		background: color-mix(in srgb, var(--btn) 18%, transparent);
		color: var(--font-color);
		font-family: inherit;
		font-size: 11px;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		animation: pop-in 500ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
		animation-delay: calc(var(--i) * 70ms);
		transition:
			transform 200ms ease,
			box-shadow 400ms ease;

		&:hover {
			filter: brightness(1.15);
		}

		&.hot {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 65%, transparent);
		}

		&.pressed {
			transform: scale(0.94);
		}
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
