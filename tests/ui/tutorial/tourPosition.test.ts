import { expect, test } from "bun:test";
import {
	cardPlacementFor,
	centeredStyle,
	fallbackCardPlacement,
	isTargetOnTop,
	spotlightStyleFor,
	TRIAL_DOCK_STYLE,
	windowSidePlacement,
} from "../../../src/ui/tutorial/tour/tourPosition";

const VIEWPORT = { width: 1280, height: 800 };
const CARD = { width: 380, height: 260 };

test("on-top check rejects empty rects and passes through without hit-testing", () => {
	const empty = {
		getBoundingClientRect: () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }),
	};
	expect(isTargetOnTop(empty)).toBe(false);
	const button = {
		getBoundingClientRect: () => ({ top: 10, right: 50, bottom: 50, left: 10, width: 40, height: 40 }),
	};
	expect(isTargetOnTop(button)).toBe(true);
});

test("missing target docks when the theme manager is open, centers otherwise", () => {
	expect(fallbackCardPlacement(VIEWPORT, CARD, true)).toBe(TRIAL_DOCK_STYLE);
	expect(fallbackCardPlacement(VIEWPORT, CARD, false)).toBe(centeredStyle(VIEWPORT, CARD));
});

test("missing target with an open window parks beside it instead of covering it", () => {
	const windowRect = { top: 100, right: 600, bottom: 700, left: 100, width: 500, height: 600 };
	expect(windowSidePlacement(windowRect, CARD, VIEWPORT)).toBe("top: 270px; left: 614px; right: auto;");
	expect(fallbackCardPlacement(VIEWPORT, CARD, false, windowRect)).toBe("top: 270px; left: 614px; right: auto;");
});

test("missing target with a right-edge window parks on its left", () => {
	const windowRect = { top: 100, right: 1260, bottom: 700, left: 780, width: 480, height: 600 };
	expect(windowSidePlacement(windowRect, CARD, VIEWPORT)).toBe("top: 270px; right: 514px; left: auto;");
});

test("missing target with a fullscreen window docks to a corner", () => {
	const windowRect = { top: 0, right: 1280, bottom: 800, left: 0, width: 1280, height: 800 };
	expect(windowSidePlacement(windowRect, CARD, VIEWPORT)).toBe(TRIAL_DOCK_STYLE);
});

test("spotlight draws a circle for compact buttons", () => {
	const style = spotlightStyleFor({ top: 10, right: 50, bottom: 50, left: 10, width: 40, height: 40 });
	expect(style).toBe("top: 2px; left: 2px; width: 56px; height: 56px; border-radius: 50%;");
});

test("spotlight draws a wide pill for horizontal sections", () => {
	const style = spotlightStyleFor({ top: 100, right: 400, bottom: 140, left: 100, width: 300, height: 40 });
	expect(style).toBe("top: 94px; left: 94px; width: 312px; height: 52px; border-radius: 16px;");
});

test("spotlight draws a rounded rect for cards", () => {
	const style = spotlightStyleFor({ top: 100, right: 300, bottom: 200, left: 100, width: 200, height: 100 });
	expect(style).toBe("top: 92px; left: 92px; width: 216px; height: 116px; border-radius: 18px;");
});

test("trial mode docks to the bottom-right corner", () => {
	const style = cardPlacementFor({ target: null, card: CARD, viewport: VIEWPORT, trialMode: true, windowRect: null });
	expect(style).toBe("bottom: 24px; right: 24px; top: auto; left: auto;");
});

test("missing target centers the card", () => {
	const style = cardPlacementFor({ target: null, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect: null });
	expect(style).toBe(centeredStyle(VIEWPORT, CARD));
	expect(style).toBe("top: 270px; left: 450px;");
});

test("masthead target places the card below it", () => {
	const target = { top: 8, right: 1260, bottom: 48, left: 1220, width: 40, height: 40 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect: null });
	expect(style).toBe("top: 62px; right: 20px; left: auto;");
});

test("generic target with right space places the card to the right", () => {
	const target = { top: 100, right: 500, bottom: 140, left: 300, width: 200, height: 40 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect: null });
	expect(style).toBe("top: 16px; left: 514px; right: auto;");
});

test("generic target without right space places the card below", () => {
	const target = { top: 100, right: 1260, bottom: 140, left: 1100, width: 160, height: 40 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect: null });
	expect(style).toBe("top: 154px; left: 884px; right: auto;");
});

test("window target with right room sits beside the window", () => {
	const target = { top: 200, right: 400, bottom: 240, left: 200, width: 200, height: 40 };
	const windowRect = { top: 100, right: 600, bottom: 700, left: 100, width: 500, height: 600 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect });
	expect(style).toBe("top: 90px; left: 614px; right: auto;");
});

test("window target with only left room sits on the left", () => {
	const target = { top: 200, right: 1150, bottom: 240, left: 950, width: 200, height: 40 };
	const windowRect = { top: 100, right: 1260, bottom: 700, left: 780, width: 480, height: 600 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect });
	expect(style).toBe("top: 90px; right: 514px; left: auto;");
});

test("cramped window target docks to a corner", () => {
	const target = { top: 700, right: 1260, bottom: 740, left: 1100, width: 160, height: 40 };
	const windowRect = { top: 0, right: 1280, bottom: 800, left: 0, width: 1280, height: 800 };
	const style = cardPlacementFor({ target, card: CARD, viewport: VIEWPORT, trialMode: false, windowRect });
	expect(style).toBe("bottom: 24px; left: 24px; top: auto; right: auto;");
});
