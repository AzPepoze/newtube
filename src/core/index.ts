import { createError, createNotification } from "@core/shared/notifications";
import { appBootstrap, shouldEnableExtension } from "@extensions/youtube";
import {
	attachBehaviorToSetting,
	initializeAllActiveSettings,
	reactivateAllSettings,
	registerSettingListener,
} from "@settings/engine/functions";
import { getAllStyleShiftItems, getAllStyleShiftSettings, updateStyleShiftItems } from "@settings/registry/items";
import { createStylesheetHolder, injectMaterialIconsStyles } from "@settings/stylesheet/styleSheet";
import { type Category } from "@settings/types/styleshiftTypes";
import { logger } from "@shared/logger";
import { toggleCustomize } from "@ui/highlight/highlight";
import { syncAllThemes } from "@ui/themes/theme";
import { extensionSettingsUi, extensionSettingsUiPromise } from "@ui/window/extensionSettings";
import { updateAllUiComponents } from "@ui/window/windowFactory";
import "./communication/extension";
import { synchronizeAvailableFunctions } from "./runtime/controller";
import { getDocumentBody, getDocumentHead, rearrangeSelector } from "./shared/domHelpers";
import { disableExtension, enableExtension, toggleDeveloperMode } from "./shared/extensionHelpers";
import { sleep } from "./shared/utilities";
import { checkAndShowUpdateNotification } from "./shared/versionUpdate";
import {
	initializeDefaultAddOnItems,
	performStorageGarbageCollection,
	populateMissingDefaultSettings,
	seedBundledPresets,
} from "./storage/maintenance";
import { getRootValue, initializeStorageConnection, persistCachedDataToStorage } from "./storage/manager";
import {
	EXTENSION_BASE_URL,
	IS_FIREFOX,
	IS_IN_EXTENSION_SETTINGS_PAGE,
	IS_SANDBOX,
	currentContextDomain,
} from "./shared/context";
export { EXTENSION_BASE_URL, IS_FIREFOX, IS_IN_EXTENSION_SETTINGS_PAGE, IS_SANDBOX, currentContextDomain };

export const EXTENSION_VERSION = chrome.runtime.getManifest().version;
export let isExtensionReady = false;

export const styleshiftContainer: HTMLElement = document.createElement("div");
styleshiftContainer.className = "StyleShift-Station";
styleshiftContainer.style.display = "none";

export async function refreshExtensionState(): Promise<void> {
	logger.info("lifecycle", "Refreshing extension state...");
	synchronizeAvailableFunctions();
	await updateStyleShiftItems();
	await updateAllUiComponents();
}

async function injectPageScripts(): Promise<void> {
	if (IS_IN_EXTENSION_SETTINGS_PAGE) return;
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("build-in.js");
	(await getDocumentHead()).appendChild(script);
}

async function initializeSettings(): Promise<void> {
	const allSettings = await getAllStyleShiftSettings();
	for (const setting of allSettings) {
		if (setting.id !== "Themes") {
			attachBehaviorToSetting(setting);
		}
	}
	initializeAllActiveSettings();
}

function normalizeSelectors(): void {
	const items = getAllStyleShiftItems();
	for (const item of items) {
		const category = item as Category;
		if (category.selector) {
			category.selector = rearrangeSelector(category.selector);
		}
	}
}

async function bootstrapExtension(): Promise<void> {
	await initializeStorageConnection();
	await initializeDefaultAddOnItems();

	if (IS_SANDBOX) {
		// Dynamic import: keeps the sandbox code out of the normal startup path and avoids a static import cycle.
		const { startSandbox } = await import("@extensions/youtube/features/diagnostics/sandbox/sandboxPage");
		await startSandbox();
	}

	if (!shouldEnableExtension()) {
		logger.info("lifecycle", "StyleShift extension logic skipped on this domain (Core active).");
		await getDocumentHead();
		await createStylesheetHolder();
		await injectMaterialIconsStyles();
		return;
	}

	await getDocumentHead();

	setTimeout(async () => {
		(await getDocumentBody()).append(styleshiftContainer);
	}, 1);

	await injectPageScripts();

	await synchronizeAvailableFunctions();
	await createStylesheetHolder();
	await injectMaterialIconsStyles();
	await updateStyleShiftItems();
	await populateMissingDefaultSettings();
	await seedBundledPresets();
	await checkAndShowUpdateNotification();

	registerSettingListener("EnableAppLightTheme", syncAllThemes, true);
	registerSettingListener("EnableSettingsBackgroundBlur", syncAllThemes, true);
	registerSettingListener("SettingsBackgroundBlurAmount", syncAllThemes, true);
	registerSettingListener(
		"developerMode",
		async (isDev) => {
			await createNotification({
				icon: isDev ? "mode_edit" : "edit_off",
				title: isDev ? "Developer Mode Enabled" : "Developer Mode Disabled",
				timeout: 3000,
			});
			updateAllUiComponents();
		},
		false,
	);

	await initializeSettings();
	await performStorageGarbageCollection();
	normalizeSelectors();

	await persistCachedDataToStorage();

	await extensionSettingsUiPromise;
	if (IS_IN_EXTENSION_SETTINGS_PAGE) {
		extensionSettingsUi.createUi();
	}

	isExtensionReady = true;
	logger.info("lifecycle", "StyleShift bootstrap complete.");

	document.addEventListener("visibilitychange", async () => {
		if (document.visibilityState === "visible") {
			logger.info("lifecycle", "Visibility changed to visible, reloading settings...");
			await initializeStorageConnection();
			await updateStyleShiftItems();
			await reactivateAllSettings();
			updateAllUiComponents();
		}
	});

	if (!IS_IN_EXTENSION_SETTINGS_PAGE) {
		appBootstrap();
	}
}

try {
	bootstrapExtension();
} catch (error) {
	createError(error).then((notification) => {
		notification.setTitle("StyleShift - Bootstrap Failure");
	});
}

chrome.runtime.onMessage.addListener(async (message) => {
	try {
		const isError = message.Command === "workerError" || message.error;
		logger[isError ? "error" : "info"]("lifecycle", "Incoming message:", message);

		switch (message) {
			case "toggle_enable":
				if (await getRootValue("enableExtension")) {
					disableExtension();
				} else {
					enableExtension();
				}
				break;
			case "toggle_dev_mode":
				await toggleDeveloperMode();
				break;
			case "toggle_customize":
				if (!IS_IN_EXTENSION_SETTINGS_PAGE) toggleCustomize();
				break;
			case "toggle_settings":
				if (!isExtensionReady) {
					const waitNotification = await createNotification({
						icon: "hourglass_empty",
						title: "StyleShift is initializing...",
						timeout: -1,
					});
					while (!isExtensionReady) await sleep(100);
					waitNotification.close();
				}
				await extensionSettingsUiPromise;
				extensionSettingsUi.toggle();
				break;
		}

		if (message.Command === "themeDataUpdated") {
			logger.info("lifecycle", "Theme update signal received, refreshing behaviors...");
			await initializeStorageConnection();
			await updateStyleShiftItems();
			await initializeSettings();
			updateAllUiComponents();
		}
	} catch (error) {
		createError(error);
	}
});
