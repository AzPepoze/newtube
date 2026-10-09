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

/** Splits a leading {type} from tag text. */
export function splitTagBody(body: string): SplitTagBody {
	const match = /^\{([^}]*)\}\s*([\s\S]*)$/.exec(body.trim());
	if (!match) return { type: null, text: body };
	return { type: `{${match[1]}}`, text: match[2].trim() };
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

const KNOWN_VERBS = new Set([
	"get",
	"set",
	"is",
	"has",
	"can",
	"wait",
	"open",
	"close",
	"copy",
	"create",
	"load",
	"save",
	"check",
	"show",
	"hide",
	"enable",
	"disable",
	"toggle",
	"remove",
	"add",
	"on",
	"fire",
	"trigger",
	"fetch",
	"parse",
	"format",
	"sort",
	"apply",
	"import",
	"export",
	"download",
	"rearrange",
]);

/** Verb root of a camelCase name, or null when it names no known action. */
export function verbFor(label: string): string | null {
	const match = /^([a-z]+)(?=[A-Z])/.exec(label);
	if (!match || !KNOWN_VERBS.has(match[1])) return null;
	return match[1];
}

const VERB_COLORS: Record<string, string> = {
	get: "#2196f3",
	set: "#4caf50",
	is: "#3eadad",
	has: "#3eadad",
	can: "#3eadad",
	wait: "#ff9800",
	open: "#7f5db7",
	close: "#f44336",
	copy: "#e45eff",
	create: "#ffb020",
	load: "#38bdf8",
	save: "#4caf50",
	check: "#3eadad",
	show: "#7f5db7",
	hide: "#9e9e9e",
	enable: "#4caf50",
	disable: "#f44336",
	toggle: "#ffb020",
	remove: "#f44336",
	add: "#4caf50",
	on: "#2196f3",
	fire: "#ff9800",
	trigger: "#ff9800",
	fetch: "#38bdf8",
	parse: "#a3e635",
	format: "#a3e635",
	sort: "#a3e635",
	apply: "#3eadad",
	import: "#7f8cff",
	export: "#7f8cff",
	download: "#7f8cff",
	rearrange: "#f472b6",
};

/** Badge color for a verb, gray when unknown. */
export function verbColorFor(verb: string): string {
	return VERB_COLORS[verb] ?? "#9e9e9e";
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
	{ category: "Advanced", types: ["custom", "keyboardShortcuts"] },
];

/** Groups setting kinds into fixed categories, unknown types land in Other. */
export function groupKindsByCategory<T extends { type: string }>(kinds: readonly T[]): ApiKindGroup<T>[] {
	const groups = new Map<string, T[]>();
	for (const kind of kinds) {
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
