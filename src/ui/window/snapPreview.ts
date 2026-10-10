import { applyThemeToElement } from "@ui/themes/theme";
import type { WindowRect } from "./snap";

let previewEl: HTMLElement | null = null;

/**
 * The preview lives on the body, outside the window, because the window's transform would break fixed positioning.
 */
function getPreviewElement(): HTMLElement {
	if (!previewEl) {
		previewEl = document.createElement("div");
		previewEl.className = "styleshift-main styleshift-snap-preview";
		void applyThemeToElement(previewEl);
		document.body.append(previewEl);
	}
	return previewEl;
}

export function showSnapPreview(rect: WindowRect) {
	const el = getPreviewElement();
	el.style.left = `${rect.left}px`;
	el.style.top = `${rect.top}px`;
	el.style.width = `${rect.width}px`;
	el.style.height = `${rect.height}px`;
	el.classList.add("visible");
}

export function hideSnapPreview() {
	previewEl?.classList.remove("visible");
}
