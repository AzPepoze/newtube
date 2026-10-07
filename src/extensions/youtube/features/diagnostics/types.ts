/** Locally collected, shareable snapshot of the current YouTube layout and NewTube state. */
export interface DiagnosticsReport {
	meta: {
		reportVersion: number;
		generatedAt: string;
		extension: {
			name: string;
			version: string;
		};
	};
	environment: DiagnosticsEnvironment;
	page: DiagnosticsPage;
	settings: DiagnosticsSettings;
	layout: LayoutOutline;
	css: CssSnapshot;
	selectors: Record<string, number>;
}

export interface DiagnosticsEnvironment {
	userAgent: string;
	userAgentData: unknown;
	platform: string;
	viewport: {
		width: number;
		height: number;
		devicePixelRatio: number;
	};
	colorScheme: "light" | "dark";
	reducedMotion: boolean;
}

export interface DiagnosticsPage {
	/** Anonymized: origin + pathname only, never the query string or hash. */
	url: string;
	origin: string;
	pathname: string;
	/** Query parameter names only (no values), so tracking/geo/lang params never leak. */
	queryParamNames: string[];
	mode: PageMode;
}

export interface DiagnosticsSettings {
	currentSettings: Record<string, unknown>;
	addOnStyleShiftItems: unknown[];
}

export type PageMode = "watch" | "shorts" | "browse" | "search" | "playlist" | "channel" | "other" | "music";

/** Structure-only DOM node: no text nodes, no script/style contents, no href/src values. */
export interface LayoutNode {
	tag: string;
	id?: string;
	classes?: string[];
	role?: string;
	ariaLabel?: string;
	children?: LayoutNode[];
}

export interface LayoutOutline {
	/** One outline per curated NewTube region (masthead, player, feed, …); null when absent. */
	regions: Record<string, LayoutNode | null>;
	nodeCount: number;
	depthLimit: number;
	/** Nodes that were skipped because the depth or node budget was reached. */
	droppedNodes: number;
	truncated: boolean;
}

export interface ComputedStyleSnapshot {
	selector: string;
	present: boolean;
	styles: Record<string, string>;
}

export interface CssSnapshot {
	injected: string;
	injectedBytes: number;
	stylesheetCount: number;
	computed: ComputedStyleSnapshot[];
}

/** Everything the report needs, without touching the DOM, so it can be built and tested in isolation. */
export interface DiagnosticsReportInput {
	generatedAt?: string;
	extensionName: string;
	extensionVersion: string;
	userAgent: string;
	userAgentData?: unknown;
	platform: string;
	viewport: DiagnosticsEnvironment["viewport"];
	colorScheme: DiagnosticsEnvironment["colorScheme"];
	reducedMotion: boolean;
	url: string;
	mode: PageMode;
	currentSettings: Record<string, unknown> | null | undefined;
	addOnStyleShiftItems: unknown[] | null | undefined;
	layout: LayoutOutline;
	css: CssSnapshot;
	selectors: Record<string, number>;
}
