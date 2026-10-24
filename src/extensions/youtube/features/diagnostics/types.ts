/** Locally collected, shareable snapshot of the current YouTube layout and StyleShift state. */
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
	snapshot?: PageSnapshot;
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
	/** The full page URL. Only present before exposure filtering. */
	rawUrl?: string;
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
	/** Integer box in viewport pixels. Geometry only. */
	rect?: { x: number; y: number; width: number; height: number };
	children?: LayoutNode[];
}

export interface SnapshotRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Full-page node: structure, page-coordinate geometry and an index into `PageSnapshot.styles`. */
export interface SnapshotNode {
	tag: string;
	id?: string;
	classes?: string[];
	rect: SnapshotRect;
	attrs?: Record<string, string>;
	/** Raw own text of this element. Exposure filtering masks it unless the user allows it. */
	text?: string;
	/** "icon" when the font is an icon font, "name" when the element is or sits inside a channel/user name. */
	textKind?: "icon" | "name";
	/** Raw `href` of a link or area. Internal `#` references stay in `attrs`. */
	href?: string;
	media?: { src?: string; srcset?: string; poster?: string };
	a11y?: { ariaLabel?: string; title?: string; alt?: string };
	style: number;
	children?: SnapshotNode[];
}

export interface SnapshotFont {
	family: string;
	weight?: string;
	style?: string;
	/** data: URL */
	data: string;
}

export interface PageSnapshot {
	root: SnapshotNode | null;
	styles: Record<string, string>[];
	nodeCount: number;
	truncated: boolean;
	fonts?: SnapshotFont[];
}

/** Which kinds of page data a shared report may contain. */
export interface ExposureOptions {
	text: boolean;
	names: boolean;
	images: boolean;
	video: boolean;
	links: boolean;
	alt: boolean;
	fonts: boolean;
	settings: boolean;
	css: boolean;
	layout: boolean;
	browser: boolean;
	screen: boolean;
}

export interface LayoutOutline {
	/** One outline per curated StyleShift region (masthead, player, feed, …); null when absent. */
	regions: Record<string, LayoutNode | null>;
	nodeCount: number;
	depthLimit: number;
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
	snapshot?: PageSnapshot;
	css: CssSnapshot;
	selectors: Record<string, number>;
}
