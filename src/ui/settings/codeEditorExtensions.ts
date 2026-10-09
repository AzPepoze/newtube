/**
 * Extension presets for the CodeMirror 6 editor.
 *
 * Shared-safe: pure helpers over an injected CodeMirror facade, so they work
 * with the lazily loaded `codemirrorInstance` and stay unit-testable without
 * a browser.
 */

export interface CodeMirrorFacade {
	EditorState: any;
	EditorView: any;
	dracula: any;
	javascript: (options?: any) => any;
	css: (options?: any) => any;
}

/** True for languages highlighted with the JavaScript grammar (JSON included). */
export function isJsLanguage(language: string): boolean {
	const lang = language.toLowerCase();
	return lang === "javascript" || lang === "js" || lang === "json";
}

/** Minimal extensions for a non-editable, syntax-highlighted code display. */
export function buildReadonlyExtensions(cm: CodeMirrorFacade, language: string): any[] {
	const extensions = [
		cm.dracula,
		cm.EditorView.lineWrapping,
		cm.EditorState.readOnly.of(true),
		cm.EditorView.editable.of(false),
	];

	const lang = language.toLowerCase();
	if (isJsLanguage(language)) extensions.push(cm.javascript());
	else if (lang === "css") extensions.push(cm.css());

	return extensions;
}
