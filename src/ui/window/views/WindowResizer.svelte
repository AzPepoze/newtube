<script lang="ts">
	let {
		target,
		onResize = () => {},
		onResizeStart = () => {},
		onResizeEnd = () => {},
		minWidth = 300,
		minHeight = 200,
		aspectRatio = 0,
	}: {
		target: HTMLElement;
		onResize?: (size: { width: number; height: number; x: number; y: number }) => void;
		onResizeStart?: () => void;
		onResizeEnd?: () => void;
		minWidth?: number;
		minHeight?: number;
		aspectRatio?: number;
	} = $props();

	type Direction = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

	let activeDir = $state<Direction | null>(null);

	function handleMouseDown(e: MouseEvent, dir: Direction) {
		if (!target) return;
		e.preventDefault();
		e.stopPropagation();

		activeDir = dir;
		onResizeStart();

		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = target.offsetWidth;
		const startHeight = target.offsetHeight;
		const rect = target.getBoundingClientRect();
		const startLeft = rect.left;
		const startTop = rect.top;

		const _viewportWidth = window.innerWidth;
		const _viewportHeight = window.innerHeight;

		function onMouseMove(e: MouseEvent) {
			let newWidth = startWidth;
			let newHeight = startHeight;
			let newLeft = startLeft;
			let newTop = startTop;

			const dx = e.clientX - startX;
			const dy = e.clientY - startY;

			const minVisibleWidth = minWidth * 0.1;
			const minVisibleHeight = Math.max(40, minHeight * 0.1);

			if (dir.includes("e")) {
				newWidth = Math.max(minWidth, startWidth + dx);
				// Boundary check: right side can go off-screen but leave 10%
				if (newLeft + newWidth < minVisibleWidth) {
					newWidth = minVisibleWidth - newLeft;
				}
			}
			if (dir.includes("w")) {
				const requestedWidth = startWidth - dx;
				if (requestedWidth >= minWidth) {
					newWidth = requestedWidth;
					newLeft = startLeft + dx;
				} else {
					newWidth = minWidth;
					newLeft = startLeft + (startWidth - minWidth);
				}
				// Boundary check: left side can go off-screen but leave 10%
				const rightEdge = startLeft + startWidth;
				if (newLeft > rightEdge - minVisibleWidth) {
					newLeft = rightEdge - minVisibleWidth;
					newWidth = rightEdge - newLeft;
				}
			}

			if (dir.includes("s")) {
				newHeight = Math.max(minHeight, startHeight + dy);
				// Boundary check: bottom side can go off-screen but leave 10%
				if (newTop + newHeight < minVisibleHeight) {
					newHeight = minVisibleHeight - newTop;
				}
			}
			if (dir.includes("n")) {
				const requestedHeight = startHeight - dy;
				if (requestedHeight >= minHeight) {
					newHeight = requestedHeight;
					newTop = startTop + dy;
				} else {
					newHeight = minHeight;
					newTop = startTop + (startHeight - minHeight);
				}
				// Boundary check: top side cannot go off-screen (keep title bar)
				if (newTop < 0) {
					newTop = 0;
					newHeight = startHeight + startTop;
				}
			}

			if (aspectRatio > 0) {
				// Keep aspect ratio
				if (dir === "e" || dir === "w") {
					newHeight = newWidth / aspectRatio;
				} else if (dir === "s" || dir === "n") {
					newWidth = newHeight * aspectRatio;
				} else {
					// Corners
					const currentRatio = newWidth / newHeight;
					if (currentRatio > aspectRatio) {
						newWidth = newHeight * aspectRatio;
					} else {
						newHeight = newWidth / aspectRatio;
					}
				}

				// Adjust position if resizing from north or west
				if (dir.includes("n")) {
					newTop = startTop + (startHeight - newHeight);
				}
				if (dir.includes("w")) {
					newLeft = startLeft + (startWidth - newWidth);
				}
			}

			target.style.width = `${Math.round(newWidth)}px`;
			target.style.height = `${Math.round(newHeight)}px`;
			target.style.translate = `${Math.round(newLeft)}px ${Math.round(newTop)}px`;

			onResize({
				width: newWidth,
				height: newHeight,
				x: newLeft,
				y: newTop,
			});
		}

		function onMouseUp() {
			activeDir = null;
			onResizeEnd();
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			document.body.style.cursor = "";
		}

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);

		const cursorMap: Record<Direction, string> = {
			n: "ns-resize",
			s: "ns-resize",
			e: "ew-resize",
			w: "ew-resize",
			ne: "nesw-resize",
			sw: "nesw-resize",
			nw: "nwse-resize",
			se: "nwse-resize",
		};
		document.body.style.cursor = cursorMap[dir];
	}
</script>

<div class="styleshift-window-resizer" role="presentation">
	<!-- Edge handles -->
	<div
		class="handle n"
		class:active={activeDir === "n"}
		onmousedown={(e) => handleMouseDown(e, "n")}
		role="presentation"
	></div>
	<div
		class="handle s"
		class:active={activeDir === "s"}
		onmousedown={(e) => handleMouseDown(e, "s")}
		role="presentation"
	></div>
	<div
		class="handle e"
		class:active={activeDir === "e"}
		onmousedown={(e) => handleMouseDown(e, "e")}
		role="presentation"
	></div>
	<div
		class="handle w"
		class:active={activeDir === "w"}
		onmousedown={(e) => handleMouseDown(e, "w")}
		role="presentation"
	></div>

	<!-- Corner handles -->
	<div
		class="handle nw"
		class:active={activeDir === "nw"}
		onmousedown={(e) => handleMouseDown(e, "nw")}
		role="presentation"
	></div>
	<div
		class="handle ne"
		class:active={activeDir === "ne"}
		onmousedown={(e) => handleMouseDown(e, "ne")}
		role="presentation"
	></div>
	<div
		class="handle se"
		class:active={activeDir === "se"}
		onmousedown={(e) => handleMouseDown(e, "se")}
		role="presentation"
	></div>
	<div
		class="handle sw"
		class:active={activeDir === "sw"}
		onmousedown={(e) => handleMouseDown(e, "sw")}
		role="presentation"
	></div>
</div>

<style lang="scss">
	.styleshift-window-resizer {
		--handle-thickness: 4px;
		--corner-size: 16px;
		--glow-color: var(--theme-0, #7f5db7);

		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 100;
	}

	.handle {
		position: absolute;
		pointer-events: auto;
		background: transparent;
		transition:
			background 0.2s,
			box-shadow 0.2s,
			opacity 0.2s;
		opacity: 0;

		&:hover,
		&.active {
			background: var(--glow-color);
			box-shadow:
				0 0 10px var(--glow-color),
				0 0 20px var(--glow-color);
			opacity: 1;
			z-index: 102;
		}

		/* Edges */
		&.n {
			top: -2px;
			left: var(--corner-size);
			right: var(--corner-size);
			height: var(--handle-thickness);
			cursor: ns-resize;
		}
		&.s {
			bottom: -2px;
			left: var(--corner-size);
			right: var(--corner-size);
			height: var(--handle-thickness);
			cursor: ns-resize;
		}
		&.e {
			right: -2px;
			top: var(--corner-size);
			bottom: var(--corner-size);
			width: var(--handle-thickness);
			cursor: ew-resize;
		}
		&.w {
			left: -2px;
			top: var(--corner-size);
			bottom: var(--corner-size);
			width: var(--handle-thickness);
			cursor: ew-resize;
		}

		/* Corners */
		&.nw,
		&.ne,
		&.se,
		&.sw {
			width: var(--corner-size);
			height: var(--corner-size);
			z-index: 101;
			border-radius: 50%; /* Make corners circular for better feel */
		}

		&.nw {
			top: calc(var(--corner-size) / -2);
			left: calc(var(--corner-size) / -2);
			cursor: nwse-resize;
		}
		&.ne {
			top: calc(var(--corner-size) / -2);
			right: calc(var(--corner-size) / -2);
			cursor: nesw-resize;
		}
		&.se {
			bottom: calc(var(--corner-size) / -2);
			right: calc(var(--corner-size) / -2);
			cursor: nwse-resize;
		}
		&.sw {
			bottom: calc(var(--corner-size) / -2);
			left: calc(var(--corner-size) / -2);
			cursor: nesw-resize;
		}
	}
</style>
