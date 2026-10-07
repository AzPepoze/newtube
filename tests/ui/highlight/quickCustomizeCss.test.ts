// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import type { QuickControl } from "@ui/highlight/quickCustomizeControls";
import { buildBasicCss, valueForControl } from "../../../src/ui/highlight/quickCustomizeCss";

const controls: QuickControl[] = [
	{ id: "background-color", label: "Background color", type: "color", defaultValue: "#ffffff" },
	{ id: "font-size", label: "Font size", type: "numberSlide", defaultValue: "14", min: 8, max: 72, unit: "px" },
	{
		id: "opacity",
		label: "Opacity",
		type: "numberSlide",
		defaultValue: "100",
		min: 0,
		max: 100,
		unit: "%",
		toCss: (value) => String(Number(value) / 100),
	},
	{
		id: "filter-blur",
		label: "Blur",
		type: "numberSlide",
		defaultValue: "0",
		min: 0,
		max: 20,
		unit: "px",
		cssProperty: "filter",
		part: (value) => `blur(${value}px)`,
	},
	{
		id: "filter-brightness",
		label: "Brightness",
		type: "numberSlide",
		defaultValue: "100",
		min: 0,
		max: 200,
		unit: "%",
		cssProperty: "filter",
		part: (value) => `brightness(${value}%)`,
	},
	{
		id: "background-image",
		label: "Background image",
		type: "textInput",
		defaultValue: "",
		toCss: (value) => `url("${value}")`,
	},
];

const noneEnabled = Object.fromEntries(controls.map((control) => [control.id, false]));
const defaults = Object.fromEntries(controls.map((control) => [control.id, control.defaultValue]));

test("emits an empty rule when nothing is enabled", () => {
	expect(buildBasicCss("#el", defaults, noneEnabled, controls)).toBe("#el {\n}");
});

test("emits only enabled declarations", () => {
	const enabled = { ...noneEnabled, "background-color": true };
	const css = buildBasicCss("#el", defaults, enabled, controls);
	expect(css).toBe("#el {\n  background-color: #ffffff !important;\n}");
});

test("appends the control unit to numberSlide values", () => {
	const enabled = { ...noneEnabled, "font-size": true };
	const css = buildBasicCss("#el", { ...defaults, "font-size": "20" }, enabled, controls);
	expect(css).toContain("font-size: 20px !important;");
});

test("joins controls that share a property into one declaration", () => {
	const enabled = { ...noneEnabled, "filter-blur": true, "filter-brightness": true };
	const css = buildBasicCss("#el", defaults, enabled, controls);
	expect(css).toContain("filter: blur(0px) brightness(100%) !important;");
	expect(css.match(/filter:/g)).toHaveLength(1);
});

test("skips empty text inputs", () => {
	const enabled = { ...noneEnabled, "background-image": true };
	const css = buildBasicCss("#el", defaults, enabled, controls);
	expect(css).toBe("#el {\n}");
});

test("valueForControl prefers part over unit and toCss", () => {
	expect(valueForControl(controls[2], "50")).toBe("0.5");
	expect(valueForControl(controls[3], "4")).toBe("blur(4px)");
	expect(valueForControl(controls[1], "18")).toBe("18px");
});
