// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { sequencedTask } from "../../../src/core/shared/utilities";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("sequencedTask saves the newest value when calls arrive during a run", async () => {
	const saved = [];
	const save = sequencedTask(async (value) => {
		await wait(20);
		saved.push(value);
	});

	save("a");
	save("b");
	save("c");
	await wait(120);

	expect(saved.at(-1)).toBe("c");
});

test("sequencedTask runs once per call when calls do not overlap", async () => {
	const saved = [];
	const save = sequencedTask(async (value) => {
		saved.push(value);
	});

	await save("a");
	await save("b");

	expect(saved).toEqual(["a", "b"]);
});
