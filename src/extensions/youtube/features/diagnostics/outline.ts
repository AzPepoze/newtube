import type { LayoutNode, LayoutOutline } from "./types";

/** Curated NewTube-relevant regions to outline. Each maps to the first matching element. */
export const DIAGNOSTIC_REGION_SELECTORS: Record<string, string> = {
	masthead: "#masthead-container",
	player: "ytd-player, #movie_player",
	watchMetadata: "ytd-watch-metadata",
	feed: "ytd-rich-grid-renderer, ytd-video-renderer",
	guide: "ytd-guide-renderer, ytd-mini-guide-renderer",
	shorts: "ytd-shorts, ytd-reel-video-renderer",
};

export const LAYOUT_OUTLINE_DEPTH_LIMIT = 6;
export const LAYOUT_OUTLINE_NODE_LIMIT = 500;

/** Tag contents we never want to read; even their tag names are dropped from the outline. */
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "LINK", "META"]);

interface OutlineBudget {
	nodeCount: number;
	droppedNodes: number;
	truncated: boolean;
}

function readElementClasses(element: any): string[] | undefined {
	const raw = typeof element.className === "string" ? element.className : element.className?.baseVal;
	if (!raw) return undefined;
	const classes = String(raw).split(/\s+/).filter(Boolean);
	return classes.length ? classes : undefined;
}

function readSafeAttribute(element: any, name: string): string | undefined {
	const value = typeof element.getAttribute === "function" ? element.getAttribute(name) : undefined;
	return value ? String(value) : undefined;
}

function countDescendantElements(element: any): number {
	const children = element.children ?? [];
	let count = 0;
	for (const child of children) count += 1 + countDescendantElements(child);
	return count;
}

/**
 * Serializes one element and its descendants using structure only: tag, id, classes,
 * role and aria-label. Text nodes, script/style contents and URL-bearing attributes
 * (`href`, `src`, …) are never read, so nothing sensitive can end up in the report.
 */
export function outlineElement(element: any, depth: number, budget: OutlineBudget): LayoutNode | null {
	const tag = String(element?.tagName ?? "").toLowerCase();
	if (!tag || SKIPPED_TAGS.has(tag.toUpperCase())) return null;

	budget.nodeCount += 1;

	const node: LayoutNode = { tag };
	const id = element.id ? String(element.id) : undefined;
	if (id) node.id = id;
	const classes = readElementClasses(element);
	if (classes) node.classes = classes;
	const role = readSafeAttribute(element, "role");
	if (role) node.role = role;
	const ariaLabel = readSafeAttribute(element, "aria-label");
	if (ariaLabel) node.ariaLabel = ariaLabel;

	const children: LayoutNode[] = [];
	const childList = element.children ?? [];
	for (const child of childList) {
		if (depth + 1 > LAYOUT_OUTLINE_DEPTH_LIMIT) {
			budget.truncated = true;
			budget.droppedNodes += countDescendantElements(child);
			continue;
		}
		if (budget.nodeCount >= LAYOUT_OUTLINE_NODE_LIMIT) {
			budget.truncated = true;
			budget.droppedNodes += 1 + countDescendantElements(child);
			continue;
		}
		const outlined = outlineElement(child, depth + 1, budget);
		if (outlined) children.push(outlined);
	}
	if (children.length) node.children = children;

	return node;
}

export function buildLayoutOutline(
	root: ParentNode,
	regionSelectors: Record<string, string> = DIAGNOSTIC_REGION_SELECTORS,
): LayoutOutline {
	const budget: OutlineBudget = { nodeCount: 0, droppedNodes: 0, truncated: false };
	const regions: Record<string, LayoutNode | null> = {};

	for (const [name, selector] of Object.entries(regionSelectors)) {
		let match: Element | null = null;
		try {
			match = root.querySelector(selector);
		} catch {
			match = null;
		}
		regions[name] = match ? outlineElement(match, 0, budget) : null;
	}

	return {
		regions,
		nodeCount: budget.nodeCount,
		depthLimit: LAYOUT_OUTLINE_DEPTH_LIMIT,
		droppedNodes: budget.droppedNodes,
		truncated: budget.truncated,
	};
}
