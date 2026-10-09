import { expect, test } from "bun:test";
import { resolveCelebrationOptions } from "../../../src/ui/tutorial/tour/celebrationOptions";

test("celebration options fall back to the cannon tutorial-end copy", () => {
	expect(resolveCelebrationOptions()).toEqual({
		accent: "#8b7cf6",
		title: "You're all set!",
		message: "Have fun making YouTube yours.",
		yayLabel: "Yay!",
		mode: "cannons",
	});
});

test("celebration options accept a full Yay override", () => {
	expect(resolveCelebrationOptions({ title: "Yay!", message: "Yay!", yayLabel: "Yay!" })).toEqual({
		accent: "#8b7cf6",
		title: "Yay!",
		message: "Yay!",
		yayLabel: "Yay!",
		mode: "cannons",
	});
});

test("celebration options merge partial overrides", () => {
	const text = resolveCelebrationOptions({ accent: "#4caf50", mode: "rain" });
	expect(text.accent).toBe("#4caf50");
	expect(text.mode).toBe("rain");
	expect(text.title).toBe("You're all set!");
});
