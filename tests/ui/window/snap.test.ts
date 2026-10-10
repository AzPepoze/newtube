// @ts-nocheck
import { expect, test } from "bun:test";
import { getSnapRect, getSnapZone } from "@ui/window/snap";

const VIEW_WIDTH = 1600;
const VIEW_HEIGHT = 900;

test("left and right edges snap to halves", () => {
	expect(getSnapZone(5, 450, VIEW_WIDTH, VIEW_HEIGHT)).toBe("left");
	expect(getSnapZone(VIEW_WIDTH - 5, 450, VIEW_WIDTH, VIEW_HEIGHT)).toBe("right");
});

test("corners snap to quarters", () => {
	expect(getSnapZone(5, 10, VIEW_WIDTH, VIEW_HEIGHT)).toBe("top-left");
	expect(getSnapZone(VIEW_WIDTH - 5, 10, VIEW_WIDTH, VIEW_HEIGHT)).toBe("top-right");
	expect(getSnapZone(5, VIEW_HEIGHT - 10, VIEW_WIDTH, VIEW_HEIGHT)).toBe("bottom-left");
	expect(getSnapZone(VIEW_WIDTH - 5, VIEW_HEIGHT - 10, VIEW_WIDTH, VIEW_HEIGHT)).toBe("bottom-right");
});

test("every corner is a 64px square, same as the resize handle", () => {
	for (const [x, y, zone] of [
		[63, 63, "top-left"],
		[VIEW_WIDTH - 63, 63, "top-right"],
		[63, VIEW_HEIGHT - 63, "bottom-left"],
		[VIEW_WIDTH - 63, VIEW_HEIGHT - 63, "bottom-right"],
	]) {
		expect(getSnapZone(x, y, VIEW_WIDTH, VIEW_HEIGHT)).toBe(zone);
	}
	expect(getSnapZone(70, 70, VIEW_WIDTH, VIEW_HEIGHT)).toBeNull();
});

test("the left and right edges stop at the corner squares", () => {
	expect(getSnapZone(5, 100, VIEW_WIDTH, VIEW_HEIGHT)).toBe("left");
	expect(getSnapZone(5, 30, VIEW_WIDTH, VIEW_HEIGHT)).toBe("top-left");
});

test("top edge in the middle maximizes", () => {
	expect(getSnapZone(800, 5, VIEW_WIDTH, VIEW_HEIGHT)).toBe("maximize");
});

test("the middle of the screen and the bottom edge do not snap", () => {
	expect(getSnapZone(800, 450, VIEW_WIDTH, VIEW_HEIGHT)).toBeNull();
	expect(getSnapZone(800, VIEW_HEIGHT - 5, VIEW_WIDTH, VIEW_HEIGHT)).toBeNull();
});

test("left half covers the full height on the left", () => {
	expect(getSnapRect("left", VIEW_WIDTH, VIEW_HEIGHT)).toEqual({
		left: 0,
		top: 0,
		width: 800,
		height: 900,
	});
});

test("bottom-right quarter starts at the centre", () => {
	expect(getSnapRect("bottom-right", VIEW_WIDTH, VIEW_HEIGHT)).toEqual({
		left: 800,
		top: 450,
		width: 800,
		height: 450,
	});
});

test("maximize rect fills the viewport", () => {
	expect(getSnapRect("maximize", VIEW_WIDTH, VIEW_HEIGHT)).toEqual({
		left: 0,
		top: 0,
		width: 1600,
		height: 900,
	});
});
