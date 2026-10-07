import { getDocumentBody } from "@core/shared/domHelpers";
import { logger } from "@shared/logger";
import { applyThemeToElement } from "@ui/themes/theme";
import { mount, unmount } from "svelte";
import TutorialOverlay from "./TutorialOverlay.svelte";

let activeInstance: ReturnType<typeof mount> | null = null;
let activeWrapper: HTMLElement | null = null;

/** Mounts the full-screen tutorial overlay, themed to match the current light/dark setting. */
export async function openTutorialOverlay(): Promise<void> {
	if (activeInstance) return;

	const wrapper = document.createElement("div");
	wrapper.className = "styleshift-main";
	await applyThemeToElement(wrapper);
	(await getDocumentBody()).appendChild(wrapper);

	activeWrapper = wrapper;
	activeInstance = mount(TutorialOverlay, {
		target: wrapper,
		props: { onClose: closeTutorialOverlay },
	});
}

function closeTutorialOverlay() {
	if (!activeInstance) return;
	const instance = activeInstance;
	activeInstance = null;
	unmount(instance);
	activeWrapper?.remove();
	activeWrapper = null;
	logger.debug("tutorial", "Tutorial overlay closed");
}
