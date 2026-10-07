<script lang="ts">
	interface TabOption {
		id: string;
		label: string;
		icon?: string;
	}

	import Icon from "@base/Icon.svelte";

	let { options = [] as TabOption[], activeId = $bindable(""), className = "", style = "" } = $props();

	const activeIndex = $derived(options.findIndex((opt) => opt.id === activeId));

	const slideTransform = $derived(`translateX(${activeIndex * 100}%)`);
</script>

<div class="styleshift-capsule-toggle {className}" style:--options-count={options.length} {style}>
	{#if options.length > 0}
		<div class="capsule-slide" style:transform={slideTransform}></div>
		{#each options as option (option.id)}
			<button
				class="capsule-button"
				class:active={activeId === option.id}
				onclick={() => (activeId = option.id)}
				type="button"
			>
				{#if option.icon}
					<div class="icon-wrapper">
						<Icon name={option.icon} size={14} />
					</div>
				{/if}
				<span class="label">{option.label}</span>
			</button>
		{/each}
	{/if}
</div>

<style lang="scss">
	.styleshift-capsule-toggle {
		display: grid;
		grid-template-columns: repeat(var(--options-count), 1fr);
		background: var(--bg-surface);
		padding: 3px;
		border-radius: 100px;
		position: relative;
		border: 1px solid var(--border-color);
		width: fit-content;
		min-width: 180px;
	}

	.capsule-slide {
		position: absolute;
		top: 3px;
		left: 3px;
		height: calc(100% - 6px);
		background: var(--theme-0);
		border-radius: 100px;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 1;
		border: 1px solid var(--border-color);
		box-shadow: 0 2px 8px var(--shadow-color);
		width: calc((100% - 6px) / var(--options-count)) !important;
	}

	.capsule-button {
		position: relative;
		z-index: 2;
		background: transparent;
		border: none;
		color: var(--font-color-dim);
		font-size: 12px;
		font-weight: 700;
		padding: 8px 16px;
		border-radius: 100px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		line-height: 1;
		white-space: nowrap;

		&:hover:not(.active) {
			color: var(--font-color);
			background: var(--fg-opacity-05);
		}

		&.active {
			color: white;
		}

		.icon-wrapper {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.label {
			flex-shrink: 0;
		}
	}
</style>
