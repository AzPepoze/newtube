import { getDocumentBody } from "@core/shared/domHelpers";
import { logger } from "@shared/logger";
import { applyThemeToElement } from "@ui/themes/theme";
import { showUserConfirmation } from "@ui/window/windowFactory";
import { mount, unmount } from "svelte";
import { closeMainSettingsPanel } from "./tutorialNavigation";
import TutorialOverlay from "./TutorialOverlay.svelte";

let activeInstance: ReturnType<typeof mount> | null = null;
let activeWrapper: HTMLElement | null = null;

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function openTutorialOverlay(): Promise<void> {
	if (activeInstance) return;

	const confirmed = await showUserConfirmation("Do you want to start the tutorial?", "StyleShift Tutorial", {
		confirmLabel: "Start Tutorial",
		cancelLabel: "Cancel",
	});

	if (!confirmed) return;

	await closeMainSettingsPanel();
	await wait(180);

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
