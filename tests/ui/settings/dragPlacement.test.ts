// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { autoScrollDelta, pickNearest } from "../../../src/ui/settings/dragPlacement";

const rowAt = (top: number, value: string) => ({ box: { left: 0, top, width: 200, height: 40 }, value });

describe("pickNearest", () => {
	test("returns null without candidates", () => {
		expect(pickNearest({ x: 0, y: 0 }, [])).toBeNull();
	});

	test("picks the row whose centre is closest vertically", () => {
		const rows = [rowAt(0, "a"), rowAt(50, "b"), rowAt(100, "c")];
		expect(pickNearest({ x: 100, y: 60 }, rows)?.value).toBe("b");
	});

	test("drops after the row when the pointer is below its centre", () => {
		const rows = [rowAt(0, "a")];
		expect(pickNearest({ x: 100, y: 30 }, rows)?.isAfter).toBe(true);
		expect(pickNearest({ x: 100, y: 10 }, rows)?.isAfter).toBe(false);
	});

	test("prefers a neighbour at the same height over a row further up", () => {
		const candidates = [
			{ box: { left: 0, top: 0, width: 100, height: 40 }, value: "above" },
			{ box: { left: 100, top: 30, width: 100, height: 40 }, value: "same-row" },
		];
		expect(pickNearest({ x: 50, y: 50 }, candidates)?.value).toBe("same-row");
	});
});

describe("autoScrollDelta", () => {
	const rect = { top: 100, bottom: 500 };

	test("does nothing away from the edges", () => {
		expect(autoScrollDelta(300, rect)).toBe(0);
	});

	test("scrolls up near the top edge and down near the bottom edge", () => {
		expect(autoScrollDelta(110, rect)).toBeLessThan(0);
		expect(autoScrollDelta(490, rect)).toBeGreaterThan(0);
	});

	test("caps the step size", () => {
		expect(Math.abs(autoScrollDelta(-1000, rect))).toBeLessThanOrEqual(12);
	});
});
