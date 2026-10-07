import { getRootValue, saveRootValue } from "@core/storage/manager";
import { STYLESHIFT_STORE_API_URL, STYLESHIFT_STORE_ORIGINS } from "@core/theme/config";
import { importPresetToSettings } from "@core/theme/importer";
import { normalizeStoreThemePayload } from "@core/theme/parser";
import { STORE_TARGET_SITES } from "@extensions/youtube/constants";
import { logger } from "@shared/logger";
import { showUserConfirmation } from "@ui/window/windowFactory";

export type Theme = {
	themeId: string;
	themeName: string;
	ownerId?: string;
	currentSettings?: { [key: string]: string };
	addOnStyleShiftItems?: any[];
	images?: string[];
	coverImage?: string;
	downloads?: number;
	rating?: number | null;
	ratingCount?: number;
};

function createThemeObject(id: string, name: string, data: any): Theme {
	return {
		themeId: id,
		themeName: name,
		currentSettings: data.currentSettings,
		addOnStyleShiftItems: data.addOnStyleShiftItems,
		images: data.images,
		coverImage: data.coverImage,
		ownerId: data.ownerId,
		downloads: data.downloads,
		rating: data.rating,
		ratingCount: data.ratingCount,
	};
}

async function confirmAction(message: string, title: string, cancelLog?: string): Promise<boolean> {
	const confirmed = await showUserConfirmation(message, title);
	if (!confirmed && cancelLog) {
		logger.info("themeManager", cancelLog);
	}
	return confirmed;
}

declare const IS_DEV: boolean;

export function validateOrigin(origin: string): boolean {
	const isLocalDev =
		(typeof IS_DEV !== "undefined" ? IS_DEV : false) &&
		(origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"));
	const isAllowed = isLocalDev || STYLESHIFT_STORE_ORIGINS.includes(origin);
	if (!isAllowed) {
		logger.warn("themeManager", `Unauthorized origin attempted theme operation: ${origin}`);
	}
	return isAllowed;
}

export function validateDomain(domain: string): boolean {
	if (domain === "EXTENSION") return true;

	const isValid = STORE_TARGET_SITES.includes(domain);
	if (!isValid) logger.warn("themeManager", `Invalid target domain: ${domain}`);
	return isValid;
}

export function validateDomains(domains: string[]): boolean {
	if (!Array.isArray(domains) || domains.length === 0) {
		logger.warn("themeManager", "Invalid domains: must be non-empty array");
		return false;
	}
	return domains.every(validateDomain);
}

// Apply theme to domain storage
export async function applyThemeToDomainStorage(
	domain: string,
	themeId: string,
	themeName: string,
	themeData: any,
): Promise<void> {
	const result = await chrome.storage.local.get(domain);
	const domainStorage = (result[domain] || {}) as Record<string, any>;

	const themes = (domainStorage.themes || []) as Theme[];
	const index = themes.findIndex((t) => t.themeId === themeId);
	const updatedTheme = createThemeObject(themeId, themeName, themeData);

	if (index > -1) themes[index] = updatedTheme;
	else themes.push(updatedTheme);

	domainStorage.themes = themes;
	domainStorage.activeTheme = themeId;

	if (themeData.currentSettings) {
		domainStorage.currentSettings = { ...domainStorage.currentSettings, ...themeData.currentSettings };
	}

	if (themeData.addOnStyleShiftItems) {
		domainStorage.addOnStyleShiftItems = themeData.addOnStyleShiftItems;
	}

	await chrome.storage.local.set({ [domain]: domainStorage });
	logger.info("themeManager", `Theme applied to domain: ${domain}`);
}

// Delete theme from storage
export async function deleteThemeFromStorage(themeId: string): Promise<void> {
	const themes = (await getRootValue("themes")) || [];
	if (!Array.isArray(themes)) {
		logger.warn("themeManager", "themes storage is not an array, resetting");
		await saveRootValue("themes", [], true);
		return;
	}

	const updatedThemes = themes.filter((t: Theme) => t.themeId !== themeId);
	await saveRootValue("themes", updatedThemes, true);
	logger.info("themeManager", `Theme removed from registry: ${themeId}`);
}

// Fetch theme from API
export async function fetchThemeFromApi(themeId: string): Promise<Theme | null> {
	try {
		const res = await fetch(`${STYLESHIFT_STORE_API_URL}/themes/${themeId}`);
		if (!res.ok) return null;

		const data = await res.json();
		if (!data?.settings) return null;

		const theme = normalizeStoreThemePayload(data, themeId);
		if (!theme.currentSettings) return null;

		return theme;
	} catch (error) {
		logger.error("themeManager", `Failed to fetch theme ${themeId} from API`, error);
		return null;
	}
}

// Save theme
export async function saveTheme(
	name: string,
	data: Theme,
	targetDomain: string,
	id?: string,
	activate = true,
): Promise<boolean> {
	if (!validateDomain(targetDomain)) return false;

	try {
		const themes = (await getRootValue("themes")) || [];
		const themeArray = Array.isArray(themes) ? themes : [];
		const themeId = id || name;
		const index = themeArray.findIndex((t: Theme) => t.themeId === themeId);

		if (index > -1) {
			if (!(await confirmAction(`Theme "${name}" already exists. Replace it?`, "Replace Theme"))) return false;
		} else if (
			!(await confirmAction(`Save as "${name}" to ${targetDomain}?`, "Save theme", `Theme save cancelled: ${name}`))
		) {
			return false;
		}

		const updatedTheme = createThemeObject(themeId, name, data);
		if (index > -1) themeArray[index] = updatedTheme;
		else themeArray.push(updatedTheme);

		await saveRootValue("themes", themeArray, true);
		if (activate) await saveRootValue("activeTheme", themeId);

		logger.info("themeManager", `Theme saved: ${name}`);
		return true;
	} catch (error) {
		logger.error("themeManager", "Failed to save theme", error);
		return false;
	}
}

// Apply theme
export async function applyTheme(id: string, name: string, targetDomain: string): Promise<boolean> {
	if (!validateDomain(targetDomain)) return false;

	if (!(await confirmAction(`Apply "${name}" to ${targetDomain}?`, "Apply Theme", `Theme apply cancelled: ${name}`))) {
		return false;
	}

	try {
		const themes = (await getRootValue("themes")) || [];
		const themeData = Array.isArray(themes) ? themes.find((t: Theme) => t.themeId === id) : null;

		if (!themeData) {
			logger.warn("themeManager", `Theme not found: ${id}`);
			return false;
		}

		await importPresetToSettings(themeData, true, name);
		logger.info("themeManager", `Theme applied: ${name}`);
		return true;
	} catch (error) {
		logger.error("themeManager", "Failed to apply theme", error);
		return false;
	}
}

// Update theme
export async function updateTheme(id: string, name: string, latestData: Theme, targetDomain: string): Promise<boolean> {
	if (!validateDomain(targetDomain)) return false;

	if (
		!(await confirmAction(`Update "${name}" to the latest version?`, "Update Theme", `Theme update cancelled: ${name}`))
	) {
		return false;
	}

	try {
		latestData.themeId = id;
		latestData.themeName = name;

		await importPresetToSettings(latestData, true, name);

		const themes = (await getRootValue("themes")) || [];
		if (Array.isArray(themes)) {
			const index = themes.findIndex((t: Theme) => t.themeId === id);
			if (index > -1) {
				themes[index] = latestData;
				await saveRootValue("themes", themes, true);
			}
		}

		logger.info("themeManager", `Theme updated: ${name}`);
		return true;
	} catch (error) {
		logger.error("themeManager", "Failed to update theme", error);
		return false;
	}
}

export async function recordThemeDownload(themeId: string): Promise<void> {
	try {
		await fetch(`${STYLESHIFT_STORE_API_URL}/themes/${themeId}/download`, { method: "POST" });
	} catch (error) {
		logger.error("themeManager", `Failed to record download for theme ${themeId}`, error);
	}
}

// Install theme
export async function installTheme(id: string, name: string, targetDomains: string[]): Promise<boolean> {
	if (!validateDomains(targetDomains)) return false;

	if (
		!(await confirmAction(
			`Install "${name}" to ${targetDomains.join(", ")}?`,
			"Install Theme",
			`Theme install cancelled: ${name}`,
		))
	) {
		return false;
	}

	try {
		const themeData = await fetchThemeFromApi(id);
		if (!themeData) {
			logger.error("themeManager", `Failed to fetch theme for install: ${id}`);
			return false;
		}

		await Promise.all(targetDomains.map((domain) => applyThemeToDomainStorage(domain, id, name, themeData)));
		logger.info("themeManager", `Theme installed to ${targetDomains.length} domain(s): ${name}`);
		void recordThemeDownload(id);
		return true;
	} catch (error) {
		logger.error("themeManager", "Failed to install theme", error);
		return false;
	}
}

// Delete theme
export async function deleteTheme(id: string, name: string, targetDomain: string): Promise<boolean> {
	if (!validateDomain(targetDomain)) return false;

	if (
		!(await confirmAction(`Delete "${name}" from ${targetDomain}?`, "Delete Theme", `Theme delete cancelled: ${name}`))
	) {
		return false;
	}

	try {
		await deleteThemeFromStorage(id);
		logger.info("themeManager", `Theme deleted: ${name}`);
		return true;
	} catch (error) {
		logger.error("themeManager", "Failed to delete theme", error);
		return false;
	}
}

// Check theme installed
export async function isThemeInstalled(id: string, targetDomain: string): Promise<boolean> {
	if (!validateDomain(targetDomain)) return false;

	try {
		const result = await chrome.storage.local.get(targetDomain);
		const domainStorage = (result[targetDomain] || {}) as Record<string, any>;
		const themes = domainStorage.themes || [];
		return Array.isArray(themes) && themes.some((t: Theme) => t.themeId === id);
	} catch (error) {
		logger.warn("themeManager", `Failed to check theme installation: ${id}`, error);
		return false;
	}
}

// Active theme data
async function getActivethemeData(_targetDomain: string) {
	const activeThemeId = await getRootValue("activeTheme");
	if (!activeThemeId || activeThemeId === "Previous Settings") return null;

	const themes = (await getRootValue("themes")) || [];
	if (!Array.isArray(themes)) return null;

	const themeData = themes.find((t: Theme) => t.themeId === activeThemeId);
	if (!themeData) return null;

	return {
		data: themeData,
		id: themeData.themeId,
		name: themeData.themeName || activeThemeId,
	};
}

// Update theme
export async function checkAndUpdateTheme(manual: boolean = false, targetDomain: string): Promise<void> {
	const autoUpdate = await getRootValue("AutoUpdateTheme");
	if (!manual && !autoUpdate) return;

	const theme = await getActivethemeData(targetDomain);
	if (!theme) {
		if (manual) logger.info("themeManager", "No custom theme active for update check");
		return;
	}

	try {
		const latestThemeData = await fetchThemeFromApi(theme.id);
		if (!latestThemeData) {
			if (manual) logger.warn("themeManager", "Could not reach update server");
			return;
		}

		await updateTheme(theme.id, theme.name, latestThemeData, targetDomain);
	} catch (error) {
		logger.error("themeManager", "Failed to check for theme updates", error);
	}
}
