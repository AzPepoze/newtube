import { getRootValue } from "@core/storage/manager";
import { importPresetToSettings } from "@core/theme/importer";
import { applyTheme as applyThemeManager, saveTheme as saveThemeManager, type Theme } from "@core/theme/manager";
import { settingsUi } from "@ui/settings/settingsApi";
import { createStyleShiftWindow } from "@ui/window/windowFactory";
import { mount, unmount } from "svelte";
import LivePreviewBar from "./views/LivePreviewBar.svelte";
import ThemeManager from "./views/ThemeManager.svelte";

interface ActiveThemeWindow {
	windowInstance: any;
	setTab?: (tab: "installed" | "store") => void;
}

let activeThemeWindowInstance: ActiveThemeWindow | null = null;

export function isThemeManagerOpen(): boolean {
	return activeThemeWindowInstance !== null;
}

/**
 * Opens the modern Theme Collection window.
 */
export async function showThemeManager(tab: "installed" | "store" = "installed") {
	if (activeThemeWindowInstance) {
		activeThemeWindowInstance.setTab?.(tab);
		return;
	}

	const themeWindow = await createStyleShiftWindow({
		title: "Theme Manager",
		width: "80%",
		height: "85%",
		center: true,
		onWindowClosed: () => {
			activeThemeWindowInstance = null;
		},
	});

	const activeState: ActiveThemeWindow = {
		windowInstance: themeWindow,
	};
	activeThemeWindowInstance = activeState;

	// Style adjustments for the container to work better with grid
	themeWindow.contentElement.style.padding = "20px";
	themeWindow.contentElement.style.overflowY = "auto";

	settingsUi.renderComponent(
		ThemeManager,
		{
			closeWindow: themeWindow.closeWindowHandler,
			initialTab: tab,
			onRegisterSetTab: (setTabFn: (t: "installed" | "store") => void) => {
				activeState.setTab = setTabFn;
			},
		},
		themeWindow.contentElement,
	);
}

/**
 * Starts a non-persistent live preview mode on YouTube with a bottom cancel/keep bar.
 */
export async function startLivePreviewMode(theme: Theme, isStoreItem = false, closeCurrentWindow?: () => void) {
	const backupSettings = JSON.parse(JSON.stringify((await getRootValue("currentSettings")) || {}));
	const originalActiveTheme = await getRootValue("activeTheme");
	const targetSettings = theme.currentSettings || (theme as any).settings || {};
	const themeName = theme.themeName || "Preview Theme";

	// Close existing window if active
	if (closeCurrentWindow) {
		closeCurrentWindow();
	} else if (activeThemeWindowInstance?.windowInstance?.closeWindowHandler) {
		activeThemeWindowInstance.windowInstance.closeWindowHandler();
	}

	// Apply settings live without persisting to storage
	await importPresetToSettings(targetSettings, false, themeName);

	// Mount top-level floating live preview bar directly to body
	const mountPoint = document.createElement("div");
	mountPoint.className = "styleshift-live-preview-bar-mount";
	document.body.appendChild(mountPoint);

	let barInstance: any;

	const cleanup = () => {
		if (barInstance) unmount(barInstance);
		mountPoint.remove();
	};

	const handleCancel = async () => {
		cleanup();
		// Restore previous settings without saving
		await importPresetToSettings(backupSettings, false, originalActiveTheme || "Previous Settings");
		// Re-open theme manager window
		await showThemeManager();
	};

	const handleKeep = async () => {
		cleanup();
		if (isStoreItem && theme.themeId) {
			await saveThemeManager(themeName, theme, "EXTENSION", theme.themeId);
		}
		await applyThemeManager(theme.themeId || "custom", themeName, "EXTENSION");
	};

	barInstance = mount(LivePreviewBar, {
		target: mountPoint,
		props: {
			themeName,
			onCancel: handleCancel,
			onKeep: handleKeep,
		},
	});
}

import ThemePreviewOverlay from "./views/ThemePreviewOverlay.svelte";

/**
 * Mounts ThemePreviewOverlay directly to document.body at top level outside any window container.
 */
export function openThemePreviewOverlay({
	theme,
	isStoreItem = false,
	isInstalled = false,
	onApply,
	onApplyLivePreview,
	onSave,
}: {
	theme: Theme;
	isStoreItem?: boolean;
	isInstalled?: boolean;
	onApply: (theme: Theme) => void;
	onApplyLivePreview: (theme: Theme) => void;
	onSave?: (theme: Theme) => void;
}) {
	const mountPoint = document.createElement("div");
	mountPoint.className = "styleshift-theme-preview-overlay-mount";
	document.body.appendChild(mountPoint);

	let instance: any;
	let pendingCloseAction: (() => void | Promise<void>) | null = null;
	let isCleanedUp = false;

	const cleanup = () => {
		if (isCleanedUp) return;
		isCleanedUp = true;
		if (instance) unmount(instance, { outro: true });
		mountPoint.remove();
	};

	const closeOverlay = (afterClose?: () => void | Promise<void>) => {
		pendingCloseAction = afterClose || null;
		if (instance?.close) instance.close();
		else {
			cleanup();
			pendingCloseAction?.();
			pendingCloseAction = null;
		}
	};

	instance = mount(ThemePreviewOverlay, {
		target: mountPoint,
		intro: true,
		props: {
			theme,
			isStoreItem,
			isInstalled,
			isOpen: true,
			onClose: () => {},
			onCloseEnd: () => {
				const action = pendingCloseAction;
				pendingCloseAction = null;
				cleanup();
				action?.();
			},
			onApply: (t: Theme) => {
				closeOverlay(() => onApply(t));
			},
			onApplyLivePreview: (t: Theme) => {
				closeOverlay(() => onApplyLivePreview(t));
			},
			onSave: onSave
				? (t: Theme) => {
						onSave(t);
					}
				: undefined,
		},
	});
}
