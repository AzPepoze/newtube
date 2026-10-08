import { scrollToSection } from "@ui/shared/scrollSpy";
import { extensionSettingsUiPromise } from "@ui/window/extensionSettings";

const PANEL_SELECTOR = ".styleshift-settings-main";
const SCROLL_AREA_SELECTOR = ".styleshift-settings-main .sidebar-scroll-area";

function nextFrame() {
	return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/** Opens the StyleShift panel and scrolls to a section when one is given. */
export async function openPanelAt(category?: string) {
	const ui = await extensionSettingsUiPromise;
	if (!document.querySelector(PANEL_SELECTOR)) await ui.toggle();
	if (!category) return;
	await nextFrame();
	await nextFrame();
	scrollToSection(document.querySelector<HTMLElement>(SCROLL_AREA_SELECTOR), "data-category", category);
}
