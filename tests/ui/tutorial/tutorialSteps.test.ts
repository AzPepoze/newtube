// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { TUTORIAL_STEPS } from "../../../src/ui/tutorial/tutorialSteps";

test("every step has a unique id", () => {
	const ids = TUTORIAL_STEPS.map((step) => step.id);
	expect(new Set(ids).size).toBe(ids.length);
});

test("every step has a hex accent color", () => {
	for (const step of TUTORIAL_STEPS) {
		expect(step.accent).toMatch(/^#[0-9a-f]{6}$/i);
	}
});

test("every step plays at least one beat", () => {
	for (const step of TUTORIAL_STEPS) {
		expect(step.beats).toBeGreaterThanOrEqual(1);
	}
});

test("core steps come before optional steps", () => {
	const tiers = TUTORIAL_STEPS.map((step) => step.tier);
	const firstOptional = tiers.indexOf("optional");
	expect(tiers.slice(firstOptional).every((tier) => tier === "optional")).toBe(true);
});
