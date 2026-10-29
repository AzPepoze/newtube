import type { LayoutNode } from "../types";

function matchesQuery(node: LayoutNode, query: string): boolean {
	const fields = [node.tag, node.id, node.role, node.ariaLabel, ...(node.classes ?? [])];
	return fields.some((field) => field?.toLowerCase().includes(query));
}

/** Keeps a node when it or any descendant matches the query. Returns null when nothing matches. */
export function filterLayoutNode(node: LayoutNode, query: string): LayoutNode | null {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return node;

	const children = (node.children ?? [])
		.map((child) => filterLayoutNode(child, normalized))
		.filter((child): child is LayoutNode => child !== null);
	if (!matchesQuery(node, normalized) && children.length === 0) return null;

	return { ...node, children };
}
