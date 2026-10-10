// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { dangerousPatterns } from "../../../../src/core/utils/dangerousPatterns";
import { RUN_EVENT, readRunEvent, wrapRunScript } from "../../../../src/ui/shared/run/script";

test("wrapper embeds the user code and tags events with the run id", () => {
	const script = wrapRunScript("return 1 + 1;", "run-7");
	expect(script).toContain("return 1 + 1;");
	expect(script).toContain('runId: "run-7"');
	expect(script).toContain(JSON.stringify(RUN_EVENT));
	expect(script).toContain('__styleshiftSend("done", "")');
});

test("reads a log event for the same run", () => {
	const detail = JSON.stringify({ runId: "run-7", kind: "log", text: "hello" });
	expect(readRunEvent(detail, "run-7")).toEqual({ kind: "log", text: "hello" });
});

test("reads a done event with empty text", () => {
	const detail = JSON.stringify({ runId: "run-7", kind: "done", text: "" });
	expect(readRunEvent(detail, "run-7")).toEqual({ kind: "done", text: "" });
});

test("the run wrapper trips none of the script safety patterns", () => {
	const script = wrapRunScript("log('x');", "run-7").toLowerCase();
	const tripped = dangerousPatterns.filter((pattern) => pattern.test(script));
	expect(tripped.map(String)).toEqual([]);
});

test("ignores events from other runs, unknown kinds, and bad JSON", () => {
	expect(readRunEvent(JSON.stringify({ runId: "other", kind: "log", text: "x" }), "run-7")).toBe(null);
	expect(readRunEvent(JSON.stringify({ runId: "run-7", kind: "eval", text: "x" }), "run-7")).toBe(null);
	expect(readRunEvent("not json", "run-7")).toBe(null);
});
