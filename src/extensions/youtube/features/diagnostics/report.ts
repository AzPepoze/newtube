import type { DiagnosticsReport, DiagnosticsReportInput } from "./types";

export const DIAGNOSTICS_REPORT_VERSION = 2;

export interface AnonymizedPage {
	url: string;
	origin: string;
	pathname: string;
	queryParamNames: string[];
}

/**
 * Keeps only origin + pathname so the shared URL cannot identify the watched video,
 * playlist or account. Query parameter *names* are kept (never their values) so layout
 * bugs tied to `hl`/`gl`/`list` style params remain diagnosable without leaking anything.
 */
export function anonymizePage(rawUrl: string): AnonymizedPage {
	try {
		const url = new URL(rawUrl);
		return {
			url: `${url.origin}${url.pathname}`,
			origin: url.origin,
			pathname: url.pathname,
			queryParamNames: [...new Set(url.searchParams.keys())],
		};
	} catch {
		const [withoutHash] = rawUrl.split("#");
		const [pathname, query = ""] = withoutHash.split("?");
		const queryParamNames = query
			? [
					...new Set(
						query
							.split("&")
							.map((pair) => pair.split("=")[0])
							.filter(Boolean),
					),
				]
			: [];
		return { url: pathname, origin: "", pathname, queryParamNames };
	}
}

export function buildDiagnosticsReport(input: DiagnosticsReportInput): DiagnosticsReport {
	const page = anonymizePage(input.url);

	return {
		meta: {
			reportVersion: DIAGNOSTICS_REPORT_VERSION,
			generatedAt: input.generatedAt ?? new Date().toISOString(),
			extension: {
				name: input.extensionName || "unknown",
				version: input.extensionVersion || "unknown",
			},
		},
		environment: {
			userAgent: input.userAgent,
			userAgentData: input.userAgentData ?? null,
			platform: input.platform,
			viewport: { ...input.viewport },
			colorScheme: input.colorScheme,
			reducedMotion: input.reducedMotion,
		},
		page: {
			url: page.url,
			origin: page.origin,
			pathname: page.pathname,
			queryParamNames: page.queryParamNames,
			mode: input.mode,
		},
		settings: {
			currentSettings: { ...(input.currentSettings ?? {}) },
			addOnStyleShiftItems: [...(input.addOnStyleShiftItems ?? [])],
		},
		layout: input.layout,
		css: input.css,
		selectors: { ...input.selectors },
	};
}
