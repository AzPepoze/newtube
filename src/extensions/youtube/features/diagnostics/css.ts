import { YOUTUBE_DIAGNOSTIC_SELECTORS } from "./selectors";
import type { ComputedStyleSnapshot, CssSnapshot } from "./types";

/** The injected stylesheet id attribute used by the extension's stylesheet holder. */
const INJECTED_STYLESHEET_SELECTOR = "style[STYLESHIFT_style_sheet_id]";

/** A small, layout-relevant subset of computed properties. */
export const COMPUTED_STYLE_PROPERTIES = [
	"display",
	"position",
	"width",
	"height",
	"visibility",
	"opacity",
	"zIndex",
	"overflow",
	"flexDirection",
	"backgroundColor",
	"color",
] as const;

export function measureTextBytes(text: string): number {
	try {
		return new TextEncoder().encode(text).length;
	} catch {
		return text.length;
	}
}

/** Reads the extension's active injected CSS (the generated `<style>` text). */
export function readInjectedCss(root: ParentNode = document): string {
	return Array.from(root.querySelectorAll(INJECTED_STYLESHEET_SELECTOR))
		.map((element) => element.textContent ?? "")
		.join("\n");
}

export function countInjectedStylesheets(root: ParentNode = document): number {
	return root.querySelectorAll(INJECTED_STYLESHEET_SELECTOR).length;
}

export function snapshotComputedStyles(
	root: Document,
	selectors: readonly string[] = YOUTUBE_DIAGNOSTIC_SELECTORS,
): ComputedStyleSnapshot[] {
	return selectors.map((selector) => {
		const element = safeQuerySelector(root, selector);
		if (!element) return { selector, present: false, styles: {} };

		const computed = root.defaultView?.getComputedStyle(element);
		const styles: Record<string, string> = {};
		for (const property of COMPUTED_STYLE_PROPERTIES) {
			styles[property] = computed?.getPropertyValue(property) ?? "";
		}
		return { selector, present: true, styles };
	});
}

function safeQuerySelector(root: Document, selector: string): Element | null {
	try {
		return root.querySelector(selector);
	} catch {
		return null;
	}
}

export function buildCssSnapshot(root: Document = document): CssSnapshot {
	const injected = readInjectedCss(root);
	return {
		injected,
		injectedBytes: measureTextBytes(injected),
		stylesheetCount: countInjectedStylesheets(root),
		computed: snapshotComputedStyles(root),
	};
}
