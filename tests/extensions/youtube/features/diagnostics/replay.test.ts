// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { describe, expect, mock, test } from "bun:test";

mock.module("@core/shared/importExport", () => ({ importStyleShiftData: async () => {} }));

const { parseDiagnosticsReport } = await import("@extensions/youtube/features/diagnostics/replay");

describe("parseDiagnosticsReport", () => {
	test("returns the parsed object when settings is present", () => {
		const report = parseDiagnosticsReport(JSON.stringify({ settings: { currentSettings: { A: true } } }));
		expect(report).toEqual({ settings: { currentSettings: { A: true } } });
	});

	test("rejects a JSON array", () => {
		expect(() => parseDiagnosticsReport("[1, 2]")).toThrow("Diagnostics file must contain a JSON object.");
	});

	test("rejects a JSON primitive", () => {
		expect(() => parseDiagnosticsReport("42")).toThrow("Diagnostics file must contain a JSON object.");
	});

	test("rejects an object without a settings section", () => {
		expect(() => parseDiagnosticsReport(JSON.stringify({ meta: {} }))).toThrow(
			"Diagnostics file has no settings section.",
		);
	});

	test("rejects invalid JSON", () => {
		expect(() => parseDiagnosticsReport("{ not json")).toThrow();
	});
});
