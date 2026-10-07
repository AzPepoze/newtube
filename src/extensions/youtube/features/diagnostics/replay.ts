import { importStyleShiftData } from "@core/shared/importExport";
import type { PersistedCategory, PersistedCurrentSettings } from "@settings/types/persistedSettings";

import type { DiagnosticsReport } from "./types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses a diagnostics .json file, rejecting anything that is not a usable report. */
export function parseDiagnosticsReport(text: string): DiagnosticsReport {
	const parsed = JSON.parse(text) as DiagnosticsReport;
	if (!isPlainObject(parsed)) {
		throw new Error("Diagnostics file must contain a JSON object.");
	}
	if (!isPlainObject(parsed.settings)) {
		throw new Error("Diagnostics file has no settings section.");
	}
	return parsed;
}

/**
 * Replays the captured configuration: applies the complete `currentSettings` object and the
 * custom `addOnStyleShiftItems` through the existing theme importer, which validates,
 * persists and refreshes the extension.
 */
export async function applyDiagnosticsSettings(report: DiagnosticsReport): Promise<void> {
	const { currentSettings, addOnStyleShiftItems } = report.settings;
	await importStyleShiftData({
		currentSettings: (currentSettings ?? {}) as PersistedCurrentSettings,
		addOnStyleShiftItems: (addOnStyleShiftItems ?? []) as PersistedCategory[],
	});
}
