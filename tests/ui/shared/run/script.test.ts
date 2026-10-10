// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { PLAYGROUND_EVENT, readPlaygroundEvent, wrapPlaygroundScript } from "../../../../src/ui/shared/run/script";

test("wrapper embeds the user code and tags events with the run id", () => {
	const script = wrapPlaygroundScript("return 1 + 1;", "run-7");
	expect(script).toContain("return 1 + 1;");
	expect(script).toContain('runId: "run-7"');
	expect(script).toContain(JSON.stringify(PLAYGROUND_EVENT));
	expect(script).toContain('__styleshiftSend("done", "")');
});

test("reads a log event for the same run", () => {
	const detail = JSON.stringify({ runId: "run-7", kind: "log", text: "hello" });
	expect(readPlaygroundEvent(detail, "run-7")).toEqual({ kind: "log", text: "hello" });
});

test("reads a done event with empty text", () => {
	const detail = JSON.stringify({ runId: "run-7", kind: "done", text: "" });
	expect(readPlaygroundEvent(detail, "run-7")).toEqual({ kind: "done", text: "" });
});

test("ignores events from other runs, unknown kinds, and bad JSON", () => {
	expect(readPlaygroundEvent(JSON.stringify({ runId: "other", kind: "log", text: "x" }), "run-7")).toBe(null);
	expect(readPlaygroundEvent(JSON.stringify({ runId: "run-7", kind: "eval", text: "x" }), "run-7")).toBe(null);
	expect(readPlaygroundEvent("not json", "run-7")).toBe(null);
});
