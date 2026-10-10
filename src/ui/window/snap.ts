export type SnapZone = "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "maximize";

export interface WindowRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

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

export function getSnapRect(zone: SnapZone, viewportWidth: number, viewportHeight: number): WindowRect {
	const halfWidth = viewportWidth / 2;
	const halfHeight = viewportHeight / 2;

	switch (zone) {
		case "left":
			return { left: 0, top: 0, width: halfWidth, height: viewportHeight };
		case "right":
			return { left: halfWidth, top: 0, width: halfWidth, height: viewportHeight };
		case "top-left":
			return { left: 0, top: 0, width: halfWidth, height: halfHeight };
		case "top-right":
			return { left: halfWidth, top: 0, width: halfWidth, height: halfHeight };
		case "bottom-left":
			return { left: 0, top: halfHeight, width: halfWidth, height: halfHeight };
		case "bottom-right":
			return { left: halfWidth, top: halfHeight, width: halfWidth, height: halfHeight };
		case "maximize":
			return { left: 0, top: 0, width: viewportWidth, height: viewportHeight };
	}
}
