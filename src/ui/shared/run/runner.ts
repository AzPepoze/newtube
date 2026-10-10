import { executeScriptString } from "@core/runtime/controller";
import { IS_IN_EXTENSION_SETTINGS_PAGE } from "@core/shared/context";
import { logger } from "@shared/logger";
import { RUN_EVENT, readRunEvent, wrapRunScript, type RunLine } from "./script";

const QUIET_TIMEOUT_MS = 3000;

/**
 * Runs code in the YouTube page and streams its output. Every run gets an id,
 * shown in the output and logged, so a run can be traced later.
 */
export function runScript(code: string, onLine: (line: RunLine) => void): Promise<void> {
	const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	if (IS_IN_EXTENSION_SETTINGS_PAGE) {
		onLine({ kind: "note", text: `Run ${runId}: run works on a YouTube tab. Open it there.` });
		return Promise.resolve();
	}

	onLine({ kind: "note", text: `Run ${runId} started` });
	logger.info("run", "started", runId);

	return new Promise((resolve) => {
		let timer = 0;

		const finish = () => {
			clearTimeout(timer);
			window.removeEventListener(RUN_EVENT, listener);
			logger.info("run", "finished", runId);
			resolve();
		};

		const armTimeout = () => {
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				onLine({ kind: "note", text: `Run ${runId}: no result. It was blocked or never finished.` });
				logger.warn("run", "timed out", runId);
				finish();
			}, QUIET_TIMEOUT_MS);
		};

		const listener = (event: Event) => {
			const message = readRunEvent((event as CustomEvent<string>).detail, runId);
			if (!message) return;
			if (message.kind === "done") {
				finish();
				return;
			}
			onLine(message);
			armTimeout();
		};

		window.addEventListener(RUN_EVENT, listener);
		armTimeout();
		executeScriptString({
			scriptContent: wrapRunScript(code, runId),
			shouldSanitize: true,
			sourceIdentifier: "StyleShift run",
		});
	});
}
