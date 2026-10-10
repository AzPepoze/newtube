// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import {
	fileLabelFor,
	filterFunctions,
	groupFunctionsByFile,
	groupKindsByCategory,
	parseDocTags,
	parseParamBody,
	parseReturnsBody,
	signatureFor,
	splitSignature,
	splitTagBody,
} from "../../../src/ui/docs/apiReferenceData";

const ENTRIES = [
	{
		label: "copyToClipboard",
		detail: "(text: string) => void",
		info: "Copies text.",
		file: "extensionHelpers.ts",
	},
	{
		label: "openSettingPage",
		detail: "() => void",
		info: "Opens settings.\n@example openSettingPage();",
		file: "extensionHelpers.ts",
	},
	{
		label: "saveRootValue",
		detail: "(key: string, value: any) => Promise<void>",
		info: "Saves.",
		file: "manager.ts",
	},
];

test("signature formats like a declaration", () => {
	expect(signatureFor(ENTRIES[0])).toBe("function copyToClipboard(text: string): void;");
	expect(signatureFor(ENTRIES[2])).toBe("function saveRootValue(key: string, value: any): Promise<void>;");
});

test("groups preserve file order", () => {
	const groups = groupFunctionsByFile(ENTRIES);
	expect(groups.map((group) => group.file)).toEqual(["extensionHelpers.ts", "manager.ts"]);
	expect(groups[0].functions.map((fn) => fn.label)).toEqual(["copyToClipboard", "openSettingPage"]);
});

test("groups unfiled entries under unknown", () => {
	const groups = groupFunctionsByFile([{ label: "x", detail: "() => void" }]);
	expect(groups[0].file).toBe("unknown");
});

test("filter matches label, signature, info, and file", () => {
	expect(filterFunctions(ENTRIES, "clipboard").map((fn) => fn.label)).toEqual(["copyToClipboard"]);
	expect(filterFunctions(ENTRIES, "promise").map((fn) => fn.label)).toEqual(["saveRootValue"]);
	expect(filterFunctions(ENTRIES, "manager").map((fn) => fn.label)).toEqual(["saveRootValue"]);
	expect(filterFunctions(ENTRIES, "  ").length).toBe(3);
});

test("doc tags split summary from examples", () => {
	const parsed = parseDocTags("Opens settings.\n@example openSettingPage();\n@example openSettingPage(1);");
	expect(parsed.summary).toBe("Opens settings.");
	expect(parsed.examples).toEqual(["openSettingPage();", "openSettingPage(1);"]);
});

test("other tags are kept as notes", () => {
	const parsed = parseDocTags("Does things.\n@param id the id\n@example go();");
	expect(parsed.summary).toBe("Does things.");
	expect(parsed.tags).toEqual([{ tag: "@param", body: "id the id" }]);
	expect(parsed.examples).toEqual(["go();"]);
});

test("doc without tags is all summary", () => {
	const parsed = parseDocTags("Copies text.");
	expect(parsed.summary).toBe("Copies text.");
	expect(parsed.examples).toEqual([]);
	expect(parsed.tags).toEqual([]);
});

test("missing doc parses empty", () => {
	expect(parseDocTags()).toEqual({ summary: "", examples: [], tags: [] });
});

test("signature splits into name and rest", () => {
	expect(splitSignature("function copyToClipboard(text: string): void;")).toEqual({
		name: "copyToClipboard",
		rest: "(text: string): void;",
	});
	expect(splitSignature("not a signature")).toEqual({ name: "", rest: "not a signature" });
});

test("tag body splits leading type from text", () => {
	expect(splitTagBody("{string} value - The raw selector string.")).toEqual({
		type: "{string}",
		text: "value - The raw selector string.",
	});
	expect(splitTagBody("just text")).toEqual({ type: null, text: "just text" });
});

test("file labels speak human", () => {
	expect(fileLabelFor("domHelpers.ts")).toBe("Page & DOM");
	expect(fileLabelFor("extensionHelpers.ts")).toBe("Extension");
	expect(fileLabelFor("notifications.ts")).toBe("Notifications");
	expect(fileLabelFor("dialogs.ts")).toBe("Dialogs");
	expect(fileLabelFor("importExport.ts")).toBe("Import & Export");
	expect(fileLabelFor("webPageLogger.ts")).toBe("Logging");
	expect(fileLabelFor("utilities.ts")).toBe("Utilities");
	expect(fileLabelFor("colorConversion.ts")).toBe("Color");
	expect(fileLabelFor("webPage.ts")).toBe("Theme Variables");
	expect(fileLabelFor("manager.ts")).toBe("Storage");
	expect(fileLabelFor("unknown")).toBe("Other");
	expect(fileLabelFor("myUtil.ts")).toBe("My Util");
});

test("param tags split name, type and text", () => {
	expect(parseParamBody("{HTMLElement | null} element - The starting element.")).toEqual({
		name: "element",
		type: "HTMLElement | null",
		text: "The starting element.",
	});
	expect(parseParamBody("count The number of items.")).toEqual({
		name: "count",
		type: null,
		text: "The number of items.",
	});
});

test("returns tags split type and text", () => {
	expect(parseReturnsBody("{string} The label.")).toEqual({ name: "", type: "string", text: "The label." });
});

test("keyboardShortcuts is hidden from setting kinds", () => {
	const groups = groupKindsByCategory([{ type: "button" }, { type: "keyboardShortcuts" }]);
	expect(groups.flatMap((group) => group.kinds.map((kind) => kind.type))).toEqual(["button"]);
});

test("kinds group into fixed categories in order", () => {
	const kinds = [
		{ type: "button" },
		{ type: "text" },
		{ type: "checkbox" },
		{ type: "group" },
		{ type: "custom" },
		{ type: "mystery" },
	];
	const groups = groupKindsByCategory(kinds);
	expect(groups.map((group) => group.category)).toEqual([
		"Display",
		"Input",
		"Action",
		"Structure",
		"Advanced",
		"Other",
	]);
	expect(groups[0].kinds.map((kind) => kind.type)).toEqual(["text"]);
	expect(groups[1].kinds.map((kind) => kind.type)).toEqual(["checkbox"]);
	expect(groups[2].kinds.map((kind) => kind.type)).toEqual(["button"]);
	expect(groups[5].kinds.map((kind) => kind.type)).toEqual(["mystery"]);
});

test("kind groups skip empty categories", () => {
	const groups = groupKindsByCategory([{ type: "button" }]);
	expect(groups.map((group) => group.category)).toEqual(["Action"]);
});
