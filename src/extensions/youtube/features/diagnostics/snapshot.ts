import type { PageSnapshot, SnapshotNode, SnapshotRect } from "./types";

export const SNAPSHOT_NODE_LIMIT = 60000;

const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "LINK", "META"]);
const LEAF_ONLY_TAGS = new Set(["VIDEO", "CANVAS", "IFRAME"]);
const EXTENSION_NAME_PATTERN = /styleshift|newtube/i;
const BACKGROUND_LAYER_PATTERN = /-bg-(tint|image)$/i;
const ICON_FONT_PATTERN = /icon/i;
const NAME_ELEMENT_SELECTOR = [
	"ytd-channel-name",
	"#channel-name",
	"#owner-name",
	"#author-text",
	"ytd-video-owner-renderer",
	"#channel-handle",
	".yt-core-attributed-string--link-inherit-color",
].join(", ");
const MEDIA_TAG_NAMES = new Set(["IMG", "SOURCE", "VIDEO"]);
const TEXT_NODE_TYPE = 3;

const KEPT_ATTRIBUTE_NAMES = new Set([
	"hidden",
	"dark",
	"is-dark-theme",
	"role",
	"page-subtype",
	"theater",
	"fullscreen",
	"type",
	"disabled",
	"aria-hidden",
	"aria-expanded",
	"aria-selected",
	"aria-checked",
	"aria-pressed",
	"tabindex",
	"slot",
	"viewBox",
	"preserveAspectRatio",
	"d",
	"points",
	"x",
	"y",
	"x1",
	"x2",
	"y1",
	"y2",
	"cx",
	"cy",
	"r",
	"rx",
	"ry",
	"fill",
	"fill-rule",
	"clip-rule",
	"stroke",
	"stroke-width",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"fill-opacity",
	"opacity",
	"transform",
	"width",
	"height",
	"xmlns",
]);
const REFERENCE_ATTRIBUTE_NAMES = new Set(["href", "xlink:href"]);
const DROPPED_ATTRIBUTE_NAMES = new Set([
	"aria-label",
	"title",
	"alt",
	"href",
	"xlink:href",
	"src",
	"srcset",
	"value",
	"placeholder",
]);
const OWN_FIELD_ATTRIBUTE_NAMES = new Set(["class", "id"]);

const STYLE_PROPERTIES = [
	"display",
	"position",
	"top",
	"right",
	"bottom",
	"left",
	"margin-top",
	"margin-right",
	"margin-bottom",
	"margin-left",
	"padding-top",
	"padding-right",
	"padding-bottom",
	"padding-left",
	"border-top-width",
	"border-right-width",
	"border-bottom-width",
	"border-left-width",
	"border-top-style",
	"border-top-color",
	"box-sizing",
	"flex-direction",
	"flex-wrap",
	"justify-content",
	"align-items",
	"gap",
	"grid-template-columns",
	"grid-template-rows",
	"overflow-x",
	"overflow-y",
	"z-index",
	"transform",
	"opacity",
	"visibility",
	"font-family",
	"font-size",
	"font-weight",
	"line-height",
	"color",
	"background-color",
	"background-image",
	"border-radius",
	"border-right-style",
	"border-bottom-style",
	"border-left-style",
	"border-right-color",
	"border-bottom-color",
	"border-left-color",
	"flex-grow",
	"flex-shrink",
	"flex-basis",
	"align-self",
	"align-content",
	"justify-self",
	"order",
	"min-width",
	"min-height",
	"max-width",
	"max-height",
	"aspect-ratio",
	"float",
	"vertical-align",
	"background-size",
	"background-repeat",
	"background-position",
	"background-clip",
	"object-fit",
	"object-position",
	"text-decoration-line",
	"text-align",
	"text-overflow",
	"text-transform",
	"text-indent",
	"letter-spacing",
	"white-space",
	"word-break",
	"overflow-wrap",
	"font-style",
	"box-shadow",
	"filter",
	"fill",
	"stroke",
	"stroke-width",
	"-webkit-line-clamp",
	"-webkit-box-orient",
	"color-scheme",
] as const;

interface SnapshotContext {
	view: Window | null;
	styles: Record<string, string>[];
	styleIndex: Map<string, number>;
	nodeCount: number;
	truncated: boolean;
}

function readRect(element: any, view: Window | null): SnapshotRect {
	if (typeof element.getBoundingClientRect !== "function") return { x: 0, y: 0, width: 0, height: 0 };
	const box = element.getBoundingClientRect();
	const scrollX = view?.scrollX ?? 0;
	const scrollY = view?.scrollY ?? 0;
	return {
		x: Math.round(box.x + scrollX),
		y: Math.round(box.y + scrollY),
		width: Math.round(box.width),
		height: Math.round(box.height),
	};
}

function readClasses(element: any): string[] | undefined {
	const raw = typeof element.className === "string" ? element.className : element.className?.baseVal;
	if (!raw) return undefined;
	const classes = String(raw).split(/\s+/).filter(Boolean);
	return classes.length ? classes : undefined;
}

/** Matches the extension's own UI so it is not captured twice. The tint and image background layers are part of the page look, so they stay. */
function isExtensionElement(element: any): boolean {
	const id = element.id ? String(element.id) : "";
	if (BACKGROUND_LAYER_PATTERN.test(id)) return false;
	if (id.startsWith("STYLESHIFT") || EXTENSION_NAME_PATTERN.test(id)) return true;
	return (readClasses(element) ?? []).some((name) => EXTENSION_NAME_PATTERN.test(name));
}

/** Keeps only `#id` references, such as a sprite `<use href="#icon">`. */
function isInternalReference(name: string, value: string): boolean {
	return REFERENCE_ATTRIBUTE_NAMES.has(name) && value.startsWith("#");
}

function readAttributeValue(name: string, value: string): string | undefined {
	if (isInternalReference(name, value)) return value;
	if (DROPPED_ATTRIBUTE_NAMES.has(name) || name.startsWith("data-")) return undefined;
	if (name === "style" || KEPT_ATTRIBUTE_NAMES.has(name)) return value;
	return "";
}

function readAttributes(element: any): Record<string, string> | undefined {
	const attrs: Record<string, string> = {};
	for (const attribute of Array.from<{ name: string; value: string }>(element.attributes ?? [])) {
		if (OWN_FIELD_ATTRIBUTE_NAMES.has(attribute.name)) continue;
		const value = readAttributeValue(attribute.name, String(attribute.value));
		if (value !== undefined) attrs[attribute.name] = value;
	}
	return Object.keys(attrs).length ? attrs : undefined;
}

function readText(element: any): string | undefined {
	const content = Array.from<any>(element.childNodes ?? [])
		.filter((child) => child.nodeType === TEXT_NODE_TYPE)
		.map((child) => String(child.nodeValue ?? ""))
		.join("")
		.trim();
	return content || undefined;
}

/** Icon fonts draw glyphs from text such as "home", so their text is marked as icon text. */
function isIconText(element: any, context: SnapshotContext): boolean {
	const fontFamily = context.view?.getComputedStyle(element).getPropertyValue("font-family") ?? "";
	return ICON_FONT_PATTERN.test(fontFamily);
}

function isNameElement(element: any): boolean {
	return typeof element.closest === "function" && Boolean(element.closest(NAME_ELEMENT_SELECTOR));
}

function readTextKind(element: any, context: SnapshotContext): SnapshotNode["textKind"] {
	if (isIconText(element, context)) return "icon";
	return isNameElement(element) ? "name" : undefined;
}

function readAttribute(element: any, name: string): string | undefined {
	const value = typeof element.getAttribute === "function" ? element.getAttribute(name) : null;
	return value ? String(value) : undefined;
}

/** Reads a raw href, skipping `#` references that the attribute list already keeps. */
function readHref(element: any): string | undefined {
	const href = readAttribute(element, "href");
	return href && !href.startsWith("#") ? href : undefined;
}

function readMedia(element: any, tagName: string): SnapshotNode["media"] {
	if (!MEDIA_TAG_NAMES.has(tagName)) return undefined;
	const media: NonNullable<SnapshotNode["media"]> = {};
	const src = element.currentSrc || readAttribute(element, "src");
	const srcset = readAttribute(element, "srcset");
	const poster = tagName === "VIDEO" ? readAttribute(element, "poster") : undefined;
	if (src) media.src = src;
	if (srcset) media.srcset = srcset;
	if (poster) media.poster = poster;
	return Object.keys(media).length ? media : undefined;
}

function readA11y(element: any): SnapshotNode["a11y"] {
	const a11y: NonNullable<SnapshotNode["a11y"]> = {};
	const ariaLabel = readAttribute(element, "aria-label");
	const title = readAttribute(element, "title");
	const alt = readAttribute(element, "alt");
	if (ariaLabel) a11y.ariaLabel = ariaLabel;
	if (title) a11y.title = title;
	if (alt) a11y.alt = alt;
	return Object.keys(a11y).length ? a11y : undefined;
}

function readBackgroundImage(computed: CSSStyleDeclaration | undefined): string {
	const image = computed?.getPropertyValue("background-image") ?? "";
	return image === "none" ? "" : image;
}

function readStyle(element: any, context: SnapshotContext, isLeaf: boolean): number {
	const computed = context.view?.getComputedStyle(element);
	const style: Record<string, string> = {};
	for (const property of STYLE_PROPERTIES) {
		style[property] = computed?.getPropertyValue(property) ?? "";
	}
	style["background-image"] = readBackgroundImage(computed);
	if (isLeaf) {
		style.width = computed?.getPropertyValue("width") ?? "";
		style.height = computed?.getPropertyValue("height") ?? "";
	}
	return internStyle(context, style);
}

function internStyle(context: SnapshotContext, style: Record<string, string>): number {
	const key = JSON.stringify(style);
	const existing = context.styleIndex.get(key);
	if (existing !== undefined) return existing;
	const index = context.styles.length;
	context.styles.push(style);
	context.styleIndex.set(key, index);
	return index;
}

function buildChildren(element: any, context: SnapshotContext): SnapshotNode[] {
	const children: SnapshotNode[] = [];
	for (const child of Array.from<any>(element.children ?? [])) {
		const node = buildNode(child, context);
		if (node) children.push(node);
	}
	return children;
}

function buildNode(element: any, context: SnapshotContext): SnapshotNode | null {
	const tagName = String(element?.tagName ?? "").toUpperCase();
	if (!tagName || SKIPPED_TAGS.has(tagName)) return null;
	if (isExtensionElement(element)) return null;
	if (context.nodeCount >= SNAPSHOT_NODE_LIMIT) {
		context.truncated = true;
		return null;
	}
	context.nodeCount += 1;

	const node: SnapshotNode = { tag: tagName.toLowerCase(), rect: readRect(element, context.view), style: 0 };
	const id = element.id ? String(element.id) : undefined;
	if (id) node.id = id;
	const classes = readClasses(element);
	if (classes) node.classes = classes;
	const attrs = readAttributes(element);
	if (attrs) node.attrs = attrs;
	const text = readText(element);
	if (text) {
		node.text = text;
		const textKind = readTextKind(element, context);
		if (textKind) node.textKind = textKind;
	}
	const href = readHref(element);
	if (href) node.href = href;
	const media = readMedia(element, tagName);
	if (media) node.media = media;
	const a11y = readA11y(element);
	if (a11y) node.a11y = a11y;

	const children = LEAF_ONLY_TAGS.has(tagName) ? [] : buildChildren(element, context);
	if (children.length) node.children = children;
	node.style = readStyle(element, context, children.length === 0);
	return node;
}

export function buildPageSnapshot(root: Document = document): PageSnapshot {
	const context: SnapshotContext = {
		view: root.defaultView ?? null,
		styles: [],
		styleIndex: new Map(),
		nodeCount: 0,
		truncated: false,
	};
	const rootNode = buildNode(root.documentElement, context);
	return {
		root: rootNode,
		styles: context.styles,
		nodeCount: context.nodeCount,
		truncated: context.truncated,
	};
}
