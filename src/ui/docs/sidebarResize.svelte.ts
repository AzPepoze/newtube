const KEY_STEP = 10;

export interface ResizeOptions {
	min: number;
	max: number;
	/** True for a panel on the right edge, which grows when dragged left. */
	fromRight?: boolean;
}

const SIDEBAR: ResizeOptions = { min: 200, max: 420 };

/** Width state with mouse and keyboard resizing for a sidebar or a right-hand panel. */
export function createSidebarResize(initialWidth = 240, options: ResizeOptions = SIDEBAR) {
	let width = $state(initialWidth);
	const direction = options.fromRight ? -1 : 1;

	function clamp(value: number): number {
		return Math.max(options.min, Math.min(options.max, value));
	}

	function handleResizeStart(event: MouseEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = width;
		const onMove = (move: MouseEvent) => {
			width = clamp(startWidth + direction * (move.clientX - startX));
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	}

	function handleResizeKeys(event: KeyboardEvent) {
		const step = direction * KEY_STEP;
		if (event.key === "ArrowLeft") width = clamp(width - step);
		else if (event.key === "ArrowRight") width = clamp(width + step);
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
