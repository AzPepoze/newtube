// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { findCategoryIndex, reorderCategory, shiftCategory } from "../../../src/settings/registry/category";

const make = (...names: string[]) => names.map((name) => ({ category: name, settings: [] }));
const labels = (categories: { category: string }[]) => categories.map((item) => item.category);

describe("reorderCategory", () => {
	test("moves a category before the target", () => {
		const list = make("a", "b", "c");
		expect(reorderCategory(list, list[2], list[0], false)).toBe(true);
		expect(labels(list)).toEqual(["c", "a", "b"]);
	});

	test("moves a category after the target", () => {
		const list = make("a", "b", "c");
		expect(reorderCategory(list, list[0], list[1], true)).toBe(true);
		expect(labels(list)).toEqual(["b", "a", "c"]);
	});

	test("reports no change when dropped onto its own slot", () => {
		const list = make("a", "b", "c");
		expect(reorderCategory(list, list[1], list[0], true)).toBe(false);
		expect(labels(list)).toEqual(["a", "b", "c"]);
	});

	test("uses the stored object, not a copy with the same label", () => {
		const list = make("a", "b");
		const stored = list[1];
		const copy = { category: "b", settings: [] };
		expect(reorderCategory(list, copy, list[0], false)).toBe(true);
		expect(labels(list)).toEqual(["b", "a"]);
		expect(list[0]).toBe(stored);
	});

	test("restores the list when the target is missing", () => {
		const list = make("a", "b");
		expect(reorderCategory(list, list[0], { category: "missing", settings: [] }, false)).toBe(false);
		expect(labels(list)).toEqual(["a", "b"]);
	});
});

describe("shiftCategory", () => {
	test("swaps with the neighbour above or below", () => {
		const list = make("a", "b", "c");
		expect(shiftCategory(list, list[1], "up")).toBe(true);
		expect(labels(list)).toEqual(["b", "a", "c"]);
		expect(shiftCategory(list, list[0], "down")).toBe(true);
		expect(labels(list)).toEqual(["a", "b", "c"]);
	});

	test("does nothing at the edges", () => {
		const list = make("a", "b");
		expect(shiftCategory(list, list[0], "up")).toBe(false);
		expect(shiftCategory(list, list[1], "down")).toBe(false);
		expect(labels(list)).toEqual(["a", "b"]);
	});

	test("does nothing for an unknown category", () => {
		const list = make("a", "b");
		expect(shiftCategory(list, { category: "x", settings: [] }, "up")).toBe(false);
	});
});

describe("findCategoryIndex", () => {
	test("matches by label", () => {
		const list = make("a", "b");
		expect(findCategoryIndex(list, { category: "b", settings: [] })).toBe(1);
		expect(findCategoryIndex(list, { category: "z", settings: [] })).toBe(-1);
	});
});
