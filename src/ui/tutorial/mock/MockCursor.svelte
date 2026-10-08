<script lang="ts">
	let {
		x = "50%",
		y = "50%",
		pressed = false,
		visible = true,
	}: {
		x?: string;
		y?: string;
		pressed?: boolean;
		visible?: boolean;
	} = $props();
</script>

<div class="cursor" class:pressed class:hidden={!visible} style="left: {x}; top: {y};">
	<svg viewBox="0 0 24 24" aria-hidden="true">
		<path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 14 L19 14 Z" />
	</svg>
</div>

<style lang="scss">
	.cursor {
		position: absolute;
		z-index: 5;
		width: 20px;
		height: 20px;
		transform: translate(-3px, -2px);
		pointer-events: none;
		transition:
			left 700ms cubic-bezier(0.65, 0, 0.35, 1),
			top 700ms cubic-bezier(0.65, 0, 0.35, 1),
			opacity 300ms ease,
			scale 150ms ease;

		&.pressed {
			scale: 0.8;
		}

		&.hidden {
			opacity: 0;
		}
	}

	svg {
		width: 100%;
		height: 100%;
		fill: #ffffff;
		stroke: #000000;
		stroke-width: 1;
		filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
	}
</style>
