import { autoScrollDelta, pickNearest, type Box, type NearestTarget } from "./dragPlacement";
import { createDragGhost } from "./dragGhost";
import { createPlaceholder } from "./dragPlaceholder";

export interface PreviewSlot {
	anchor: HTMLElement;
	isAfter: boolean;
}

export interface DropCandidate<T> {
	el: HTMLElement;
	value: T;
	preview?: (isAfter: boolean) => PreviewSlot;
}

export interface DropHit<T> {
	value: T;
	isAfter: boolean;
}

export interface DragSessionOptions<T> {
	event: MouseEvent;
	frame: HTMLElement;
	scroller: HTMLElement;
	getCandidates: () => DropCandidate<T>[];
	onDrop: (hit: DropHit<T>) => void | Promise<void>;
}

function boxOf(el: HTMLElement): Box {
	const rect = el.getBoundingClientRect();
	return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

/** Drags a copy of `frame` under the pointer and previews the drop slot with a placeholder. */
export function startDragSession<T>(options: DragSessionOptions<T>) {
	const { event, frame, scroller, getCandidates, onDrop } = options;
	if (!frame.parentElement) return;

	const frameBox = boxOf(frame);
	const scrollerRect = scroller.getBoundingClientRect();
	const grabOffsetY = event.clientY - frameBox.top;
	const originalDisplay = frame.style.display;
	const ghost = createDragGhost(frame, frameBox);
	const placeholder = createPlaceholder(frameBox.height);

	let pointer = { x: event.clientX, y: event.clientY };
	let frameId = 0;
	let lastHit: DropHit<T> | null = null;
	let lastHitEl: HTMLElement | null = null;

	function candidatesWithBoxes() {
		return getCandidates()
			.filter((candidate) => candidate.el !== frame && scroller.contains(candidate.el))
			.map((candidate) => ({ box: boxOf(candidate.el), value: candidate }));
	}

	function showPlaceholderAt(nearest: NearestTarget<DropCandidate<T>>) {
		const { value: candidate, isAfter } = nearest;
		if (candidate.el === lastHitEl && lastHit?.isAfter === isAfter) return;

		lastHitEl = candidate.el;
		lastHit = { value: candidate.value, isAfter };
		const slot = candidate.preview?.(isAfter) ?? { anchor: candidate.el, isAfter };
		placeholder.showAt(slot.anchor, slot.isAfter);
	}

	function update() {
		scroller.scrollTop += autoScrollDelta(pointer.y, scrollerRect);
		ghost.moveTo(pointer.y - grabOffsetY);

		const nearest = pickNearest(pointer, candidatesWithBoxes());
		if (nearest) showPlaceholderAt(nearest);
		frameId = requestAnimationFrame(update);
	}

	/** True when the placeholder is still beside the frame's own slot, so dropping changes nothing. */
	function isAtOriginalSlot() {
		const el = placeholder.element();
		return !el || el.previousElementSibling === frame || el.nextElementSibling === frame;
	}

	async function finish(commit: boolean) {
		cancelAnimationFrame(frameId);
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onUp);
		document.removeEventListener("keydown", onKey);

		const hit = commit && lastHit && !isAtOriginalSlot() ? lastHit : null;
		if (!hit) placeholder.snapTo(frame);
		placeholder.settle();
		await ghost.snapTo(placeholder.rect());

		try {
			if (hit) await onDrop(hit);
		} finally {
			ghost.remove();
			placeholder.remove();
			frame.style.display = originalDisplay;
			scroller.removeAttribute("draging");
			document.documentElement.style.cursor = "";
		}
	}

	function onMove(moveEvent: MouseEvent) {
		pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
	}

	function onUp() {
		void finish(true);
	}

	function onKey(keyEvent: KeyboardEvent) {
		if (keyEvent.key === "Escape") void finish(false);
	}

	placeholder.snapTo(frame);
	frame.style.display = "none";
	scroller.setAttribute("draging", "");
	document.documentElement.style.cursor = "grabbing";
	ghost.pickUp();
	document.addEventListener("mousemove", onMove);
	document.addEventListener("mouseup", onUp, { once: true });
	document.addEventListener("keydown", onKey);
	update();
}
