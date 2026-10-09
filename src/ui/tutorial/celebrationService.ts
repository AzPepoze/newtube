import { getDocumentBody } from "@core/shared/domHelpers";
import { alertPrompt } from "@core/shared/dialogs";
import { logger } from "@shared/logger";
import { mount, unmount } from "svelte";
import ConfettiOverlay from "./tour/ConfettiOverlay.svelte";
import { resolveCelebrationOptions, type CelebrationOptions } from "./tour/celebrationOptions";

let activeInstance: ReturnType<typeof mount> | null = null;
let activeHost: HTMLElement | null = null;

function closeConfetti() {
	if (!activeInstance) return;
	const instance = activeInstance;
	activeInstance = null;
	unmount(instance);
	activeHost?.remove();
	activeHost = null;
}

/** Stops a running celebration, e.g. endless snow that never ends on its own. */
export function stopCelebration(): void {
	closeConfetti();
	logger.debug("tutorial", "Celebration stopped");
}

/** Fires confetti behind the shared single-button Yay prompt. */
export async function playCelebration(options: CelebrationOptions = {}): Promise<void> {
	if (activeInstance) return;
	const text = resolveCelebrationOptions(options);

	const host = document.createElement("div");
	(await getDocumentBody()).appendChild(host);

	activeHost = host;
	let resolveConfettiDone: (() => void) | null = null;
	const confettiDone = new Promise<void>((resolve) => {
		resolveConfettiDone = resolve;
	});
	activeInstance = mount(ConfettiOverlay, {
		target: host,
		intro: true,
		props: { mode: text.mode, onDone: () => resolveConfettiDone?.() },
	});

	try {
		await alertPrompt({ title: text.title, message: text.message, okLabel: text.yayLabel, okColor: text.accent });
		// Let the cannons play out instead of vanishing with the dialog.
		await confettiDone;
	} finally {
		await new Promise((resolve) => setTimeout(resolve, 400));
		closeConfetti();
		logger.debug("tutorial", "Celebration closed");
	}
}
