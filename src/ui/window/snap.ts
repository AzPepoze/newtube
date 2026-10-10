export type SnapZone = "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "maximize";

export interface WindowRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/** Where the shared split sits, as a fraction of the viewport (0.5 is the centre). */
export interface SnapSplit {
	x: number;
	y: number;
}

export type SplitAxis = "x" | "y";

/** A visible split line. `start` and `end` are the span along the line, in px. */
export interface SplitDivider {
	axis: SplitAxis;
	position: number;
	start: number;
	end: number;
}

export const DEFAULT_SPLIT: SnapSplit = { x: 0.5, y: 0.5 };
const SPLIT_MIN = 0.2;
const SPLIT_MAX = 0.8;

const LEFT_ZONES: SnapZone[] = ["left", "top-left", "bottom-left"];
const RIGHT_ZONES: SnapZone[] = ["right", "top-right", "bottom-right"];
const TOP_ZONES: SnapZone[] = ["top-left", "top-right"];
const BOTTOM_ZONES: SnapZone[] = ["bottom-left", "bottom-right"];

const EDGE_PX = 24;
// Same size as --corner-size in WindowResizer.svelte, so every corner matches the resize handle.
const CORNER_PX = 64;

function getCornerZone(x: number, y: number, viewportWidth: number, viewportHeight: number): SnapZone | null {
	const isLeft = x <= CORNER_PX;
	const isRight = x >= viewportWidth - CORNER_PX;
	const isTop = y <= CORNER_PX;
	const isBottom = y >= viewportHeight - CORNER_PX;

	if (isTop && isLeft) return "top-left";
	if (isTop && isRight) return "top-right";
	if (isBottom && isLeft) return "bottom-left";
	if (isBottom && isRight) return "bottom-right";
	return null;
}

/**
 * Returns the zone under the cursor, or null when the cursor is not near an edge.
 */
export function getSnapZone(x: number, y: number, viewportWidth: number, viewportHeight: number): SnapZone | null {
	const corner = getCornerZone(x, y, viewportWidth, viewportHeight);
	if (corner) return corner;
	if (x <= EDGE_PX) return "left";
	if (x >= viewportWidth - EDGE_PX) return "right";
	if (y <= EDGE_PX) return "maximize";
	return null;
}

export function clampSplitRatio(ratio: number) {
	return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, ratio));
}

export function getSnapRect(
	zone: SnapZone,
	viewportWidth: number,
	viewportHeight: number,
	split: SnapSplit = DEFAULT_SPLIT,
): WindowRect {
	const leftWidth = viewportWidth * split.x;
	const rightWidth = viewportWidth - leftWidth;
	const topHeight = viewportHeight * split.y;
	const bottomHeight = viewportHeight - topHeight;

	switch (zone) {
		case "left":
			return { left: 0, top: 0, width: leftWidth, height: viewportHeight };
		case "right":
			return { left: leftWidth, top: 0, width: rightWidth, height: viewportHeight };
		case "top-left":
			return { left: 0, top: 0, width: leftWidth, height: topHeight };
		case "top-right":
			return { left: leftWidth, top: 0, width: rightWidth, height: topHeight };
		case "bottom-left":
			return { left: 0, top: topHeight, width: leftWidth, height: bottomHeight };
		case "bottom-right":
			return { left: leftWidth, top: topHeight, width: rightWidth, height: bottomHeight };
		case "maximize":
			return { left: 0, top: 0, width: viewportWidth, height: viewportHeight };
	}
}

function hasZoneIn(zones: SnapZone[], group: SnapZone[]) {
	return zones.some((zone) => group.includes(zone));
}

function getSpan(rect: WindowRect, axis: SplitAxis): [number, number] {
	return axis === "x" ? [rect.top, rect.top + rect.height] : [rect.left, rect.left + rect.width];
}

/**
 * A divider exists only when windows sit on both sides of it.
 * Its span covers every snapped window that touches it.
 */
function getDivider(
	zones: SnapZone[],
	split: SnapSplit,
	viewportWidth: number,
	viewportHeight: number,
	axis: SplitAxis,
): SplitDivider | null {
	const sides = axis === "x" ? [LEFT_ZONES, RIGHT_ZONES] : [TOP_ZONES, BOTTOM_ZONES];
	if (!sides.every((group) => hasZoneIn(zones, group))) return null;

	const touching = zones.filter((zone) => sides.some((group) => group.includes(zone)));
	const spans = touching.map((zone) => getSpan(getSnapRect(zone, viewportWidth, viewportHeight, split), axis));
	const position = axis === "x" ? viewportWidth * split.x : viewportHeight * split.y;
	return {
		axis,
		position,
		start: Math.min(...spans.map(([start]) => start)),
		end: Math.max(...spans.map(([, end]) => end)),
	};
}

export function getSplitDividers(
	zones: SnapZone[],
	split: SnapSplit,
	viewportWidth: number,
	viewportHeight: number,
): SplitDivider[] {
	const dividers: SplitDivider[] = [];
	for (const axis of ["x", "y"] as const) {
		const divider = getDivider(zones, split, viewportWidth, viewportHeight, axis);
		if (divider) dividers.push(divider);
	}
	return dividers;
}
