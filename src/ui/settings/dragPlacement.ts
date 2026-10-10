export interface Point {
	x: number;
	y: number;
}

export interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface Candidate<T> {
	box: Box;
	value: T;
}

export interface NearestTarget<T> {
	value: T;
	isAfter: boolean;
}

const HORIZONTAL_WEIGHT = 0.25;
const AUTO_SCROLL_EDGE = 40;
const AUTO_SCROLL_MAX_STEP = 12;

/** Vertical distance counts fully, so rows win over columns that are far to the side. */
export function distanceToBox(point: Point, box: Box) {
	const centerX = box.left + box.width / 2;
	const centerY = box.top + box.height / 2;
	return Math.abs(point.y - centerY) + Math.abs(point.x - centerX) * HORIZONTAL_WEIGHT;
}

export function pickNearest<T>(point: Point, candidates: Candidate<T>[]): NearestTarget<T> | null {
	let best: Candidate<T> | null = null;
	let bestDistance = Infinity;

	for (const candidate of candidates) {
		const distance = distanceToBox(point, candidate.box);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = candidate;
		}
	}
	if (!best) return null;

	const centerY = best.box.top + best.box.height / 2;
	return { value: best.value, isAfter: point.y > centerY };
}

function scrollStep(depth: number) {
	return Math.min(AUTO_SCROLL_MAX_STEP, depth / 3);
}

/** Pixels to scroll while the pointer is near the top or bottom edge of the scroller. */
export function autoScrollDelta(pointerY: number, rect: { top: number; bottom: number }) {
	const fromTop = pointerY - rect.top;
	const fromBottom = rect.bottom - pointerY;

	if (fromTop < AUTO_SCROLL_EDGE) return -scrollStep(AUTO_SCROLL_EDGE - fromTop);
	if (fromBottom < AUTO_SCROLL_EDGE) return scrollStep(AUTO_SCROLL_EDGE - fromBottom);
	return 0;
}
