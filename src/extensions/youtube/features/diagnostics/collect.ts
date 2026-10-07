import { getRootValue } from "@core/storage/manager";
import { logger } from "@shared/logger";

import { buildCssSnapshot } from "./css";
import { buildLayoutOutline } from "./outline";
import { buildDiagnosticsReport } from "./report";
import { YOUTUBE_DIAGNOSTIC_SELECTORS, countSelectors, detectPageMode } from "./selectors";
import type { DiagnosticsEnvironment, DiagnosticsReport } from "./types";

function readManifestField(field: "name" | "version"): string {
	try {
		return chrome.runtime.getManifest()[field];
	} catch (error) {
		logger.warn("diagnostics", `Could not read extension ${field} from manifest`, error);
		return "unknown";
	}
}

function readUserAgentData(): unknown {
	const data = (navigator as any).userAgentData;
	if (!data) return null;
	return {
		brands: data.brands,
		mobile: data.mobile,
		platform: data.platform,
		architecture: data.architecture,
		bitness: data.bitness,
		model: data.model,
		fullVersionList: data.fullVersionList,
	};
}

function readColorScheme(): DiagnosticsEnvironment["colorScheme"] {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Reads the live page. Only called from an explicit user action. */
export async function collectDiagnosticsReport(): Promise<DiagnosticsReport> {
	const currentSettings = (await getRootValue("currentSettings")) ?? {};
	const addOnStyleShiftItems = (await getRootValue("addOnStyleShiftItems")) ?? [];

	return buildDiagnosticsReport({
		extensionName: readManifestField("name"),
		extensionVersion: readManifestField("version"),
		userAgent: navigator.userAgent,
		userAgentData: readUserAgentData(),
		platform: navigator.platform,
		viewport: {
			width: window.innerWidth,
			height: window.innerHeight,
			devicePixelRatio: window.devicePixelRatio,
		},
		colorScheme: readColorScheme(),
		reducedMotion: readReducedMotion(),
		url: location.href,
		mode: detectPageMode(location.pathname, location.host),
		currentSettings,
		addOnStyleShiftItems,
		layout: buildLayoutOutline(document),
		css: buildCssSnapshot(document),
		selectors: countSelectors(document, YOUTUBE_DIAGNOSTIC_SELECTORS),
	});
}
