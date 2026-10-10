// @ts-nocheck
import { describe, expect, test } from "bun:test";
import { moveSetting, settingBlockAt } from "../../../src/ui/settings/settingMove";

const row = (id: string) => ({ id, type: "checkbox" });
const group = (id: string) => ({ id, type: "group" });
const ids = (settings: { id: string }[]) => settings.map((s) => s.id);

describe("settingBlockAt", () => {
	test("returns just the setting for a normal row", () => {
		const settings = [row("a"), row("b")];
		expect(ids(settingBlockAt(settings, settings[0]))).toEqual(["a"]);
	});

	test("includes the rows below a group, up to the next group", () => {
		const settings = [group("g"), row("a"), row("b"), group("h"), row("c")];
		expect(ids(settingBlockAt(settings, settings[0]))).toEqual(["g", "a", "b"]);
	});

	test("returns nothing for a setting that is not in the list", () => {
		expect(settingBlockAt([row("a")], row("x"))).toEqual([]);
	});
});

describe("moveSetting", () => {
	test("moves a setting into an empty category at the bottom", () => {
		const source = [row("a"), row("b")];
		const target = [];
		expect(moveSetting(source, target, source[0], null, true)).toBe(true);
		expect(ids(source)).toEqual(["b"]);
		expect(ids(target)).toEqual(["a"]);
	});

	test("moves a setting into an empty category at the top", () => {
		const source = [row("a"), row("b")];
		const target = [];
		expect(moveSetting(source, target, source[1], null, false)).toBe(true);
		expect(ids(source)).toEqual(["a"]);
		expect(ids(target)).toEqual(["b"]);
	});

	test("puts the setting after an anchor in another category", () => {
		const source = [row("a"), row("b")];
		const target = [row("x"), row("y")];
		expect(moveSetting(source, target, source[0], target[0], true)).toBe(true);
		expect(ids(target)).toEqual(["x", "a", "y"]);
		expect(ids(source)).toEqual(["b"]);
	});

	test("puts the setting before an anchor in another category", () => {
		const source = [row("a")];
		const target = [row("x"), row("y")];
		expect(moveSetting(source, target, source[0], target[1], false)).toBe(true);
		expect(ids(target)).toEqual(["x", "a", "y"]);
	});

	test("moves a group together with the rows below it", () => {
		const source = [group("g"), row("a"), row("b")];
		const target = [];
		expect(moveSetting(source, target, source[0], null, true)).toBe(true);
		expect(ids(source)).toEqual([]);
		expect(ids(target)).toEqual(["g", "a", "b"]);
	});

	test("changes nothing when the anchor is not in the target", () => {
		const source = [row("a"), row("b")];
		const target = [row("x")];
		expect(moveSetting(source, target, source[0], row("missing"), true)).toBe(false);
		expect(ids(source)).toEqual(["a", "b"]);
		expect(ids(target)).toEqual(["x"]);
	});

	test("changes nothing when the anchor is inside the moved group", () => {
		const source = [group("g"), row("a")];
		expect(moveSetting(source, [], source[0], source[1], true)).toBe(false);
		expect(ids(source)).toEqual(["g", "a"]);
	});

	test("reorders inside one category without losing or duplicating settings", () => {
		const list = [row("a"), row("b"), row("c")];
		expect(moveSetting(list, list, list[0], list[2], true)).toBe(true);
		expect(ids(list)).toEqual(["b", "c", "a"]);
	});
});
