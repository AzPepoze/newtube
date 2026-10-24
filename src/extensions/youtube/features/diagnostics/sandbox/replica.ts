import type { PageSnapshot, SnapshotFont, SnapshotNode } from "../types";

const VOID_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);
/** Tags that can run code or load resources, so they are never rendered from a report. */
const BLOCKED_TAGS = new Set([
	"script",
	"iframe",
	"frame",
	"frameset",
	"object",
	"noscript",
	"template",
	"style",
	"link",
	"meta",
	"base",
]);
const TAG_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const ATTRIBUTE_NAME_PATTERN = /^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/;
const URL_ATTRIBUTE_NAMES = new Set([
	"href",
	"src",
	"srcset",
	"srcdoc",
	"action",
	"formaction",
	"data",
	"poster",
	"xlink:href",
]);
const INTERNAL_REFERENCE_ATTRIBUTE_NAMES = new Set(["href", "xlink:href"]);
const STYLE_PROPERTY_PATTERN = /^[a-zA-Z-]+$/;
const IMAGE_PLACEHOLDER_RULE = "img[data-ss-img] { background-color: #2a2a2a; }";
const VIDEO_PLACEHOLDER_RULE = "video:not([poster]) { background-color: #1a1a1a; }";
/** Only web and inline image addresses are loaded. No quotes, backslashes or whitespace, so they are safe inside `url("...")`. */
const RESOURCE_URL_PATTERN = /^(https?:\/\/|data:image\/)[^\s"'\\<>{}]*$/i;
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
const RELATIVE_PATH_PATTERN = /^\/(?![/\\])\S*$/;
const HASH_PATTERN = /^#\S*$/;
const SRCSET_SEPARATOR_PATTERN = /,\s+/;
const SRCSET_DESCRIPTOR_PATTERN = /^\d*\.?\d+[wx]$/;
/** Matches `url(...)` with one level of nested parentheses, such as `url(javascript:alert(1))`. */
const CSS_URL_FUNCTION_PATTERN = /url\(((?:[^()]|\([^()]*\))*)\)/gi;
const FONT_DATA_PATTERN = /^data:[^\s"'\\<>{}]*$/i;
const FONT_DATA_PREFIXES = [
	"data:font/",
	"data:application/font",
	"data:application/x-font",
	"data:application/octet-stream",
];
const FONT_KEYWORD_PATTERN = /^[a-z0-9 .%-]+$/i;
const LINK_REL_VALUE = "noreferrer noopener";

/** Escapes a value for use inside a double-quoted attribute. */
function escapeAttribute(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escapes a value for use as element text content. */
function escapeText(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Removes characters that could close the style element or the rule block. */
function sanitizeStyleValue(value: string): string {
	return value.replace(/[<>{}]/g, "").trim();
}

function isRenderableTag(tag: string): boolean {
	return TAG_NAME_PATTERN.test(tag) && !BLOCKED_TAGS.has(tag);
}

/** Allows `#id` references to elements in the same document, such as SVG sprite symbols. */
function isInternalReference(name: string, value: string): boolean {
	return INTERNAL_REFERENCE_ATTRIBUTE_NAMES.has(name.toLowerCase()) && value.startsWith("#");
}

function isRenderableAttribute(name: string, value: string): boolean {
	const lowerName = name.toLowerCase();
	if (!ATTRIBUTE_NAME_PATTERN.test(name) || lowerName.startsWith("on") || lowerName === "autoplay") return false;
	return isInternalReference(name, value) || !URL_ATTRIBUTE_NAMES.has(lowerName);
}

function isAllowedResourceUrl(value: string | undefined): value is string {
	return value !== undefined && RESOURCE_URL_PATTERN.test(value);
}

/** Keeps a link only when it is absolute http(s), a root-relative path or a hash. */
function isSafeLinkHref(value: string | undefined): value is string {
	if (value === undefined) return false;
	return ABSOLUTE_HTTP_URL_PATTERN.test(value) || RELATIVE_PATH_PATTERN.test(value) || HASH_PATTERN.test(value);
}

function parseSrcsetCandidate(candidate: string): string | undefined {
	const [url, descriptor] = candidate.trim().split(/\s+/);
	if (!isAllowedResourceUrl(url)) return undefined;
	if (descriptor === undefined) return url;
	return SRCSET_DESCRIPTOR_PATTERN.test(descriptor) ? `${url} ${descriptor}` : undefined;
}

/** Returns a srcset with only valid candidates, or undefined when any candidate is invalid. */
function sanitizeSrcset(srcset: string | undefined): string | undefined {
	if (!srcset) return undefined;
	const candidates = srcset.split(SRCSET_SEPARATOR_PATTERN).map(parseSrcsetCandidate);
	return candidates.every((candidate) => candidate !== undefined) ? candidates.join(", ") : undefined;
}

function unquote(value: string): string {
	return value.replace(/^(["'])(.*)\1$/, "$2");
}

/** Replaces every `url(...)` whose address is not http(s) or data:image with `none`. */
function sanitizeCssUrls(value: string): string {
	return value.replace(CSS_URL_FUNCTION_PATTERN, (_match, rawUrl: string) => {
		const url = unquote(rawUrl.trim());
		return isAllowedResourceUrl(url) ? `url("${url}")` : "none";
	});
}

function linkAttributes(node: SnapshotNode): [string, string][] {
	if (node.tag !== "a" || !isSafeLinkHref(node.href)) return [];
	return [
		["href", node.href],
		["rel", LINK_REL_VALUE],
	];
}

function imageAttributes(media: SnapshotNode["media"]): [string, string][] {
	const src = media?.src;
	if (!isAllowedResourceUrl(src)) return [];
	const srcset = sanitizeSrcset(media?.srcset);
	return srcset
		? [
				["src", src],
				["srcset", srcset],
			]
		: [["src", src]];
}

function mediaAttributes(node: SnapshotNode): [string, string][] {
	if (node.tag === "img") return imageAttributes(node.media);
	const poster = node.media?.poster;
	if (node.tag === "video" && isAllowedResourceUrl(poster)) return [["poster", poster]];
	return [];
}

function a11yAttributes(a11y: SnapshotNode["a11y"]): [string, string][] {
	if (!a11y) return [];
	const pairs: [string, string | undefined][] = [
		["aria-label", a11y.ariaLabel],
		["title", a11y.title],
		["alt", a11y.alt],
	];
	return pairs.filter((pair): pair is [string, string] => pair[1] !== undefined);
}

/** Later sources win, so exposure-checked link, media and a11y values override raw attributes. */
function collectAttributes(node: SnapshotNode): Map<string, string> {
	const attributes = new Map<string, string>();
	if (node.id) attributes.set("id", node.id);
	if (node.classes?.length) attributes.set("class", node.classes.join(" "));
	for (const [name, value] of Object.entries(node.attrs ?? {})) {
		if (isRenderableAttribute(name, String(value))) attributes.set(name, String(value));
	}
	const extra = [...linkAttributes(node), ...mediaAttributes(node), ...a11yAttributes(node.a11y)];
	for (const [name, value] of extra) attributes.set(name, value);
	return attributes;
}

function renderAttributes(node: SnapshotNode): string {
	const attributes = collectAttributes(node);
	if (node.tag === "img" && !attributes.has("src")) attributes.set("data-ss-img", "");
	attributes.set("data-ss-s", String(node.style));
	return [...attributes].map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("");
}

/** Renders a node, its masked text and its element children. Void elements never get text. */
const SIZE_SKIPPED_DISPLAYS = new Set(["inline", "contents", "none", "table-column", "table-column-group"]);

/** The HTML parser re-parents these when they nest oddly, which would change the captured tree. */
const PARSER_SENSITIVE_TAGS = new Set([
	"button",
	"p",
	"form",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"td",
	"th",
	"caption",
	"colgroup",
	"col",
	"select",
	"option",
	"optgroup",
	"textarea",
	"dd",
	"dt",
	"li",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"nobr",
	"fieldset",
	"legend",
	"details",
	"summary",
]);
const FLEX_PARENT_DISPLAYS = new Set(["flex", "inline-flex"]);

interface RenderContext {
	styles: PageSnapshot["styles"];
	sizeRules: string[];
	anchorDepth: number;
}

/** Nested anchors are invalid HTML, so an inner one is rendered as a div. */
function pickTag(node: SnapshotNode, context: RenderContext): string {
	if (PARSER_SENSITIVE_TAGS.has(node.tag)) return "div";
	if (node.tag === "a" && context.anchorDepth > 0) return "div";
	return node.tag;
}

function readPixels(style: Record<string, string>, ...properties: string[]): number {
	return properties.reduce((sum, property) => sum + (Number.parseFloat(style[property] ?? "") || 0), 0);
}

/** Converts a border-box length into the length the captured box-sizing expects. */
function toContentSize(length: number, style: Record<string, string>, extraProperties: string[]): number {
	if (style["box-sizing"] === "border-box") return length;
	return Math.max(0, length - readPixels(style, ...extraProperties));
}

/** Pins the captured box size in the base layer, so StyleShift rules still win over it. */
function addSizeRule(node: SnapshotNode, context: RenderContext, parentDisplay: string): string {
	const style = context.styles[node.style] ?? {};
	if (SIZE_SKIPPED_DISPLAYS.has(style.display ?? "") || !node.rect.width) return "";
	const index = context.sizeRules.length;
	const width = toContentSize(node.rect.width, style, [
		"padding-left",
		"padding-right",
		"border-left-width",
		"border-right-width",
	]);
	const minHeight = toContentSize(node.rect.height, style, [
		"padding-top",
		"padding-bottom",
		"border-top-width",
		"border-bottom-width",
	]);
	const height = node.rect.height ? ` min-height: ${minHeight}px;` : "";
	const flexItem = FLEX_PARENT_DISPLAYS.has(parentDisplay) ? " flex: 0 0 auto; min-width: 0; max-width: none;" : "";
	context.sizeRules.push(`[data-ss-n="${index}"] { width: ${width}px;${height}${flexItem} }`);
	return ` data-ss-n="${index}"`;
}

function renderNode(node: SnapshotNode, context: RenderContext, parentDisplay = ""): string {
	if (!isRenderableTag(node.tag)) return "";
	const tag = pickTag(node, context);
	const open = `<${tag}${renderAttributes(node)}${addSizeRule(node, context, parentDisplay)}>`;
	if (VOID_TAGS.has(node.tag)) return open;
	const text = escapeText(node.text ?? "");
	const display = context.styles[node.style]?.display ?? "";
	if (tag === "a") context.anchorDepth += 1;
	const children = (node.children ?? []).map((child) => renderNode(child, context, display)).join("");
	if (tag === "a") context.anchorDepth -= 1;
	return `${open}${text}${children}</${tag}>`;
}

function findBodyNode(root: SnapshotNode): SnapshotNode | undefined {
	if (root.tag === "body") return root;
	return root.children?.find((child) => child.tag === "body");
}

function renderBody(root: SnapshotNode, context: RenderContext): string {
	const body = findBodyNode(root);
	if (body) return renderNode(body, context);
	return `<body>${renderNode(root, context)}</body>`;
}

function buildStyleRule(index: number, style: Record<string, string>): string {
	const declarations = Object.entries(style)
		.filter(([property]) => STYLE_PROPERTY_PATTERN.test(property))
		.map(([property, value]) => [property, sanitizeCssUrls(sanitizeStyleValue(String(value)))] as const)
		.filter(([, value]) => value)
		.map(([property, value]) => `${property}: ${value};`)
		.join(" ");
	return declarations ? `[data-ss-s="${index}"] { ${declarations} }` : "";
}

/** Escapes a value for use inside a double-quoted CSS string. */
function escapeCssString(value: string): string {
	return value.replace(/[\\"]/g, "\\$&").replace(/[\r\n\f]/g, " ");
}

function isAllowedFontData(data: string): boolean {
	const lowerData = data.toLowerCase();
	return FONT_DATA_PATTERN.test(data) && FONT_DATA_PREFIXES.some((prefix) => lowerData.startsWith(prefix));
}

function fontDescriptor(name: string, value: string | undefined): string {
	return value && FONT_KEYWORD_PATTERN.test(value) ? `${name}: ${value};` : "";
}

function buildFontFaceRule(font: SnapshotFont): string {
	const family = sanitizeStyleValue(font.family);
	if (!family || !isAllowedFontData(font.data)) return "";
	const descriptors = [
		`font-family: "${escapeCssString(family)}";`,
		`src: url("${font.data}");`,
		fontDescriptor("font-weight", font.weight),
		fontDescriptor("font-style", font.style),
	];
	return `@font-face { ${descriptors.filter(Boolean).join(" ")} }`;
}

/** Font rules stay outside the base layer so they are not overridden by its styles. */
function buildFontFaceRules(fonts: SnapshotFont[] | undefined): string[] {
	return (fonts ?? []).map(buildFontFaceRule).filter(Boolean);
}

function buildStyleSheet(snapshot: PageSnapshot, sizeRules: string[]): string {
	const rules = snapshot.styles.map((style, index) => buildStyleRule(index, style)).filter(Boolean);
	const layer = [
		"@layer base {",
		"html, body { margin: 0; }",
		IMAGE_PLACEHOLDER_RULE,
		VIDEO_PLACEHOLDER_RULE,
		...rules,
		...sizeRules,
		"}",
	];
	return [...buildFontFaceRules(snapshot.fonts), ...layer].join("\n");
}

/** Builds a flow-layout HTML document from a snapshot. Each element gets its computed styles through `data-ss-s`. */
export function buildReplicaDocument(snapshot: PageSnapshot): string {
	if (!snapshot.root) return '<!doctype html><html><head><meta charset="UTF-8"></head><body></body></html>';
	const context: RenderContext = { styles: snapshot.styles, sizeRules: [], anchorDepth: 0 };
	const body = renderBody(snapshot.root, context);
	const styleSheet = buildStyleSheet(snapshot, context.sizeRules);
	const htmlAttributes = renderAttributes(snapshot.root);
	return `<!doctype html><html${htmlAttributes}><head><meta charset="UTF-8"><style>${styleSheet}</style></head>${body}</html>`;
}
