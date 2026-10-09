import { expect, test } from "bun:test";
import { PANEL_CATEGORY, TUTORIAL_STEPS, hasSpotlight, requiresSettingsPanel } from "../../../src/ui/tutorial/tutorialSteps";

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
	const tail = firstOptional === -1 ? [] : tiers.slice(firstOptional);
	expect(tail.every((tier) => tier === "optional")).toBe(true);
});

test("spotlight is data-driven: hasSpotlight() gates on fields, never step ids", () => {
	for (const step of TUTORIAL_STEPS) {
		expect(hasSpotlight(step)).toBe(step.spotlight !== false && step.targetSelector !== undefined);
		if (hasSpotlight(step)) {
			expect(typeof step.targetSelector).toBe("string");
			expect(step.targetSelector?.length).toBeGreaterThan(0);
		}
		if (step.spotlight === false) {
			expect(hasSpotlight(step)).toBe(false);
		}
	}
});

test("steps without a target must explicitly opt out of the spotlight", () => {
	for (const step of TUTORIAL_STEPS) {
		if (step.targetSelector === undefined) {
			expect(step.spotlight).toBe(false);
			expect(hasSpotlight(step)).toBe(false);
		}
	}
});

test("every step provides an actionable flow (show, try, or panel auto-open)", () => {
	for (const step of TUTORIAL_STEPS) {
		const hasAction = Boolean(step.show || step.try || step.panelCategory);
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
	}
});

test("try actions strictly match supported interactive flows", () => {
	const supportedTryActions = new Set(["quickCustomize", "customize", "themeManager"]);
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

test("themes step navigates to the panel button instead of opening the manager", () => {
	const themesStep = TUTORIAL_STEPS.find((s) => s.id === "themes-store");
	expect(themesStep?.show?.panelCategory).toBe(PANEL_CATEGORY.quickPalette);
	expect(themesStep?.show?.themeTab).toBeUndefined();
	expect(themesStep?.secondaryShow).toBeUndefined();
	expect(themesStep?.targetSelector).toBe("#OpenThemeManagerButton");
});

test("themes step offers both show navigation and theme manager trial", () => {
	const themesStep = TUTORIAL_STEPS.find((s) => s.id === "themes-store");
	expect(themesStep?.show?.panelCategory).toBe(PANEL_CATEGORY.quickPalette);
	expect(themesStep?.try).toBe("themeManager");
});

test("only panel-anchored steps require the settings panel", () => {
	const required = new Set(TUTORIAL_STEPS.filter((step) => requiresSettingsPanel(step)).map((step) => step.id));
	expect(required.has("open-panel")).toBe(false);
	const panelStepIds = [
		"meet-panel",
		"panel-sidebar",
		"panel-content",
		"panel-search",
		"quick-customize",
		"customize-element",
		"themes-store",
		"save-export",
		"developer-mode",
		"keyboard-shortcuts",
	];
	for (const id of panelStepIds) {
		expect(required.has(id)).toBe(true);
	}
});

test("orientation steps tour the panel right after opening it", () => {
	const ids = TUTORIAL_STEPS.map((step) => step.id);
	expect(ids.slice(0, 10)).toEqual([
		"open-panel",
		"meet-panel",
		"panel-sidebar",
		"panel-content",
		"panel-search",
		"keyboard-shortcuts",
		"themes-store",
		"customize-element",
		"quick-customize",
		"dev-bridge",
	]);
});

test("use-existing comes before create-new, dev block follows both", () => {
	const ids = TUTORIAL_STEPS.map((step) => step.id);
	expect(ids.slice(7, 14)).toEqual([
		"customize-element",
		"quick-customize",
		"dev-bridge",
		"developer-mode",
		"dev-add-category",
		"dev-add-setting",
		"dev-code-zip",
	]);
});

test("dev block is core and the code step opens the docs", () => {
	for (const id of ["dev-bridge", "developer-mode", "dev-add-category", "dev-add-setting", "dev-code-zip"]) {
		expect(TUTORIAL_STEPS.find((step) => step.id === id)?.tier).toBe("core");
	}
	expect(TUTORIAL_STEPS.find((step) => step.id === "dev-code-zip")?.show?.docs).toBe(true);
});

test("dev steps target specific controls instead of whole category frames", () => {
	const byId = new Map(TUTORIAL_STEPS.map((step) => [step.id, step]));
	expect(byId.get("developer-mode")?.targetSelector).toBe("#developerMode");
	expect(byId.get("dev-add-category")?.targetSelector).toBe(".styleshift-add-category-button");
	expect(byId.get("dev-add-setting")?.targetSelector).toBe(".styleshift-add-setting-button-wrapper");
	expect(byId.get("dev-code-zip")?.targetSelector).toBe("#ExportDataButton");
	expect(byId.get("save-export")?.targetSelector).toBe("#ImportDataButton");
});

test("dev creation steps expose a show action so the go-to button renders", () => {
	const byId = new Map(TUTORIAL_STEPS.map((step) => [step.id, step]));
	for (const id of ["dev-add-category", "dev-add-setting"]) {
		const step = byId.get(id);
		expect(step?.show?.panelCategory).toBe(PANEL_CATEGORY.quickPalette);
		expect(step?.actionLabel?.length).toBeGreaterThan(0);
	}
});

test("choice branches carry labels and resolve to a later step", () => {
	const ids = TUTORIAL_STEPS.map((step) => step.id);
	for (const step of TUTORIAL_STEPS) {
		if (!step.choice) continue;
		expect(step.choice.acceptLabel.length).toBeGreaterThan(0);
		expect(step.choice.declineLabel.length).toBeGreaterThan(0);
		if (step.choice.declineToId !== undefined) {
			const from = ids.indexOf(step.id);
			const to = ids.indexOf(step.choice.declineToId);
			expect(to).toBeGreaterThan(from);
		}
	}
});

test("dev bridge asks about dev mode and ends the tutorial when declined", () => {
	const bridge = TUTORIAL_STEPS.find((step) => step.id === "dev-bridge");
	expect(bridge?.title).toBe("Want to explore Developer Mode?");
	expect(bridge?.spotlight).toBe(false);
	expect(bridge ? hasSpotlight(bridge) : true).toBe(false);
	expect(bridge?.choice?.acceptLabel).toBe("We need to go deeper!");
	expect(bridge?.choice?.declineLabel).toBe("I'm fine");
	expect(bridge?.choice?.declineToId).toBeUndefined();
});

test("requiresSettingsPanel matches panel category or panel show target", () => {
	const base = { id: "x", tier: "core", title: "t", accent: "#ffffff", body: "b", bullets: [] };
	expect(requiresSettingsPanel({ ...base })).toBe(false);
	expect(requiresSettingsPanel({ ...base, show: {} })).toBe(false);
	expect(requiresSettingsPanel({ ...base, panelCategory: PANEL_CATEGORY.quickPalette })).toBe(true);
	expect(requiresSettingsPanel({ ...base, show: { panelCategory: PANEL_CATEGORY.quickPalette } })).toBe(true);
});
