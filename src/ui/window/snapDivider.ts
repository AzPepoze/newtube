import { applyThemeToElement } from "@ui/themes/theme";
import type { SplitAxis, SplitDivider } from "./snap";

type DragStartHandler = (axis: SplitAxis, e: MouseEvent) => void;

const elements: Partial<Record<SplitAxis, HTMLElement>> = {};

/** Like the preview, dividers live on the body so the window transform does not affect them. */
function getDividerElement(axis: SplitAxis): HTMLElement {
	let el = elements[axis];
	if (!el) {
		el = document.createElement("div");
		el.className = `styleshift-main styleshift-split-divider ${axis === "x" ? "vertical" : "horizontal"}`;
		void applyThemeToElement(el);
		document.body.append(el);
		elements[axis] = el;
	}
	return el;
}

function placeDivider(el: HTMLElement, divider: SplitDivider) {
	const length = `${divider.end - divider.start}px`;
	if (divider.axis === "x") {
		el.style.left = `${divider.position}px`;
		el.style.top = `${divider.start}px`;
		el.style.height = length;
	} else {
		el.style.top = `${divider.position}px`;
		el.style.left = `${divider.start}px`;
		el.style.width = length;
	}
}

export function showSplitDividers(dividers: SplitDivider[], onDragStart: DragStartHandler) {
	for (const axis of ["x", "y"] as const) {
		const divider = dividers.find((item) => item.axis === axis);
		const el = elements[axis];
		if (!divider) {
			el?.classList.remove("visible");
			continue;
		}

		const dividerEl = getDividerElement(axis);
		dividerEl.onmousedown = (e) => onDragStart(axis, e);
		placeDivider(dividerEl, divider);
		dividerEl.classList.add("visible");
	}
}
