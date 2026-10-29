import type { LayoutNode } from "../types";

/** Short label such as `<div>#masthead.style-scope`. */
export function describeNode(node: LayoutNode): string {
	const parts = [`<${node.tag}>`];
	if (node.id) parts.push(`#${node.id}`);
	if (node.classes?.length) parts.push(`.${node.classes.join(".")}`);
	return parts.join("");
}
