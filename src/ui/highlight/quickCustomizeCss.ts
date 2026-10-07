import type { QuickControl } from "@ui/highlight/quickCustomizeControls";

export function valueForControl(control: QuickControl, raw: string): string {
	if (control.part) return control.part(raw);
	if (control.toCss) return control.toCss(raw);
	if (control.type === "numberSlide" && control.unit) return `${raw}${control.unit}`;
	return raw;
}

export function buildBasicCss(
	selector: string,
	styles: Record<string, string>,
	enabled: Record<string, boolean>,
	controls: QuickControl[],
): string {
	const fragments = new Map<string, string[]>();

	for (const control of controls) {
		if (!enabled[control.id]) continue;

		const raw = String(styles[control.id] ?? control.defaultValue);
		if (control.type === "textInput" && raw.trim() === "") continue;

		const value = valueForControl(control, raw);
		if (!value) continue;

		const property = control.cssProperty ?? control.id;
		const parts = fragments.get(property) ?? [];
		parts.push(value);
		fragments.set(property, parts);
	}

	if (fragments.size === 0) return `${selector} {\n}`;

	const lines = [...fragments.entries()].map(([property, parts]) => `  ${property}: ${parts.join(" ")} !important;`);
	return `${selector} {\n${lines.join("\n")}\n}`;
}
