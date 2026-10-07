<script lang="ts">
	let { value = $bindable(0), min = 0, max = 1, vertical = false, onInput = () => {}, onChange = () => {} } = $props();

	let sliderEl = $state<HTMLElement | null>(null);
	let isDragging = $state(false);

	function updateValue(e: PointerEvent) {
		if (!sliderEl) return;
		const rect = sliderEl.getBoundingClientRect();
		let percent = 0;

		if (vertical) {
			const pos = e.clientY - rect.top;
			percent = 1 - pos / rect.height;
		} else {
			const pos = e.clientX - rect.left;
			percent = pos / rect.width;
		}

		percent = Math.max(0, Math.min(1, percent));
		value = min + percent * (max - min);
		onInput(value);
	}

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		updateValue(e);
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isDragging) {
			updateValue(e);
		}
	}

	function handlePointerUp(_e: PointerEvent) {
		if (isDragging) {
			isDragging = false;
			onChange(value);
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
		}
	}

	let progress = $derived(((value - min) / (max - min)) * 100);
</script>

<div
	class="styleshift-slider"
	class:vertical
	class:dragging={isDragging}
	bind:this={sliderEl}
	onpointerdown={handlePointerDown}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={value}
	tabindex="0"
>
	<div class="slider-track">
		<div class="slider-progress" style={vertical ? `height: ${progress}%` : `width: ${progress}%`}></div>
	</div>
	<div class="slider-thumb" style={vertical ? `bottom: ${progress}%` : `left: ${progress}%`}></div>
</div>

<style lang="scss">
	.styleshift-slider {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		cursor: pointer;
		user-select: none;
		touch-action: none;

		&:not(.vertical) {
			width: 100%;
			height: 20px;
		}

		&.vertical {
			height: 100%;
			width: 20px;
		}
	}

	.slider-track {
		position: absolute;
		background: var(--fg-opacity-15);
		border-radius: 2px;
		overflow: hidden;

		.styleshift-slider:not(.vertical) & {
			width: 100%;
			height: 4px;
		}

		.styleshift-slider.vertical & {
			height: 100%;
			width: 4px;
		}
	}

	.slider-progress {
		background: var(--theme-0, #7f5db7);
		border-radius: 2px;
		position: absolute;

		.styleshift-slider:not(.vertical) & {
			top: 0;
			left: 0;
			height: 100%;
		}

		.styleshift-slider.vertical & {
			bottom: 0;
			left: 0;
			width: 100%;
		}
	}

	.slider-thumb {
		position: absolute;
		width: 12px;
		height: 12px;
		background: white;
		border-radius: 50%;
		box-shadow: 0 2px 4px var(--shadow-color);
		transition: transform 0.1s;
		z-index: 2;

		.styleshift-slider:not(.vertical) & {
			top: 50%;
			transform: translate(-50%, -50%);
		}

		.styleshift-slider.vertical & {
			left: 50%;
			transform: translate(-50%, 50%);
		}

		.styleshift-slider:hover &,
		.styleshift-slider.dragging & {
			transform: translate(-50%, -50%) scale(1.2);
		}

		.styleshift-slider.vertical:hover &,
		.styleshift-slider.vertical.dragging & {
			transform: translate(-50%, 50%) scale(1.2);
		}
	}
</style>
