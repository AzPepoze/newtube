<script lang="ts">
	let {
		label = "Resize sidebar",
		hint = "Drag to resize sidebar",
		onResizeStart,
		onResizeKeys,
	}: {
		label?: string;
		hint?: string;
		onResizeStart: (event: MouseEvent) => void;
		onResizeKeys?: (event: KeyboardEvent) => void;
	} = $props();
</script>

<div
	class="styleshift-resize-bar"
	role="button"
	tabindex="0"
	aria-label={label}
	title={hint}
	onmousedown={onResizeStart}
	onkeydown={onResizeKeys}
></div>

<style lang="scss">
	.styleshift-resize-bar {
		width: 5px;
		flex-shrink: 0;
		margin: 6px 4px;
		cursor: col-resize;
		background: var(--border-color);
		user-select: none;
		border-radius: 10px;
		transition:
			background 0.2s ease,
			box-shadow 0.2s ease,
			transform 0.2s ease;

		&:hover,
		&:active,
		&:focus-visible {
			background: var(--theme-0);
			box-shadow: 0 0 10px var(--theme-0);
			transform: scaleX(1.6);
			outline: none;
		}
	}
</style>
