// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { activeSectionValue, scrollToSection } from "./scrollSpy";

function section(value: string, top: number, bottom: number) {
	return {
		getAttribute: (name: string) => (name === "data-group" ? value : null),
		getBoundingClientRect: () => ({ top, bottom }),
	};
}

function container(sections: unknown[], target: unknown = null) {
	return {
		getBoundingClientRect: () => ({ top: 0 }),
		querySelectorAll: () => sections,
		querySelector: () => target,
	};
}

test("returns the section crossing the offset line", () => {
	const sections = [section("a", -200, -50), section("b", 20, 200), section("c", 300, 500)];
	expect(activeSectionValue(container(sections), "data-group", 100)).toBe("b");
});

test("returns null when no section crosses the line", () => {
	const sections = [section("a", -200, -50), section("c", 300, 500)];
	expect(activeSectionValue(container(sections), "data-group", 100)).toBeNull();
});

test("scrollToSection scrolls the found target", () => {
	let scrolled = false;
	const target = { scrollIntoView: () => (scrolled = true) };
	expect(scrollToSection(container([], target), "data-group", "b")).toBe(true);
	expect(scrolled).toBe(true);
});

test("scrollToSection returns false when the target is missing", () => {
	expect(scrollToSection(container([], null), "data-group", "missing")).toBe(false);
	expect(scrollToSection(null, "data-group", "missing")).toBe(false);
});
