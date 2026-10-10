import type { Box } from "./dragPlacement";

const LIFT_MS = 150;
const SNAP_MS = 180;
const LIFTED_SHADOW = "0 12px 32px rgba(0, 0, 0, 0.45)";

export interface DragGhost {
	moveTo: (y: number) => void;
	pickUp: () => void;
	snapTo: (rect: DOMRect | null) => Promise<void>;
	remove: () => void;
}

function motionMs(ms: number) {
	return matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

/** Ancestors from `.styleshift-main` (or body) down to the frame's parent. */
function ancestorChain(frame: HTMLElement): HTMLElement[] {
	const chain: HTMLElement[] = [];
	let el = frame.parentElement;
	while (el && el !== document.body) {
		chain.unshift(el);
		if (el.classList.contains("styleshift-main")) break;
		el = el.parentElement;
	}
	return chain;
}

/** An empty element with the same class and data attributes, so ancestor selectors and theme variables still match. */
function createShell(source: HTMLElement): HTMLElement {
	const shell = document.createElement(source.tagName);
	for (const attr of Array.from(source.attributes)) {
		if (attr.name === "class" || attr.name.startsWith("data-")) shell.setAttribute(attr.name, attr.value);
	}
	shell.style.display = "contents";
	return shell;
}

/** A copy of `frame` on body, placed in viewport coordinates, styled as if it were still in its list. */
export function createDragGhost(frame: HTMLElement, box: Box): DragGhost {
	const shells = ancestorChain(frame).map(createShell);
	const ghost = frame.cloneNode(true) as HTMLElement;
	ghost.removeAttribute("id");
	Object.assign(ghost.style, {
		position: "fixed",
		left: "0px",
		top: "0px",
		margin: "0",
		boxSizing: "border-box",
		width: `${box.width}px`,
		height: `${box.height}px`,
		pointerEvents: "none",
		zIndex: "10000",
		scale: "1",
		transition: `scale ${motionMs(LIFT_MS)}ms ease-out, box-shadow ${motionMs(LIFT_MS)}ms ease-out`,
	});

	let parent: HTMLElement = document.body;
	const container = shells[0] ?? ghost;
	for (const shell of shells) {
		parent.appendChild(shell);
		parent = shell;
	}
	parent.appendChild(ghost);
	if (shells.length === 0) document.body.appendChild(ghost);

	function moveTo(y: number) {
		ghost.style.translate = `${box.left}px ${y}px`;
	}

	function pickUp() {
		requestAnimationFrame(() => {
			ghost.style.scale = "1.02";
			ghost.style.boxShadow = LIFTED_SHADOW;
		});
	}

	function snapTo(rect: DOMRect | null) {
		if (!rect) return Promise.resolve();
		const duration = motionMs(SNAP_MS);
		ghost.style.transition = `translate ${duration}ms ease-out, scale ${duration}ms ease-out, box-shadow ${duration}ms ease-out`;
		ghost.style.translate = `${rect.left}px ${rect.top}px`;
		ghost.style.scale = "1";
		ghost.style.boxShadow = "none";
		return new Promise<void>((resolve) => setTimeout(resolve, duration));
	}

	return {
		moveTo,
		pickUp,
		snapTo,
		remove: () => container.remove(),
	};
}
