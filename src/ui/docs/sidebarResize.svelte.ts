const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 420;
const KEY_STEP = 10;

/** Sidebar width state with mouse and keyboard resizing. */
export function createSidebarResize(initialWidth = 240) {
	let width = $state(initialWidth);

	function clamp(value: number): number {
		return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, value));
	}

	function handleResizeStart(event: MouseEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = width;
		const onMove = (move: MouseEvent) => {
			width = clamp(startWidth + move.clientX - startX);
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	function handleResizeKeys(event: KeyboardEvent) {
		if (event.key === "ArrowLeft") width = clamp(width - KEY_STEP);
		else if (event.key === "ArrowRight") width = clamp(width + KEY_STEP);
	}

	return {
		get width() {
			return width;
		},
		handleResizeStart,
		handleResizeKeys,
	};
}

export type SidebarResize = ReturnType<typeof createSidebarResize>;
