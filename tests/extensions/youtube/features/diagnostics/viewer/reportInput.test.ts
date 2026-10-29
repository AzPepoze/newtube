// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { parseReportText } from "@extensions/youtube/features/diagnostics/viewer/reportInput";

test("parseReportText returns a report with meta and layout", () => {
	const text = JSON.stringify({ meta: { reportVersion: 3 }, layout: { regions: {} } });
	expect(parseReportText(text)).toEqual({ meta: { reportVersion: 3 }, layout: { regions: {} } });
});

test("parseReportText rejects invalid JSON", () => {
	expect(() => parseReportText("{not json")).toThrow("This is not valid JSON.");
});

test("parseReportText rejects non-object JSON", () => {
	expect(() => parseReportText("[1, 2]")).toThrow("The report must be a JSON object.");
	expect(() => parseReportText("null")).toThrow("The report must be a JSON object.");
});

test("parseReportText requires meta and layout sections", () => {
	expect(() => parseReportText(JSON.stringify({ layout: {} }))).toThrow("The report has no meta section.");
	expect(() => parseReportText(JSON.stringify({ meta: {} }))).toThrow("The report has no layout section.");
});
