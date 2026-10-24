import type { LayoutNode } from "../types";

export interface PreviewBox {
	node: LayoutNode;
	depth: number;
	left: number;
	top: number;
	width: number;
	height: number;
}

/** Scale that makes `bounds.width` fit `containerWidth`. Falls back to 1 for empty sizes. */
export function fitScale(bounds: { width: number }, containerWidth: number): number {
	if (bounds.width <= 0 || containerWidth <= 0) return 1;
	return containerWidth / bounds.width;
}

/** True when at least one node in the tree carries a rect (report version 3 or later). */
export function hasLayoutGeometry(node: LayoutNode | null | undefined): boolean {
	if (!node) return false;
	if (node.rect) return true;
	return (node.children ?? []).some(hasLayoutGeometry);
}

/** Positions every node with a rect, relative to the root's top-left corner and scaled. Parents come before children. */
export function flattenBoxes(root: LayoutNode, scale: number): PreviewBox[] {
	if (!root.rect) return [];
	const origin = root.rect;
	const boxes: PreviewBox[] = [];

	function visit(node: LayoutNode, depth: number): void {
		if (node.rect) {
			boxes.push({
				node,
				depth,
				left: (node.rect.x - origin.x) * scale,
				top: (node.rect.y - origin.y) * scale,
				width: node.rect.width * scale,
				height: node.rect.height * scale,
			});
		}
		for (const child of node.children ?? []) visit(child, depth + 1);
	}

	visit(root, 0);
	return boxes;
}
