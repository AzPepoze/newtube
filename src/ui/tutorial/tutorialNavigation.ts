import { logger } from "@shared/logger";
import { openApiReference } from "@ui/docs/apiReferenceService";
import { startCustomize, stopCustomize } from "@ui/highlight/highlight";
import { startQuickCustomize } from "@ui/highlight/quickCustomizeService";
import { closeSelectorPicker } from "@ui/highlight/selectorPicker";
import { scrollToSection } from "@ui/shared/scrollSpy";
import { closeThemeManager, showThemeManager } from "@ui/themes/themeManagerService";
import { extensionSettingsUiPromise } from "@ui/window/extensionSettings";
import { windowManager } from "@ui/window/windowManager.svelte";
import type { TutorialStep } from "./tutorialSteps";

const PANEL_SELECTOR = ".styleshift-settings-main";
const SCROLL_AREA_SELECTOR = ".styleshift-settings-main .sidebar-scroll-area";

function nextFrame() {
	return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export function cleanupTourModes() {
	try {
		stopCustomize();
	} catch (error) {
		logger.warn("tutorial", "Failed to stop customize mode", error);
	}

	try {
		closeSelectorPicker();
	} catch (error) {
		logger.warn("tutorial", "Failed to close selector picker", error);
	}

	try {
		closeThemeManager();
	} catch (error) {
		logger.warn("tutorial", "Failed to close theme manager", error);
	}
}

export function isPanelOpenAndVisible(): boolean {
	const panel = document.querySelector<HTMLElement>(PANEL_SELECTOR);
	if (!panel) return false;
	const win = panel.closest<HTMLElement>(".styleshift-window-container");
	if (!win) return false;
	if (win.classList.contains("minimized") || win.classList.contains("picking-mode")) {
		return false;
	}
	const style = window.getComputedStyle(win);
	return style.opacity !== "0" && style.display !== "none" && style.visibility !== "hidden";
}

export function restoreSettingsWindowIfMinimized(): boolean {
	const panel = document.querySelector<HTMLElement>(PANEL_SELECTOR);
	if (!panel) return false;
	const winContainer = panel.closest<HTMLElement>(".styleshift-window-container");
	if (winContainer && winContainer.classList.contains("minimized")) {
		const winId = winContainer.getAttribute("data-window-id");
		const minWin = windowManager.minimizedWindows.find((w) => w.id === winId);
		if (minWin) {
			minWin.restore();
			return true;
		}
	}
	return false;
}

export async function openPanelAt(category?: string) {
	const ui = await extensionSettingsUiPromise;
	const panel = document.querySelector<HTMLElement>(PANEL_SELECTOR);
	if (!panel) {
		await ui.createUi();
	} else if (!isPanelOpenAndVisible()) {
		restoreSettingsWindowIfMinimized();
	}

	if (!category) return;
	await nextFrame();
	await nextFrame();
	scrollToSection(document.querySelector<HTMLElement>(SCROLL_AREA_SELECTOR), "data-category", category);
}

export async function closeMainSettingsPanel() {
	const ui = await extensionSettingsUiPromise;
	if (document.querySelector(PANEL_SELECTOR)) {
		ui.removeUi();
	}
}

export async function runStepShow(step: TutorialStep, tabOverride?: "installed" | "store") {
	cleanupTourModes();

	if (step.show?.docs) {
		await openApiReference();
		return;
	}

	const targetThemeTab = tabOverride ?? step.show?.themeTab;
	if (targetThemeTab) {
		await showThemeManager(targetThemeTab);
		return;
	}

	if (step.show?.panelCategory !== undefined) {
		await openPanelAt(step.show.panelCategory);
		return;
	}

	if (step.show) {
		await openPanelAt();
	}
}

export async function runStepTry(step: TutorialStep, onBeforeLaunch?: () => void) {
	cleanupTourModes();
	onBeforeLaunch?.();

	if (step.try === "quickCustomize") {
		await startQuickCustomize();
	} else if (step.try === "customize") {
		await startCustomize();
	} else if (step.try === "themeManager") {
		await showThemeManager("installed");
	}
}
