// @ts-nocheck
import { expect, test } from "bun:test";
import { calculatePairedBarDimension } from "../../../../../src/extensions/youtube/features/removeBlackBars/helpers";

test("accepts three matching samples on one edge and one similar sample on the opposite edge", () => {
	expect(
		calculatePairedBarDimension({ start: [20, 21, 19, "inf", "inf"], end: ["inf", "inf", 22, "inf", "inf"] }, 0),
	).toBe(20);
});

test("rejects a one-sided bar and opposite-edge samples with a different size", () => {
	expect(
		calculatePairedBarDimension({ start: [20, 21, 19, "inf", "inf"], end: ["inf", "inf", "inf", "inf", "inf"] }, 7),
	).toBe(7);
	expect(
		calculatePairedBarDimension({ start: [20, 21, 19, "inf", "inf"], end: ["inf", "inf", 35, "inf", "inf"] }, 7),
	).toBe(7);
});

test("also accepts the rule when the opposite edge has the strong evidence", () => {
	expect(
		calculatePairedBarDimension({ start: [22, "inf", "inf", "inf", "inf"], end: [20, 21, 19, "inf", "inf"] }, 0),
	).toBe(20);
});
