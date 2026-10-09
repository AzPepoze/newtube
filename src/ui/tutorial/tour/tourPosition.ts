export const VIEWPORT_MARGIN = 16;
export const TARGET_GAP = 14;
export const DEFAULT_CARD_WIDTH = 380;
export const DEFAULT_CARD_HEIGHT = 260;
export const TRIAL_DOCK_STYLE = "bottom: 24px; right: 24px; top: auto; left: auto;";

export interface TargetRect {
	top: number;
	right: number;
	bottom: number;
	left: number;
	width: number;
	height: number;
}

export interface CardSize {
	width: number;
	height: number;
}

export interface Viewport {
	width: number;
	height: number;
}

export interface PlacementInput {
	target: TargetRect | null;
	card: CardSize;
	viewport: Viewport;
	trialMode: boolean;
	windowRect: TargetRect | null;
}

type MeasurableRect = Pick<DOMRect, "top" | "right" | "bottom" | "left" | "width" | "height">;

export function toTargetRect(rect: MeasurableRect): TargetRect {
	return {
		top: rect.top,
		right: rect.right,
		bottom: rect.bottom,
		left: rect.left,
		width: rect.width,
		height: rect.height,
	};
}

export function isElementVisible(element: HTMLElement | null): boolean {
	if (!element) return false;
	if (element.closest(".minimized, .picking-mode")) return false;

	const win = element.closest<HTMLElement>(".styleshift-window-container");
	if (win && win.classList.contains("minimized")) return false;

	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return false;
	if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
	if (rect.right <= 0 || rect.left >= window.innerWidth) return false;

	const style = window.getComputedStyle(element);
	if (style.opacity === "0" || style.display === "none" || style.visibility === "hidden") return false;

	if (win) {
		const winStyle = window.getComputedStyle(win);
		if (winStyle.opacity === "0" || winStyle.display === "none" || winStyle.visibility === "hidden") {
			return false;
		}
	}
	return true;
}

export function isTargetOnTop(target: HTMLElement): boolean {
	const rect = target.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return false;
	if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") return true;
	const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
	if (!top) return false;
	return top === target || target.contains(top);
}

export function ensureTargetVisible(target: HTMLElement): void {
	const scrollContainer = target.closest<HTMLElement>(".sidebar-scroll-area");
	if (!scrollContainer) return;
	const contRect = scrollContainer.getBoundingClientRect();
	const targetRect = target.getBoundingClientRect();
	const isClipped = targetRect.bottom < contRect.top + 20 || targetRect.top > contRect.bottom - 20;
	if (isClipped) target.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function findWindowRect(target: HTMLElement): TargetRect | null {
	const windowEl =
		target.closest<HTMLElement>(".styleshift-window-container, .styleshift-window") ||
		document.querySelector<HTMLElement>(".styleshift-window-container");
	if (!windowEl) return null;
	return toTargetRect(windowEl.getBoundingClientRect());
}

export function spotlightStyleFor(rect: TargetRect): string {
	const cx = rect.left + rect.width / 2;
	const cy = rect.top + rect.height / 2;
	const isCompact = rect.width <= 120 && rect.height <= 80;

	if (isCompact) {
		const radius = Math.round(Math.max(rect.width, rect.height) / 2) + 8;
		const size = radius * 2;
		const top = Math.round(cy - radius);
		const left = Math.round(cx - radius);
		return `top: ${top}px; left: ${left}px; width: ${size}px; height: ${size}px; border-radius: 50%;`;
	}

	const pad = rect.width > rect.height * 2.5 ? 6 : 8;
	const radius = rect.width > rect.height * 2.5 ? 16 : 18;
	const top = Math.round(rect.top - pad);
	const left = Math.round(rect.left - pad);
	const width = Math.round(rect.width + pad * 2);
	const height = Math.round(rect.height + pad * 2);
	return `top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px; border-radius: ${radius}px;`;
}

export function centeredStyle(viewport: Viewport, card: CardSize): string {
	const top = Math.max(VIEWPORT_MARGIN, Math.round((viewport.height - card.height) / 2));
	const left = Math.max(VIEWPORT_MARGIN, Math.round((viewport.width - card.width) / 2));
	return `top: ${top}px; left: ${left}px;`;
}

export function fallbackCardPlacement(
	viewport: Viewport,
	card: CardSize,
	docked: boolean,
	windowRect?: TargetRect | null,
): string {
	if (docked) return TRIAL_DOCK_STYLE;
	if (windowRect) return windowSidePlacement(windowRect, card, viewport);
	return centeredStyle(viewport, card);
}

/** Parks the card beside an open window when the step target itself is missing. */
export function windowSidePlacement(windowRect: TargetRect, card: CardSize, viewport: Viewport): string {
	const spaceLeft = windowRect.left - VIEWPORT_MARGIN;
	const spaceRight = viewport.width - windowRect.right - VIEWPORT_MARGIN;
	const top = clampCardTop(Math.round((viewport.height - card.height) / 2), viewport, card);

	if (spaceRight >= card.width + TARGET_GAP) {
		return `top: ${top}px; left: ${windowRect.right + TARGET_GAP}px; right: auto;`;
	}

	if (spaceLeft >= card.width + TARGET_GAP) {
		return `top: ${top}px; right: ${viewport.width - windowRect.left + TARGET_GAP}px; left: auto;`;
	}

	return TRIAL_DOCK_STYLE;
}

/** Finds the open settings window, if any, independent of the step target. */
export function findOpenWindowRect(): TargetRect | null {
	const windowEl = document.querySelector<HTMLElement>(".styleshift-window-container");
	if (!windowEl || !isElementVisible(windowEl)) return null;
	return toTargetRect(windowEl.getBoundingClientRect());
}

function clampCardTop(idealTop: number, viewport: Viewport, card: CardSize): number {
	return Math.max(VIEWPORT_MARGIN, Math.min(idealTop, viewport.height - card.height - VIEWPORT_MARGIN));
}

export function cardPlacementFor(input: PlacementInput): string {
	const { target, card, viewport, trialMode, windowRect } = input;

	if (trialMode || !target) {
		return trialMode ? TRIAL_DOCK_STYLE : centeredStyle(viewport, card);
	}

	if (target.top < 80 && target.right > viewport.width - 250) {
		const top = Math.min(target.bottom + TARGET_GAP, viewport.height - card.height - VIEWPORT_MARGIN);
		const right = Math.max(VIEWPORT_MARGIN, viewport.width - target.right);
		return `top: ${top}px; right: ${right}px; left: auto;`;
	}

	if (windowRect) {
		const spaceLeft = windowRect.left - VIEWPORT_MARGIN;
		const spaceRight = viewport.width - windowRect.right - VIEWPORT_MARGIN;

		if (spaceRight >= card.width + TARGET_GAP) {
			const left = windowRect.right + TARGET_GAP;
			const idealTop = target.top + (target.height - card.height) / 2;
			return `top: ${clampCardTop(idealTop, viewport, card)}px; left: ${left}px; right: auto;`;
		}

		if (spaceLeft >= card.width + TARGET_GAP) {
			const right = viewport.width - windowRect.left + TARGET_GAP;
			const idealTop = target.top + (target.height - card.height) / 2;
			return `top: ${clampCardTop(idealTop, viewport, card)}px; right: ${right}px; left: auto;`;
		}

		const isTargetInBottomRight =
			target.bottom > viewport.height - card.height - 40 && target.right > viewport.width - card.width - 40;
		if (isTargetInBottomRight) {
			return "bottom: 24px; left: 24px; top: auto; right: auto;";
		}
		return TRIAL_DOCK_STYLE;
	}

	if (viewport.width - target.right > card.width + TARGET_GAP + VIEWPORT_MARGIN) {
		const left = target.right + TARGET_GAP;
		const idealTop = target.top + (target.height - card.height) / 2;
		return `top: ${clampCardTop(idealTop, viewport, card)}px; left: ${left}px; right: auto;`;
	}

	if (target.bottom + card.height + TARGET_GAP + VIEWPORT_MARGIN <= viewport.height) {
		const top = target.bottom + TARGET_GAP;
		const left = Math.max(VIEWPORT_MARGIN, Math.min(target.left, viewport.width - card.width - VIEWPORT_MARGIN));
		return `top: ${top}px; left: ${left}px; right: auto;`;
	}

	return centeredStyle(viewport, card);
}
