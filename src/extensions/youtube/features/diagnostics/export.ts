import { downloadFile } from "@core/shared/extensionHelpers";
import { createError, createSuccess } from "@core/shared/notifications";
import { logger } from "@shared/logger";

import { collectDiagnosticsReport } from "./collect";
import { DEFAULT_EXPOSURE, applyExposure } from "./exposure";
import type { ExposureOptions } from "./types";
import {
	DIAGNOSTICS_REPORT_STORAGE_KEY,
	SANDBOX_REPORT_STORAGE_KEY,
	SHARE_REPORT_STORAGE_KEY,
} from "./viewer/reportInput";

export async function buildDiagnosticsJson(options: ExposureOptions = DEFAULT_EXPOSURE): Promise<string> {
	const report = applyExposure(await collectDiagnosticsReport(), options);
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

/** Stores the given report text for the viewer page, then opens it. Nothing leaves the browser. */
export async function openDiagnosticsViewerWithText(text: string): Promise<void> {
	try {
		await chrome.storage.local.set({ [DIAGNOSTICS_REPORT_STORAGE_KEY]: text });
		chrome.runtime.sendMessage({ Command: "openDiagnosticsPage" });
	} catch (error) {
		logger.error("diagnostics", "Failed to open the diagnostics viewer", error);
		createError(error instanceof Error ? error.message : "Failed to open the diagnostics viewer.");
	}
}

/** Stores the given report text for the sandbox page, then opens it. Nothing leaves the browser. */
export async function openDiagnosticsSandboxWithText(text: string): Promise<void> {
	try {
		await chrome.storage.local.set({ [SANDBOX_REPORT_STORAGE_KEY]: text });
		chrome.runtime.sendMessage({ Command: "openSandboxPage" });
	} catch (error) {
		logger.error("diagnostics", "Failed to open the sandbox", error);
		createError(error instanceof Error ? error.message : "Failed to open the sandbox.");
	}
}

/** Stores the raw report for the share page, then opens it. Only the filtered copy can leave that page. */
export async function openShareReport(): Promise<void> {
	try {
		const report = await collectDiagnosticsReport();
		await chrome.storage.local.set({ [SHARE_REPORT_STORAGE_KEY]: JSON.stringify(report) });
		chrome.runtime.sendMessage({ Command: "openDiagnosticsPage" });
	} catch (error) {
		logger.error("diagnostics", "Failed to open the share page", error);
		createError(error instanceof Error ? error.message : "Failed to build the diagnostics report.");
	}
}

/** Builds the current report and opens it in the viewer page. */
export async function openDiagnosticsViewer(): Promise<void> {
	try {
		await openDiagnosticsViewerWithText(await buildDiagnosticsJson());
	} catch (error) {
		logger.error("diagnostics", "Failed to open the diagnostics viewer", error);
		createError(error instanceof Error ? error.message : "Failed to build the diagnostics report.");
	}
}
