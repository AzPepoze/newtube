import { downloadFile } from "@core/shared/utilities";
import { logger } from "@shared/logger";
import { SvelteDate } from "svelte/reactivity";

import { applyExposure, DEFAULT_EXPOSURE, estimateExposureBytes } from "./exposure";
import { buildReplicaDocument } from "./sandbox/replica";
import { formatReportSize } from "./shareFormat";
import type { DiagnosticsReport, ExposureOptions } from "./types";
import { parseReportText, SHARE_REPORT_STORAGE_KEY } from "./viewer/reportInput";

const PREVIEW_DELAY_MS = 150;

/** Reads the raw report stored for the share page, then clears it. Returns null when none is stored. */
async function readStoredReportText(): Promise<string | null> {
	try {
		const stored = await chrome.storage.local.get(SHARE_REPORT_STORAGE_KEY);
		const text = stored[SHARE_REPORT_STORAGE_KEY];
		if (typeof text !== "string") return null;
		await chrome.storage.local.remove(SHARE_REPORT_STORAGE_KEY);
		return text;
	} catch (error) {
		logger.warn("diagnostics", "Could not read the share report", error);
		return null;
	}
}

function formatReportJson(report: DiagnosticsReport): string {
	return JSON.stringify(report, null, 2);
}

function buildShareFileName(): string {
	const stamp = new SvelteDate().toISOString().replace(/[:.]/g, "-");
	return `styleshift-diagnostics-${stamp}.json`;
}

/** Share page state. The raw report stays private; only the filtered copy is shown or exported. */
export function createSharePageState() {
	let rawReport = $state.raw<DiagnosticsReport | null>(null);
	let options = $state<ExposureOptions>({ ...DEFAULT_EXPOSURE });
	let previewHtml = $state.raw("");
	let notice = $state("");
	let previewTimer: ReturnType<typeof setTimeout> | undefined;

	const filteredReport = $derived(rawReport ? applyExposure(rawReport, options) : null);
	const sizeLabel = $derived(filteredReport ? formatReportSize(estimateExposureBytes(filteredReport)) : "");

	function buildPreviewHtml(): string {
		const snapshot = filteredReport?.snapshot;
		return snapshot ? buildReplicaDocument(snapshot) : "";
	}

	function refreshPreview(): void {
		previewHtml = buildPreviewHtml();
	}

	function schedulePreview(): void {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(refreshPreview, PREVIEW_DELAY_MS);
	}

	/** Returns true when a report was stored for this page. */
	async function loadStoredReport(): Promise<boolean> {
		const text = await readStoredReportText();
		if (text === null) return false;
		try {
			rawReport = parseReportText(text);
		} catch (error) {
			logger.error("diagnostics", "Could not parse the share report", error);
			return false;
		}
		refreshPreview();
		return true;
	}

	function setOption(key: keyof ExposureOptions, value: boolean): void {
		options[key] = value;
		schedulePreview();
	}

	async function copyJson(): Promise<void> {
		if (!filteredReport) return;
		try {
			await navigator.clipboard.writeText(formatReportJson(filteredReport));
			notice = "Copied. Nothing was sent anywhere.";
		} catch (error) {
			logger.error("diagnostics", "Failed to copy the shared report", error);
			notice = "Could not copy the report.";
		}
	}

	function saveFile(): void {
		if (!filteredReport) return;
		downloadFile(formatReportJson(filteredReport), buildShareFileName());
		notice = "Saved. Nothing was sent anywhere.";
	}

	function cancel(): void {
		window.close();
	}

	return {
		get filteredReport() {
			return filteredReport;
		},
		get options() {
			return options;
		},
		get sizeLabel() {
			return sizeLabel;
		},
		get previewHtml() {
			return previewHtml;
		},
		get notice() {
			return notice;
		},
		loadStoredReport,
		setOption,
		copyJson,
		saveFile,
		cancel,
	};
}

export type SharePageState = ReturnType<typeof createSharePageState>;
