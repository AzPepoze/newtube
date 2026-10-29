import { downloadFile } from "@core/shared/utilities";
import { logger } from "@shared/logger";
import { SvelteDate } from "svelte/reactivity";

import type { DiagnosticsReport } from "./types";
import { DIAGNOSTICS_REPORT_STORAGE_KEY, parseReportText, SANDBOX_REPORT_STORAGE_KEY } from "./viewer/reportInput";

export type DiagnosticsTab = "layout" | "preview" | "css" | "settings";

export const DIAGNOSTICS_TABS: { id: DiagnosticsTab; label: string }[] = [
	{ id: "layout", label: "Layout" },
	{ id: "preview", label: "Preview" },
	{ id: "css", label: "CSS" },
	{ id: "settings", label: "Settings" },
];

function formatReportJson(report: DiagnosticsReport): string {
	return JSON.stringify(report, null, 2);
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : "Could not read the report.";
}

/** Reads the report the extension stored for this page, then clears it so a reload shows the empty state. */
async function readStoredReportText(): Promise<string | null> {
	try {
		const stored = await chrome.storage.local.get(DIAGNOSTICS_REPORT_STORAGE_KEY);
		const text = stored[DIAGNOSTICS_REPORT_STORAGE_KEY];
		if (typeof text !== "string") return null;
		await chrome.storage.local.remove(DIAGNOSTICS_REPORT_STORAGE_KEY);
		return text;
	} catch (error) {
		logger.warn("diagnostics", "Could not read the stored report", error);
		return null;
	}
}

export function createDiagnosticsPageState() {
	let report = $state.raw<DiagnosticsReport | null>(null);
	let errorMessage = $state("");
	let notice = $state("");
	let activeTab = $state<DiagnosticsTab>("layout");

	function showReportText(text: string): boolean {
		try {
			report = parseReportText(text);
			errorMessage = "";
			return true;
		} catch (error) {
			errorMessage = errorText(error);
			return false;
		}
	}

	function clearReport(): void {
		report = null;
		errorMessage = "";
		notice = "";
	}

	async function loadStoredReport(): Promise<void> {
		const text = await readStoredReportText();
		if (text !== null) showReportText(text);
	}

	async function copyReportJson(): Promise<void> {
		if (!report) return;
		try {
			await navigator.clipboard.writeText(formatReportJson(report));
			notice = "Copied the report JSON.";
		} catch (error) {
			logger.error("diagnostics", "Failed to copy the report from the viewer", error);
			notice = "Could not copy the report.";
		}
	}

	function saveReportFile(): void {
		if (!report) return;
		const stamp = new SvelteDate().toISOString().replace(/[:.]/g, "-");
		downloadFile(formatReportJson(report), `styleshift-diagnostics-${stamp}.json`);
	}

	/** Hands the report to the sandbox page through storage, then opens it. Nothing leaves the browser. */
	async function openInSandbox(): Promise<void> {
		if (!report?.snapshot) {
			notice = "This report has no page snapshot (version 3 or older).";
			return;
		}
		try {
			await chrome.storage.local.set({ [SANDBOX_REPORT_STORAGE_KEY]: formatReportJson(report) });
			chrome.runtime.sendMessage({ Command: "openSandboxPage" });
		} catch (error) {
			logger.error("diagnostics", "Failed to open the sandbox from the viewer", error);
			notice = "Could not open the sandbox.";
		}
	}

	return {
		get report() {
			return report;
		},
		get errorMessage() {
			return errorMessage;
		},
		get notice() {
			return notice;
		},
		get activeTab() {
			return activeTab;
		},
		set activeTab(tab: DiagnosticsTab) {
			activeTab = tab;
		},
		showReportText,
		clearReport,
		loadStoredReport,
		copyReportJson,
		saveReportFile,
		openInSandbox,
	};
}
