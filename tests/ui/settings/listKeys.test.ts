// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { categoryKey, settingKeys } from "../../../src/ui/settings/listKeys";

describe("settingKeys", () => {
	test("keys stay the same when settings are reordered", () => {
		const a = { type: "checkbox", id: "a", name: "A" };
		const b = { type: "checkbox", id: "b", name: "B" };
		const before = settingKeys([a, b]);
		const after = settingKeys([b, a]);
		expect(after[0]).toBe(before[1]);
		expect(after[1]).toBe(before[0]);
	});

	test("duplicate settings still get unique keys", () => {
		const same = { type: "button", name: "Go" };
		const keys = settingKeys([same, { ...same }]);
		expect(new Set(keys).size).toBe(2);
	});
});

describe("categoryKey", () => {
	test("headers and categories never share a key", () => {
		expect(categoryKey({ isHeader: true, label: "ADD-ON" })).not.toBe(
			categoryKey({ category: "ADD-ON", settings: [] }),
		);
	});

	test("the same category label gives the same key", () => {
		expect(categoryKey({ category: "Thumbnail", settings: [] })).toBe(
			categoryKey({ category: "Thumbnail", settings: [1] }),
		);
	});
});
