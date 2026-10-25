import { createError } from "@core/shared/notifications";
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
