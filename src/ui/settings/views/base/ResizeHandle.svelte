<script lang="ts">
	let {
		target,
		position = "right",
		onResize = () => {},
	}: {
		target: HTMLElement;
		position?: "top" | "right" | "bottom" | "left";
		onResize?: (size: { width: number; height: number }) => void;
	} = $props();

	function handleMouseDown(e: MouseEvent) {
		if (!target) return;
		e.preventDefault();

		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = target.offsetWidth;
		const startHeight = target.offsetHeight;

		function onMouseMove(e: MouseEvent) {
			let newWidth = startWidth;
			let newHeight = startHeight;

			if (position === "right") {
				newWidth = startWidth + (e.clientX - startX);
				target.style.width = `${newWidth}px`;
			} else if (position === "left") {
				newWidth = startWidth - (e.clientX - startX);
				target.style.width = `${newWidth}px`;
			} else if (position === "bottom") {
				newHeight = startHeight + (e.clientY - startY);
				target.style.height = `${newHeight}px`;
			} else if (position === "top") {
				newHeight = startHeight - (e.clientY - startY);
				target.style.height = `${newHeight}px`;
			}

			onResize({ width: newWidth, height: newHeight });
		}

		function onMouseUp() {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			document.body.style.cursor = "";
		}

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
		document.body.style.cursor = position === "left" || position === "right" ? "col-resize" : "row-resize";
	}
</script>

<div
	class="styleshift-resize-handle pos-{position}"
	onmousedown={handleMouseDown}
	role="button"
	tabindex="-1"
	aria-label="Resize handle"
></div>

<style lang="scss">
	.styleshift-resize-handle {
		background: transparent;
		transition: background 0.2s;
		z-index: 10;
		flex-shrink: 0;

		&:hover,
		&:active {
			background: var(--fg-opacity-20);
		}

		&.pos-right,
		&.pos-left {
			width: 6px;
			cursor: col-resize;
			height: 100%;
		}

		&.pos-right {
			margin-left: -3px;
			margin-right: -3px;
		}

		&.pos-left {
			margin-left: -3px;
			margin-right: -3px;
		}

		&.pos-top,
		&.pos-bottom {
			height: 6px;
			cursor: row-resize;
			width: 100%;
		}

		&.pos-top {
			margin-top: -3px;
			margin-bottom: -3px;
		}

		&.pos-bottom {
			margin-top: -3px;
			margin-bottom: -3px;
		}
	}
</style>
