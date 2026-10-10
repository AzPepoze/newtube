export type PlaygroundMode = "functions" | "kinds";

export type KindParse = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Shared state for the playground panel. `version` changes when code is loaded from outside the editor.
 * `focusFile` asks the function list to scroll to a source file's group, then clears itself.
 */
export const playground = $state({
	open: false,
	mode: "functions" as PlaygroundMode,
	functionsCode: "",
	kindsJson: "",
	version: 0,
	focusFile: null as string | null,
});

function load(mode: PlaygroundMode, code: string) {
	playground.open = true;
	playground.mode = mode;
	if (mode === "functions") playground.functionsCode = code;
	else playground.kindsJson = code;
	playground.version++;
}

export function openFunctionCode(code: string) {
	load("functions", code);
}

export function openKindJson(json: string) {
	load("kinds", json);
}

export function parseKindJson(json: string): KindParse {
	try {
		return { ok: true, value: JSON.parse(json) };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : String(error) };
	}
}
