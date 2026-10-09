import { expect, test } from "bun:test";
import { PANEL_CATEGORY, TUTORIAL_STEPS, requiresSettingsPanel } from "../../../src/ui/tutorial/tutorialSteps";

test("every step has a unique id", () => {
	const ids = TUTORIAL_STEPS.map((step) => step.id);
	expect(new Set(ids).size).toBe(ids.length);
});

test("every step has a hex accent color", () => {
	for (const step of TUTORIAL_STEPS) {
		expect(step.accent).toMatch(/^#[0-9a-f]{6}$/i);
	}
});

test("core steps come before optional steps", () => {
	const tiers = TUTORIAL_STEPS.map((step) => step.tier);
	const firstOptional = tiers.indexOf("optional");
	expect(tiers.slice(firstOptional).every((tier) => tier === "optional")).toBe(true);
});

test("every step defines an anchor target selector", () => {
	for (const step of TUTORIAL_STEPS) {
		expect(typeof step.targetSelector).toBe("string");
		expect(step.targetSelector?.length).toBeGreaterThan(0);
	}
});

test("every step provides an actionable flow (show, try, or options)", () => {
	for (const step of TUTORIAL_STEPS) {
		const hasAction = Boolean(step.show || step.try || step.options?.length);
		expect(hasAction).toBe(true);
	}
});

test("all referenced panel categories match real panel sections", () => {
	const validCategories = new Set(Object.values(PANEL_CATEGORY));
	for (const step of TUTORIAL_STEPS) {
		if (step.panelCategory) {
			expect(validCategories.has(step.panelCategory)).toBe(true);
		}
		if (step.show?.panelCategory) {
			expect(validCategories.has(step.show.panelCategory)).toBe(true);
		}
		if (step.options) {
			for (const opt of step.options) {
				expect(validCategories.has(opt.category)).toBe(true);
			}
		}
	}
});

test("try actions strictly match supported interactive flows", () => {
	const supportedTryActions = new Set(["quickCustomize", "customize"]);
	for (const step of TUTORIAL_STEPS) {
		if (step.try) {
			expect(supportedTryActions.has(step.try)).toBe(true);
		}
	}
});

test("interactive steps 2 and 3 map to quick customize and customize elements", () => {
	const quickCustStep = TUTORIAL_STEPS.find((s) => s.id === "quick-customize");
	const custElemStep = TUTORIAL_STEPS.find((s) => s.id === "customize-element");
	expect(quickCustStep?.try).toBe("quickCustomize");
	expect(custElemStep?.try).toBe("customize");
});

test("themes step configures installed and store views", () => {
	const themesStep = TUTORIAL_STEPS.find((s) => s.id === "themes-store");
	expect(themesStep?.show?.themeTab).toBe("installed");
	expect(themesStep?.secondaryShow?.themeTab).toBe("store");
});

test("only panel-anchored steps require the settings panel", () => {
	const required = new Set(TUTORIAL_STEPS.filter((step) => requiresSettingsPanel(step)).map((step) => step.id));
	expect(required.has("open-panel")).toBe(false);
	const panelStepIds = [
		"quick-customize",
		"customize-element",
		"themes-store",
		"save-export",
		"developer-mode",
		"more-options",
	];
	for (const id of panelStepIds) {
		expect(required.has(id)).toBe(true);
	}
});

test("requiresSettingsPanel matches panel category, panel show target, or shortcut options", () => {
	const base = { id: "x", tier: "core", title: "t", accent: "#ffffff", body: "b", bullets: [] };
	expect(requiresSettingsPanel({ ...base })).toBe(false);
	expect(requiresSettingsPanel({ ...base, show: {} })).toBe(false);
	expect(requiresSettingsPanel({ ...base, panelCategory: PANEL_CATEGORY.quickPalette })).toBe(true);
	expect(requiresSettingsPanel({ ...base, show: { panelCategory: PANEL_CATEGORY.quickPalette } })).toBe(true);
	expect(
		requiresSettingsPanel({
			...base,
			options: [
				{
					id: "o",
					label: "o",
					icon: "bolt",
					color: "#ffffff",
					category: PANEL_CATEGORY.quickPalette,
				},
			],
		}),
	).toBe(true);
});
