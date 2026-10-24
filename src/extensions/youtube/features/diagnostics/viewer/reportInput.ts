import type { DiagnosticsReport } from "../types";

/** chrome.storage.local key the content script uses to hand a report to the viewer page. */
export const DIAGNOSTICS_REPORT_STORAGE_KEY = "__diagnosticsReport";
/** chrome.storage.local key the viewer uses to hand a report to the sandbox page. */
export const SANDBOX_REPORT_STORAGE_KEY = "__sandboxReport";
/** chrome.storage.local key the "Preview and share report" action uses to hand the raw report to the share page. */
export const SHARE_REPORT_STORAGE_KEY = "__shareReport";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses pasted or dropped report text. Throws an Error with a message the page can show. */
export function parseReportText(text: string): DiagnosticsReport {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("This is not valid JSON.");
	}
	if (!isPlainObject(parsed)) {
		throw new Error("The report must be a JSON object.");
	}
	if (!isPlainObject(parsed.meta)) {
		throw new Error("The report has no meta section.");
	}
	if (!isPlainObject(parsed.layout)) {
		throw new Error("The report has no layout section.");
	}
	return parsed as unknown as DiagnosticsReport;
}
