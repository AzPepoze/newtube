import type { DiagnosticsReport, ExposureOptions, LayoutOutline, PageSnapshot, SnapshotNode } from "./types";

/** Page content is hidden by default. Settings, CSS, layout and browser details are shared. */
export const DEFAULT_EXPOSURE: ExposureOptions = {
	text: false,
	names: false,
	images: false,
	video: false,
	links: false,
	alt: false,
	fonts: false,
	settings: true,
	css: true,
	layout: true,
	browser: true,
	screen: true,
};

const URL_FUNCTION_PATTERN = /url\([^)]*\)/gi;

type SnapshotMedia = NonNullable<SnapshotNode["media"]>;
type SnapshotStyles = PageSnapshot["styles"];

/** Replaces every non-space character with X, so word lengths stay visible but letters do not. */
export function maskText(value: string): string {
	return value.replace(/\S/g, "X");
}

/** Replaces every `url(...)` with `none` so no resource address is shared. */
function replaceUrlFunctions(value: string): string {
	return value.replace(URL_FUNCTION_PATTERN, "none");
}

function keepsText(kind: SnapshotNode["textKind"], options: ExposureOptions): boolean {
	if (kind === "icon") return options.fonts;
	if (kind === "name") return options.names || options.text;
	return options.text;
}

function filterMedia(media: SnapshotNode["media"], options: ExposureOptions): SnapshotNode["media"] {
	const { src, srcset, poster } = media ?? {};
	const kept: SnapshotMedia = {};
	if (src && options.images) kept.src = src;
	if (srcset && options.images) kept.srcset = srcset;
	if (poster && options.video) kept.poster = poster;
	return Object.keys(kept).length ? kept : undefined;
}

function filterA11y(a11y: SnapshotNode["a11y"], options: ExposureOptions): SnapshotNode["a11y"] {
	if (!a11y || !options.alt) return undefined;
	return Object.keys(a11y).length ? a11y : undefined;
}

function filterAttrs(attrs: SnapshotNode["attrs"], options: ExposureOptions): SnapshotNode["attrs"] {
	if (!attrs?.style || options.images) return attrs;
	return { ...attrs, style: replaceUrlFunctions(attrs.style) };
}

function filterNode(node: SnapshotNode, options: ExposureOptions): SnapshotNode {
	const { text, textKind, href, media, a11y, attrs, children, ...rest } = node;
	const filtered: SnapshotNode = { ...rest };

	if (text !== undefined) {
		filtered.text = keepsText(textKind, options) ? text : maskText(text);
		if (textKind) filtered.textKind = textKind;
	}
	if (href !== undefined && options.links) filtered.href = href;
	const filteredMedia = filterMedia(media, options);
	if (filteredMedia) filtered.media = filteredMedia;
	const filteredA11y = filterA11y(a11y, options);
	if (filteredA11y) filtered.a11y = filteredA11y;
	const filteredAttrs = filterAttrs(attrs, options);
	if (filteredAttrs) filtered.attrs = filteredAttrs;
	if (children?.length) filtered.children = children.map((child) => filterNode(child, options));

	return filtered;
}

function filterStyleEntry(style: SnapshotStyles[number]): SnapshotStyles[number] {
	const image = style["background-image"];
	if (!image) return style;
	const stripped = replaceUrlFunctions(image);
	return stripped === image ? style : { ...style, "background-image": stripped };
}

function filterStyles(styles: SnapshotStyles, options: ExposureOptions): SnapshotStyles {
	if (options.images) return styles;
	return styles.map(filterStyleEntry);
}

function filterSnapshot(snapshot: PageSnapshot, options: ExposureOptions): PageSnapshot {
	const filtered: PageSnapshot = {
		root: snapshot.root ? filterNode(snapshot.root, options) : null,
		styles: filterStyles(snapshot.styles, options),
		nodeCount: snapshot.nodeCount,
		truncated: snapshot.truncated,
	};
	if (options.fonts && snapshot.fonts) filtered.fonts = snapshot.fonts;
	return filtered;
}

function filterPage(page: DiagnosticsReport["page"], options: ExposureOptions): DiagnosticsReport["page"] {
	const { rawUrl, ...rest } = page;
	return options.links ? { ...rest, url: rawUrl ?? page.url } : rest;
}

function filterEnvironment(
	environment: DiagnosticsReport["environment"],
	options: ExposureOptions,
): DiagnosticsReport["environment"] {
	const filtered = { ...environment };
	if (!options.browser) {
		filtered.userAgent = "";
		filtered.userAgentData = null;
		filtered.platform = "";
	}
	if (!options.screen) {
		filtered.viewport = { width: 0, height: 0, devicePixelRatio: 1 };
	}
	return filtered;
}

function filterSettings(
	settings: DiagnosticsReport["settings"],
	options: ExposureOptions,
): DiagnosticsReport["settings"] {
	if (options.settings) return settings;
	return { currentSettings: {}, addOnStyleShiftItems: [] };
}

function filterLayout(layout: LayoutOutline, options: ExposureOptions): LayoutOutline {
	if (options.layout) return layout;
	return { regions: {}, nodeCount: 0, depthLimit: layout.depthLimit, droppedNodes: 0, truncated: false };
}

function filterCss(css: DiagnosticsReport["css"], options: ExposureOptions): DiagnosticsReport["css"] {
	if (options.css) return css;
	return { injected: "", injectedBytes: 0, stylesheetCount: 0, computed: [] };
}

/** Returns a copy of the report with only the data the user allowed. Never mutates the input. */
export function applyExposure(report: DiagnosticsReport, options: ExposureOptions): DiagnosticsReport {
	const filtered: DiagnosticsReport = {
		meta: { ...report.meta },
		environment: filterEnvironment(report.environment, options),
		page: filterPage(report.page, options),
		settings: filterSettings(report.settings, options),
		layout: filterLayout(report.layout, options),
		css: filterCss(report.css, options),
		selectors: options.layout ? { ...report.selectors } : {},
	};
	if (report.snapshot) filtered.snapshot = filterSnapshot(report.snapshot, options);
	return filtered;
}

/** Size of the report as JSON text, in UTF-16 characters. */
export function estimateExposureBytes(report: DiagnosticsReport): number {
	return JSON.stringify(report).length;
}
