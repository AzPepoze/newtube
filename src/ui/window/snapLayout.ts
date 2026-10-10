import {
	DEFAULT_SPLIT,
	clampSplitRatio,
	getSplitDividers,
	type SnapSplit,
	type SnapZone,
	type SplitAxis,
} from "./snap";
import { showSplitDividers } from "./snapDivider";
import type { WindowLogic } from "./windowLogic.svelte";

const snapped = new Set<WindowLogic>();

/** Shared by every snapped window, so a divider moves all of them together. */
export const snapSplit: SnapSplit = { ...DEFAULT_SPLIT };

function getSnappedZones(): SnapZone[] {
	return [...snapped].map((logic) => logic.snapZone).filter((zone): zone is SnapZone => zone !== null);
}

export function renderSplitDividers() {
	const zones = getSnappedZones();
	const dividers = getSplitDividers(zones, snapSplit, window.innerWidth, window.innerHeight);
	showSplitDividers(dividers, startSplitDrag);
}

function resetSplit() {
	snapSplit.x = DEFAULT_SPLIT.x;
	snapSplit.y = DEFAULT_SPLIT.y;
}

export function registerSnapped(logic: WindowLogic) {
	snapped.add(logic);
	renderSplitDividers();
}

export function unregisterSnapped(logic: WindowLogic) {
	snapped.delete(logic);
	if (snapped.size === 0) resetSplit();
	renderSplitDividers();
}

function refreshSnapped() {
	for (const logic of snapped) logic.refreshSnap();
}

function setSnappedResizing(active: boolean) {
	for (const logic of snapped) logic.isResizing = active;
}

function updateSplitFromPointer(axis: SplitAxis, e: MouseEvent) {
	if (axis === "x") {
		snapSplit.x = clampSplitRatio(e.clientX / window.innerWidth);
	} else {
		snapSplit.y = clampSplitRatio(e.clientY / window.innerHeight);
	}
}

function startSplitDrag(axis: SplitAxis, downEvent: MouseEvent) {
	downEvent.preventDefault();
	setSnappedResizing(true);

	const onMouseMove = (moveEvent: MouseEvent) => {
		updateSplitFromPointer(axis, moveEvent);
		refreshSnapped();
		renderSplitDividers();
	};

	const onMouseUp = () => {
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		setSnappedResizing(false);
	};

	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
}

window.addEventListener("resize", renderSplitDividers);
