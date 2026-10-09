<script lang="ts">
	let { visible = false, style = "" }: { visible?: boolean; style?: string } = $props();
</script>

<div class="tour-spotlight-circle" class:visible {style}></div>

<style lang="scss">
	.tour-spotlight-circle {
		position: fixed;
		pointer-events: none;
		z-index: 14999;
		border: 3px solid var(--accent);
		box-shadow:
			0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent),
			0 0 24px color-mix(in srgb, var(--accent) 90%, transparent),
			inset 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
		animation: tour-circle-pulse 1.8s ease-in-out infinite;
		box-sizing: border-box;
		opacity: 0;
		transition:
			top 220ms cubic-bezier(0.2, 0, 0, 1),
			left 220ms cubic-bezier(0.2, 0, 0, 1),
			width 220ms cubic-bezier(0.2, 0, 0, 1),
			height 220ms cubic-bezier(0.2, 0, 0, 1),
			border-radius 220ms ease,
			opacity 180ms ease;

		&.visible {
			opacity: 1;
		}
	}

	@keyframes tour-circle-pulse {
		0%,
		100% {
			transform: scale(1);
			box-shadow:
				0 0 0 4px color-mix(in srgb, var(--accent) 30%, transparent),
				0 0 20px color-mix(in srgb, var(--accent) 80%, transparent),
				inset 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
		}
		50% {
			transform: scale(1.08);
			box-shadow:
				0 0 0 10px color-mix(in srgb, var(--accent) 20%, transparent),
				0 0 35px color-mix(in srgb, var(--accent) 100%, transparent),
				inset 0 0 16px color-mix(in srgb, var(--accent) 35%, transparent);
		}
	}
</style>
