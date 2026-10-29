// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { fitScale, flattenBoxes, hasLayoutGeometry } from "@extensions/youtube/features/diagnostics/viewer/layoutScale";
import { filterLayoutNode } from "@extensions/youtube/features/diagnostics/viewer/layoutSearch";

test("flattenBoxes positions children relative to the root and scales them", () => {
	const root = {
		tag: "div",
		rect: { x: 100, y: 50, width: 400, height: 200 },
		children: [{ tag: "span", rect: { x: 120, y: 70, width: 100, height: 40 } }],
	};
	const boxes = flattenBoxes(root, 0.5);
	expect(boxes.map((box) => [box.node.tag, box.depth, box.left, box.top, box.width, box.height])).toEqual([
		["div", 0, 0, 0, 200, 100],
		["span", 1, 10, 10, 50, 20],
	]);
});

test("flattenBoxes returns nothing when the root has no rect", () => {
	expect(flattenBoxes({ tag: "div" }, 1)).toEqual([]);
});

test("filterLayoutNode keeps matching nodes and their ancestors", () => {
	const tree = {
		tag: "div",
		children: [
			{ tag: "span", id: "other" },
			{ tag: "section", children: [{ tag: "a", classes: ["ytd-button"] }] },
		],
	};
	expect(filterLayoutNode(tree, "ytd-button")).toEqual({
		tag: "div",
		children: [{ tag: "section", children: [{ tag: "a", classes: ["ytd-button"], children: [] }] }],
	});
	expect(filterLayoutNode(tree, "missing")).toBeNull();
	expect(filterLayoutNode(tree, "")).toBe(tree);
});

test("fitScale fits the bounds width into the container width", () => {
	expect(fitScale({ width: 1000 }, 500)).toBe(0.5);
	expect(fitScale({ width: 250 }, 500)).toBe(2);
});

test("fitScale falls back to 1 for empty sizes", () => {
	expect(fitScale({ width: 0 }, 500)).toBe(1);
	expect(fitScale({ width: 1000 }, 0)).toBe(1);
});

test("hasLayoutGeometry finds a rect in any descendant", () => {
	expect(hasLayoutGeometry(null)).toBe(false);
	expect(hasLayoutGeometry({ tag: "div" })).toBe(false);
	expect(hasLayoutGeometry({ tag: "div", rect: { x: 0, y: 0, width: 1, height: 1 } })).toBe(true);
	expect(
		hasLayoutGeometry({
			tag: "div",
			children: [{ tag: "span", children: [{ tag: "a", rect: { x: 0, y: 0, width: 1, height: 1 } }] }],
		}),
	).toBe(true);
});
