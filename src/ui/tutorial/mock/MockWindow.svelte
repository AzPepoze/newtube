<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import type { Snippet } from "svelte";

	let {
		title,
		open = false,
		placement = "",
		children,
	}: {
		title: string;
		open?: boolean;
		placement?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="window" class:open style={placement}>
	<div class="window-head">
		<span>{title}</span>
		<Icon name="close" size={12} />
	</div>
	<div class="window-body">
		{@render children?.()}
	</div>
</div>

<style lang="scss">
	.window {
		position: absolute;
		z-index: 3;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		border: 1px solid var(--border-subtle);
		background: var(--window-bg);
		box-shadow: 0 12px 30px var(--shadow-color);
		color: var(--font-color);
		overflow: hidden;
		opacity: 0;
		scale: 0.94;
		pointer-events: none;
		transition:
			opacity 450ms ease,
			scale 500ms cubic-bezier(0.22, 1, 0.36, 1);

		&.open {
			opacity: 1;
			scale: 1;
		}
	}

	.window-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-bottom: 1px solid var(--border-subtle);
		font-size: 12px;
		font-weight: 700;
	}

	.window-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px;
		min-height: 0;
		flex: 1;
	}
</style>
