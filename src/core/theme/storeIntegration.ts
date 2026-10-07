import { sleep } from "@/core/shared/utilities";
import { createNotification } from "@core/shared/notifications";
import {
	fetchThemeFromApi,
	installTheme,
	isThemeInstalled,
	saveTheme,
	checkAndUpdateTheme as themeManagerCheckAndUpdate,
	validateOrigin,
} from "@core/theme/manager";
import { ThemeStoreEvent } from "@core/theme/events";
import { postReplyToStore } from "@core/theme/storeProtocol";
import { logger } from "@shared/logger";

async function handleInstallRequest(e: Event): Promise<void> {
	const detail = (e as CustomEvent).detail;
	if (!detail?.themeId || !detail?.targetDomains) {
		logger.warn("themeStore", `${ThemeStoreEvent.INSTALL}: Missing required parameters`);
		return;
	}

	logger.info("themeStore", `Install event received: ${detail.themeId} to domains: ${detail.targetDomains.join(", ")}`);
	const success = await installTheme(detail.themeId, detail.themeName || detail.themeId, detail.targetDomains);

	if (success) {
		createNotification({
			icon: "check_circle",
			title: "Theme Installed",
			content: `${detail.themeName || "Theme"} installed to ${detail.targetDomains.length} site(s).`,
		});
	}

	postReplyToStore(ThemeStoreEvent.INSTALL_STATUS, { themeId: detail.themeId, isInstalled: success });
}

async function handleSaveRequest(e: Event): Promise<void> {
	const detail = (e as CustomEvent).detail;
	if (!detail?.themeId || !detail?.targetDomain) {
		logger.warn("themeStore", `${ThemeStoreEvent.SAVE}: Missing required parameters`);
		return;
	}

	logger.info("themeStore", `Save event received for theme: ${detail.themeId} to domain: ${detail.targetDomain}`);

	const themeData = await fetchThemeFromApi(detail.themeId);
	if (!themeData) {
		logger.error("themeStore", `Failed to fetch theme data for save: ${detail.themeId}`);
		return;
	}

	const success = await saveTheme(detail.themeName || themeData.themeName, themeData, detail.targetDomain);

	if (success) {
		createNotification({
			icon: "save",
			title: "Theme Saved",
			content: `"${detail.themeName || themeData.themeName}" saved to collection.`,
		});
	}
}

async function handleCheckInstallRequest(e: Event): Promise<void> {
	const detail = (e as CustomEvent).detail;
	if (!detail?.themeId || !detail?.targetDomain) {
		logger.warn("themeStore", `${ThemeStoreEvent.CHECK_INSTALL}: Missing required parameters`);
		return;
	}

	logger.info("themeStore", `Check install event: ${detail.themeId} in domain: ${detail.targetDomain}`);
	const isInstalled = await isThemeInstalled(detail.themeId, detail.targetDomain);

	postReplyToStore(ThemeStoreEvent.INSTALL_STATUS, { themeId: detail.themeId, isInstalled });
}

export async function initWebsiteIntegration(): Promise<void> {
	if (!validateOrigin(window.location.origin)) {
		logger.warn("themeStore", `Rejecting theme events from unauthorized origin: ${window.location.origin}`);
		return;
	}

	logger.info("themeStore", `Website integration initialized for origin: ${window.location.origin}`);

	window.addEventListener(ThemeStoreEvent.INSTALL, handleInstallRequest);
	window.addEventListener(ThemeStoreEvent.SAVE, handleSaveRequest);
	window.addEventListener(ThemeStoreEvent.CHECK_INSTALL, handleCheckInstallRequest);

	window.addEventListener(ThemeStoreEvent.CHECK_EXTENSION, () => {
		postReplyToStore(ThemeStoreEvent.READY);
	});

	for (let i = 0; i < 10; i++) {
		postReplyToStore(ThemeStoreEvent.READY);
		await sleep(100);
	}

	logger.info("themeStore", "Website integration ready");
}

export async function checkAndUpdateTheme(manual: boolean = false, targetDomain?: string): Promise<void> {
	await themeManagerCheckAndUpdate(manual, targetDomain);
}

import { showThemeManager } from "@ui/themes/themeManagerService";

export function openThemeStore() {
	showThemeManager("store");
}
