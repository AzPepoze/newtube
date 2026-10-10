import { executeScriptString } from "@core/runtime/controller";
import { IS_IN_EXTENSION_SETTINGS_PAGE } from "@core/shared/context";
import { PLAYGROUND_EVENT, readPlaygroundEvent, wrapPlaygroundScript, type PlaygroundLine } from "./script";

const QUIET_TIMEOUT_MS = 3000;

/** Runs code in the YouTube page and streams its output. Resolves when the run ends or goes quiet. */
export function runPlayground(code: string, onLine: (line: PlaygroundLine) => void): Promise<void> {
	if (IS_IN_EXTENSION_SETTINGS_PAGE) {
		onLine({ kind: "note", text: "Run works on a YouTube tab. Open the docs there." });
		return Promise.resolve();
	}

	const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

	return new Promise((resolve) => {
		let timer = 0;

		const finish = () => {
			clearTimeout(timer);
			window.removeEventListener(PLAYGROUND_EVENT, listener);
			resolve();
		};

		const armTimeout = () => {
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				onLine({ kind: "note", text: "No result. The script was blocked or never finished." });
				finish();
			}, QUIET_TIMEOUT_MS);
		};

		const listener = (event: Event) => {
			const message = readPlaygroundEvent((event as CustomEvent<string>).detail, runId);
			if (!message) return;
			if (message.kind === "done") {
				finish();
				return;
			}
			onLine(message);
			armTimeout();
		};

		window.addEventListener(PLAYGROUND_EVENT, listener);
		armTimeout();
		executeScriptString({
			scriptContent: wrapPlaygroundScript(code, runId),
			shouldSanitize: true,
			sourceIdentifier: "API Reference playground",
		});
	});
}
