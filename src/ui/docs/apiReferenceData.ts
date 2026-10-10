/**
 * Pure data helpers for the API Reference window.
 *
 * Shared-safe: no DOM, no Svelte, no module-level mutable state. Operates on
 * the metadata entries generated into NewTube-Metadata.json at build time.
 */

export interface ApiFunctionDoc {
	label: string;
	detail: string;
	info?: string;
	file?: string;
}

export interface ApiFileGroup {
	file: string;
	functions: ApiFunctionDoc[];
}

export interface ApiDocTag {
	tag: string;
	body: string;
}

export interface ParsedApiDoc {
	summary: string;
	examples: string[];
	tags: ApiDocTag[];
}

const UNKNOWN_FILE = "unknown";

/** Formats an entry the way the generated .d.ts declares it. */
export function signatureFor(entry: ApiFunctionDoc): string {
	return `function ${entry.label}${entry.detail.replace(" => ", ": ")};`;
}

export interface SplitSignature {
	name: string;
	rest: string;
}

/** Splits a declaration into highlightable parts. */
export function splitSignature(signature: string): SplitSignature {
	const match = /^function\s+([A-Za-z_$][\w$]*)\s*([\s\S]*)$/.exec(signature);
	if (!match) return { name: "", rest: signature };
	return { name: match[1], rest: match[2] };
}

export interface SplitTagBody {
	type: string | null;
	text: string;
}

/** Splits a leading {type} from tag text. The type keeps its braces and may contain nested ones. */
export function splitTagBody(body: string): SplitTagBody {
	const trimmed = body.trim();
	const end = trimmed.startsWith("{") ? findClosingBrace(trimmed) : -1;
	if (end === -1) return { type: null, text: body };
	return { type: trimmed.slice(0, end + 1), text: trimmed.slice(end + 1).trim() };
}

/** Index of the brace that closes the one at position 0, or -1. */
function findClosingBrace(text: string): number {
	let depth = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "{") depth++;
		else if (text[i] === "}") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

export interface ApiDocRow {
	name: string;
	type: string | null;
	text: string;
}

/** Reads a @param body like "{string} name - text" into a table row. */
export function parseParamBody(body: string): ApiDocRow {
	const { type, text } = splitTagBody(body);
	const match = /^(\S+)\s*(?:-\s*)?([\s\S]*)$/.exec(text);
	return {
		name: match ? match[1] : "",
		type: stripBraces(type),
		text: match ? match[2].trim() : text,
	};
}

/** Reads a @returns body like "{string} text" into a table row. */
export function parseReturnsBody(body: string): ApiDocRow {
	const { type, text } = splitTagBody(body);
	return { name: "", type: stripBraces(type), text };
}

function stripBraces(type: string | null): string | null {
	return type ? type.slice(1, -1) : null;
}

const FILE_LABELS: Record<string, string> = {
	"domHelpers.ts": "Page & DOM",
	"extensionHelpers.ts": "Extension",
	"notifications.ts": "Notifications",
	"dialogs.ts": "Dialogs",
	"importExport.ts": "Import & Export",
	"webPageLogger.ts": "Logging",
	"utilities.ts": "Utilities",
	"colorConversion.ts": "Color",
	"webPage.ts": "Theme Variables",
	"manager.ts": "Storage",
	unknown: "Other",
};

/** Human topic name for a metadata source file. */
export function fileLabelFor(file: string): string {
	const known = FILE_LABELS[file];
	if (known) return known;
	return file
		.replace(/\.ts$/, "")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/^./, (first) => first.toUpperCase());
}

/** Groups entries by source file, keeping first-seen file order. */
export function groupFunctionsByFile(entries: ApiFunctionDoc[]): ApiFileGroup[] {
	const groups = new Map<string, ApiFunctionDoc[]>();
	for (const entry of entries) {
		const file = entry.file || UNKNOWN_FILE;
		const list = groups.get(file);
		if (list) list.push(entry);
		else groups.set(file, [entry]);
	}
	return [...groups].map(([file, functions]) => ({ file, functions }));
}

export interface ApiKindGroup<T extends { type: string }> {
	category: string;
	kinds: T[];
}

const KIND_CATEGORIES: Array<{ category: string; types: string[] }> = [
	{ category: "Display", types: ["text", "subText", "previewImage"] },
	{
		category: "Input",
		types: ["checkbox", "numberSlide", "dropdown", "color", "textInput", "imageInput", "selectorInput"],
	},
	{ category: "Action", types: ["button"] },
	{ category: "Structure", types: ["group", "combineSetting", "conditionSetting"] },
	{ category: "Advanced", types: ["custom"] },
];

const HIDDEN_KIND_TYPES = new Set(["keyboardShortcuts"]);

/** Groups setting kinds into fixed categories, unknown types land in Other. Hidden kinds are skipped. */
export function groupKindsByCategory<T extends { type: string }>(kinds: readonly T[]): ApiKindGroup<T>[] {
	const groups = new Map<string, T[]>();
	for (const kind of kinds) {
		if (HIDDEN_KIND_TYPES.has(kind.type)) continue;
		const match = KIND_CATEGORIES.find((entry) => entry.types.includes(kind.type));
		const category = match ? match.category : "Other";
		const list = groups.get(category);
		if (list) list.push(kind);
		else groups.set(category, [kind]);
	}
	const order = [...KIND_CATEGORIES.map((entry) => entry.category), "Other"];
	return [...groups]
		.map(([category, list]) => ({ category, kinds: list }))
		.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

/** Case-insensitive match across label, signature, docs, and file. Blank query returns everything. */
export function filterFunctions(entries: ApiFunctionDoc[], query: string): ApiFunctionDoc[] {
	const q = query.trim().toLowerCase();
	if (!q) return [...entries];
	return entries.filter((entry) =>
		[entry.label, entry.detail, entry.info ?? "", entry.file ?? ""].some((field) => field.toLowerCase().includes(q)),
	);
}

/** Splits JSDoc text into summary, @example blocks, and other @tags. */
export function parseDocTags(info?: string): ParsedApiDoc {
	const parsed: ParsedApiDoc = { summary: "", examples: [], tags: [] };
	if (!info || !info.trim()) return parsed;

	const summaryLines: string[] = [];
	let collecting: string[] | null = null;
	let seenTag = false;

	const flushExample = () => {
		if (collecting) {
			const body = collecting.join("\n").trim();
			if (body) parsed.examples.push(body);
			collecting = null;
		}
	};

	for (const rawLine of info.split("\n")) {
		const line = rawLine.trim();
		if (line.startsWith("@")) {
			flushExample();
			seenTag = true;
			const space = line.indexOf(" ");
			const tag = space === -1 ? line : line.slice(0, space);
			const body = space === -1 ? "" : line.slice(space + 1).trim();
			if (tag === "@example") collecting = body ? [body] : [];
			else parsed.tags.push({ tag, body });
		} else if (collecting) {
			collecting.push(rawLine);
		} else if (!seenTag) {
			summaryLines.push(rawLine);
		}
	}
	flushExample();
	parsed.summary = summaryLines.join("\n").trim();
	return parsed;
}

/** Top-level parameter names read from a detail like "(a: T, b?: U) => any". */
function parameterNamesFor(detail: string): string[] {
	const flat = detail.replace(/=>/g, "");
	let depth = 0;
	let end = -1;
	for (let i = 0; i < flat.length && end === -1; i++) {
		if ("([{<".includes(flat[i])) depth++;
		else if (")]}>".includes(flat[i])) {
			depth--;
			if (depth === 0) end = i;
		}
	}
	const inside = end === -1 ? "" : flat.slice(1, end).trim();
	if (!inside) return [];

	const parts: string[] = [];
	let current = "";
	let level = 0;
	for (const char of inside) {
		if ("([{<".includes(char)) level++;
		if (")]}>".includes(char)) level--;
		if (char === "," && level === 0) {
			parts.push(current);
			current = "";
		} else current += char;
	}
	parts.push(current);

	return parts.map((part) => /^\s*\.{0,3}([A-Za-z_$][\w$]*)/.exec(part)?.[1] ?? "").filter(Boolean);
}

/** A call line like "getScrollParent(element)" that the playground can run after editing. */
export function callStubFor(entry: ApiFunctionDoc): string {
	return `${entry.label}(${parameterNamesFor(entry.detail).join(", ")})`;
}
