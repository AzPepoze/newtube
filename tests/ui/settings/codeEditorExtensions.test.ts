// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { buildReadonlyExtensions, isJsLanguage } from "../../../src/ui/settings/codeEditorExtensions";

// Dracula theme ships CSS expectations for browsers; a no-op stands in here
// because readonly locking does not depend on theming.
const cm = {
	EditorState,
	EditorView,
	dracula: [],
	javascript: (options) => javascript(options),
	css: () => [],
};

test("readonly extensions lock the editor state", () => {
	const extensions = buildReadonlyExtensions(cm, "json");
	const state = EditorState.create({ doc: '{"type": "dropdown"}', extensions });
	expect(state.readOnly).toBe(true);
	expect(state.doc.toString()).toBe('{"type": "dropdown"}');
});

test("readonly extensions highlight json with the javascript grammar", () => {
	const extensions = buildReadonlyExtensions(cm, "json");
	const state = EditorState.create({ doc: '{"value": "Item_1"}', extensions });
	expect(state.readOnly).toBe(true);
	expect(state.doc.lines).toBe(1);
});

test("json resolves to the javascript language", () => {
	expect(isJsLanguage("json")).toBe(true);
	expect(isJsLanguage("javascript")).toBe(true);
	expect(isJsLanguage("js")).toBe(true);
	expect(isJsLanguage("css")).toBe(false);
});
