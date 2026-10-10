/**
 * Pure helpers for the playground. The page-side wrapper reports back with a
 * CustomEvent, and these read that event. No DOM or extension imports here.
 */

export const PLAYGROUND_EVENT = "StyleShift:PlaygroundResult";

export type PlaygroundLineKind = "log" | "result" | "error" | "note";

export interface PlaygroundLine {
	kind: PlaygroundLineKind;
	text: string;
}

export type PlaygroundEvent = PlaygroundLine | { kind: "done"; text: "" };

const LINE_KINDS = new Set<string>(["log", "result", "error", "done"]);

/** Wraps user code so logs, the return value, and errors are sent back to the docs. */
export function wrapPlaygroundScript(code: string, runId: string): string {
	return `(async () => {
	const __styleshiftFormat = (value) => {
		if (typeof value === "string") return value;
		try {
			return JSON.stringify(value) ?? String(value);
		} catch (_error) {
			return String(value);
		}
	};
	const __styleshiftSend = (kind, value) => {
		window.dispatchEvent(new CustomEvent(${JSON.stringify(PLAYGROUND_EVENT)}, {
			detail: JSON.stringify({ runId: ${JSON.stringify(runId)}, kind, text: __styleshiftFormat(value) }),
		}));
	};
	const console = {
		log: (...values) => values.forEach((value) => __styleshiftSend("log", value)),
		error: (...values) => values.forEach((value) => __styleshiftSend("error", value)),
	};
	try {
		const __styleshiftResult = await (async () => {
${code}
		})();
		if (__styleshiftResult !== undefined) __styleshiftSend("result", __styleshiftResult);
	} catch (error) {
		__styleshiftSend("error", error instanceof Error ? error.message : error);
	}
	__styleshiftSend("done", "");
})();`;
}

/** Reads one event sent by the wrapper. Returns null for other runs or bad payloads. */
export function readPlaygroundEvent(detail: string, runId: string): PlaygroundEvent | null {
	let data: { runId?: unknown; kind?: unknown; text?: unknown };
	try {
		data = JSON.parse(detail);
	} catch (_error) {
		return null;
	}
	if (data.runId !== runId || typeof data.kind !== "string" || !LINE_KINDS.has(data.kind)) return null;
	const text = typeof data.text === "string" ? data.text : "";
	return { kind: data.kind as PlaygroundEvent["kind"], text } as PlaygroundEvent;
}
