<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import type { Snippet } from "svelte";
	import type { PanelNavItem } from "./palette";

	let {
		items,
		selected,
		title,
		open = true,
		devMode = false,
		children,
	}: {
		items: PanelNavItem[];
		selected: string;
		title: string;
		open?: boolean;
		devMode?: boolean;
		children?: Snippet;
	} = $props();
</script>

<aside class="panel" class:open>
	<nav class="panel-nav">
		<span class="nav-header">Extension</span>
		{#each items as item (item.label)}
			<span class="nav-item" class:selected={item.label === selected}>
				<Icon name={item.icon} size={14} />
				<span class="nav-text">{item.label}</span>
			</span>
		{/each}
		{#if devMode}
			<span class="nav-add">+</span>
		{/if}
	</nav>

	<div class="panel-content">
		<span class="search"><Icon name="search" size={13} />Search settings</span>
		<div class="panel-title">{title}</div>
		<div class="panel-body">
			{@render children?.()}
		</div>
	</div>
</aside>

<style lang="scss">
	.panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 60%;
		display: flex;
		background: var(--window-bg);
		border-left: 1px solid var(--border-subtle);
		box-shadow: -10px 0 30px var(--shadow-color);
		color: var(--font-color);
		transform: translateX(104%);
		transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);

		&.open {
			transform: translateX(0);
		}
	}

	.panel-nav {
		width: 128px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 8px;
		background: var(--category-left-bg);
		border-right: 1px solid var(--border-subtle);
	}

	.nav-header {
		padding: 6px 6px 4px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--font-color-dim);
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		border-radius: 8px;
		font-size: 11px;
		color: var(--font-color-dim);
		transition:
			background 400ms ease,
			color 400ms ease;

		&.selected {
			background: color-mix(in srgb, var(--accent) 22%, transparent);
			color: var(--font-color);
			font-weight: 700;
		}
	}

	.nav-text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-add {
		margin-top: 2px;
		padding: 4px;
		border: 1px dashed var(--accent);
		border-radius: 999px;
		text-align: center;
		color: var(--accent);
		font-weight: 700;
		animation: add-in 500ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.panel-content {
		position: relative;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		border-radius: 999px;
		border: 1px solid var(--fg-opacity-10);
		font-size: 11px;
		color: var(--font-color-dim);
	}

	.panel-title {
		padding: 6px;
		border-radius: 999px;
		background: var(--category-title-bg, var(--fg-opacity-10));
		color: black;
		text-align: center;
		font-size: 13px;
		font-weight: 700;
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow: hidden;
	}

	@keyframes add-in {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
