import { getDocumentBody } from "@core/shared/domHelpers";
import { logger } from "@shared/logger";
import { applyDiagnosticsSettings } from "../replay";
import type { DiagnosticsReport, PageSnapshot } from "../types";
import { SANDBOX_REPORT_STORAGE_KEY, parseReportText } from "../viewer/reportInput";
import { buildReplicaDocument } from "./replica";

const STYLE_SELECTOR = "style[STYLESHIFT_style_sheet_id]";
const MIRROR_ATTRIBUTE = "data-ss-mirror";

/** Copies every StyleShift stylesheet from the page head into the replica head. */
export function mirrorStylesheets(frame: HTMLIFrameElement): void {
	const frameHead = frame.contentDocument?.head;
	if (!frameHead) return;
	frameHead.querySelectorAll(`style[${MIRROR_ATTRIBUTE}]`).forEach((style) => style.remove());
	document.head.querySelectorAll(STYLE_SELECTOR).forEach((style) => {
		const copy = style.cloneNode(true) as HTMLStyleElement;
		copy.setAttribute(MIRROR_ATTRIBUTE, "1");
		frameHead.append(copy);
	});
}

/** Keeps the replica stylesheets in sync with the page head. */
export function startStyleMirror(frame: HTMLIFrameElement): void {
	const refresh = () => mirrorStylesheets(frame);
	frame.addEventListener("load", refresh);
	const observer = new MutationObserver(refresh);
	observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true });
}

function createReplicaFrame(snapshot: PageSnapshot): HTMLIFrameElement {
	const frame = document.createElement("iframe");
	frame.srcdoc = buildReplicaDocument(snapshot);
	// allow-same-origin lets the page mirror styles; scripts stay blocked.
	frame.setAttribute("sandbox", "allow-same-origin");
	frame.style.cssText = "position: fixed; inset: 0; width: 100%; height: 100%; border: 0; z-index: 0;";
	return frame;
}

async function readSandboxReportText(): Promise<string | null> {
	const stored = await chrome.storage.local.get(SANDBOX_REPORT_STORAGE_KEY);
	const text = stored[SANDBOX_REPORT_STORAGE_KEY];
	return typeof text === "string" ? text : null;
}

/** Seeds the sandbox settings from the stored report and shows the captured page behind the settings window. */
export async function startSandbox(): Promise<boolean> {
	const reportText = await readSandboxReportText();
	if (reportText === null) {
		logger.warn("diagnostics", "No sandbox report found in storage.");
		return false;
	}
	await chrome.storage.local.remove(SANDBOX_REPORT_STORAGE_KEY);

	let report: DiagnosticsReport;
	try {
		report = parseReportText(reportText);
	} catch (error) {
		logger.error("diagnostics", "Sandbox report could not be read:", error);
		return false;
	}

	await applyDiagnosticsSettings(report);
	if (!report.snapshot) {
		logger.warn("diagnostics", "Sandbox report has no page snapshot.");
		return false;
	}

	const frame = createReplicaFrame(report.snapshot);
	startStyleMirror(frame);
	(await getDocumentBody()).prepend(frame);
	return true;
}
