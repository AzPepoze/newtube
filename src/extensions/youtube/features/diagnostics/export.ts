import { downloadFile } from "@core/shared/extensionHelpers";
import { createError, createSuccess } from "@core/shared/notifications";
import { logger } from "@shared/logger";

import { collectDiagnosticsReport } from "./collect";

export async function buildDiagnosticsJson(): Promise<string> {
	const report = await collectDiagnosticsReport();
	return JSON.stringify(report, null, 2);
}

function buildDiagnosticsFileName(): string {
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `styleshift-diagnostics-${stamp}.json`;
}

/**
 * Builds the report and copies it to the clipboard. Everything runs locally; nothing is sent anywhere.
 * Uses the clipboard API directly so a rejected write surfaces as an error instead of a false success.
 */
export async function copyDiagnosticsToClipboard(): Promise<boolean> {
	try {
		const json = await buildDiagnosticsJson();
		await navigator.clipboard.writeText(json);
		logger.info("diagnostics", "Diagnostics report copied to clipboard");
		createSuccess("Diagnostics copied to clipboard. Nothing was sent anywhere.");
		return true;
	} catch (error) {
		logger.error("diagnostics", "Failed to copy diagnostics report", error);
		createError(error instanceof Error ? error.message : "Failed to build the diagnostics report.");
		return false;
	}
}

/** Builds the report and downloads it as a .json file. Local only, like the copy action. */
export async function exportDiagnosticsFile(): Promise<boolean> {
	try {
		const json = await buildDiagnosticsJson();
		downloadFile(json, buildDiagnosticsFileName());
		logger.info("diagnostics", "Diagnostics report exported to a file");
		createSuccess("Diagnostics exported as a .json file. Nothing was sent anywhere.");
		return true;
	} catch (error) {
		logger.error("diagnostics", "Failed to export diagnostics report", error);
		createError(error instanceof Error ? error.message : "Failed to build the diagnostics report.");
		return false;
	}
}
