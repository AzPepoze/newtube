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
	const scrollContainer = target.closest<HTMLElement>(".sidebar-scroll-area, .styleshift-settings-list");
	if (!scrollContainer) return;
	const contRect = scrollContainer.getBoundingClientRect();
	const targetRect = target.getBoundingClientRect();
	const isClipped = targetRect.bottom < contRect.top + 20 || targetRect.top > contRect.bottom - 20;
	if (isClipped) target.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Brings a step target that exists but sits fully outside the panel's scrolled
 * view (e.g. deep in a long category) into view so the ring can land on it.
 * Only touches the settings scroll containers, never the page. Returns whether
 * a scroll was triggered.
 */
export function revealPanelTarget(target: HTMLElement): boolean {
	const scrollContainer = target.closest<HTMLElement>(".sidebar-scroll-area, .styleshift-settings-list");
	if (!scrollContainer) return false;
	const contRect = scrollContainer.getBoundingClientRect();
	const targetRect = target.getBoundingClientRect();
	if (targetRect.bottom < contRect.top || targetRect.top > contRect.bottom) {
		target.scrollIntoView({ behavior: "auto", block: "center" });
		return true;
	}
	return false;
}

export function findWindowRect(target: HTMLElement): TargetRect | null {
	const windowEl =
		target.closest<HTMLElement>(".styleshift-window-container, .styleshift-window") ||
		document.querySelector<HTMLElement>(".styleshift-window-container");
	if (!windowEl) return null;
	return toTargetRect(windowEl.getBoundingClientRect());
}

/** Intersects a target rect with the viewport so off-screen overflow never shapes the ring. */
function clampToViewport(rect: TargetRect, viewport: Viewport): TargetRect {
	const top = Math.max(0, rect.top);
	const left = Math.max(0, rect.left);
	const bottom = Math.min(viewport.height, rect.bottom);
	const right = Math.min(viewport.width, rect.right);
	return {
		top,
		right,
		bottom,
		left,
		width: Math.max(0, right - left),
		height: Math.max(0, bottom - top),
	};
}

interface SpotlightBox {
	top: number;
	left: number;
	width: number;
	height: number;
	radius: number;
	circle: boolean;
}

/** Keeps the finished ring fully on-screen, shrinking it against the viewport edges. */
function clampSpotlightBox(box: SpotlightBox, viewport: Viewport): SpotlightBox {
	const top = Math.max(0, box.top);
	const left = Math.max(0, box.left);
	const height = Math.max(0, Math.min(box.height, viewport.height - top));
	const width = Math.max(0, Math.min(box.width, viewport.width - left));
	return { ...box, top, left, width, height };
}

function spotlightBoxStyle(box: SpotlightBox): string {
	const radius = box.circle ? "50%" : `${box.radius}px`;
	const top = Math.round(box.top);
	const left = Math.round(box.left);
	const width = Math.round(box.width);
	const height = Math.round(box.height);
	return `top: ${top}px; left: ${left}px; width: ${width}px; ` + `height: ${height}px; border-radius: ${radius};`;
}

export function spotlightStyleFor(rect: TargetRect, viewport: Viewport): string {
	const visible = clampToViewport(rect, viewport);
	const cx = visible.left + visible.width / 2;
	const cy = visible.top + visible.height / 2;
	const isCompact = visible.width <= 120 && visible.height <= 80;

	if (isCompact) {
		const radius = Math.round(Math.max(visible.width, visible.height) / 2) + 8;
		const size = radius * 2;
		// Keep the ring centered on the target even near viewport edges. Clamping
		// the box into view would shift its center and squash it into an ellipse;
		// overflow is clipped by the viewport while the visible arc stays centered.
		return spotlightBoxStyle(
			{ top: cy - radius, left: cx - radius, width: size, height: size, radius: 0, circle: true },
		);
	}

	const pad = visible.width > visible.height * 2.5 ? 6 : 8;
	const radius = visible.width > visible.height * 2.5 ? 16 : 18;
	return spotlightBoxStyle(
		clampSpotlightBox(
			{
				top: visible.top - pad,
				left: visible.left - pad,
				width: visible.width + pad * 2,
				height: visible.height + pad * 2,
				radius,
				circle: false,
			},
			viewport,
		),
	);
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
