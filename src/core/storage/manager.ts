import { sleep } from "@/core/shared/utilities";
import { createError } from "@core/shared/notifications";
import { getOptionalExternalStorageKeys } from "@extensions/youtube/index";
import { logger } from "@shared/logger";
import { currentContextDomain } from "../shared/context";

export let cachedStorageData: any = {};
let isStorageInitialized = false;
let isPersistenceSuppressed = false;

export function suppressStoragePersistence(suppress: boolean) {
	isPersistenceSuppressed = suppress;
	if (suppress) {
		logger.info("STORAGE", "Persistence suppressed (Preview Mode)");
	} else {
		logger.info("STORAGE", "Persistence restored");
	}
}

const INTERNAL_STORAGE_KEYS = [
	"currentSettings",
	"defaultStyleShiftItems",
	"addOnStyleShiftItems",
	"enableExtension",
	"enableRealtimeExtension",
	"developerMode",
];

const externalKeys = getOptionalExternalStorageKeys() || [];
export const EXTERNAL_STORAGE_KEYS = [...INTERNAL_STORAGE_KEYS, ...externalKeys];

export const ALLOWED_STORAGE_KEYS = ["currentSettings", "addOnStyleShiftItems"];

export async function initializeStorageConnection(): Promise<void> {
	logger.info("STORAGE", "Attempting to load data for domain:", currentContextDomain);

	const result = await chrome.storage.local.get(currentContextDomain);
	const domainData = result[currentContextDomain];

	if (domainData) {
		try {
			cachedStorageData = domainData;
			logger.info("STORAGE", "Data successfully loaded:", currentContextDomain);
		} catch (_error) {
			createError(`Failed to parse storage data for: <b>${currentContextDomain}</b>`);
			cachedStorageData = {};
		}
	} else {
		cachedStorageData = {};
	}
	isStorageInitialized = true;
}

async function ensureInitialized(): Promise<void> {
	while (!isStorageInitialized) {
		await sleep(50);
	}
}

export async function saveRootValue(key: string, value: any, delayPersistence = false): Promise<boolean> {
	await ensureInitialized();
	cachedStorageData[key] = value;
	logger.info("STORAGE", "Updating root key:", key, value);

	if (!delayPersistence) {
		return await persistCachedDataToStorage();
	}
	return true;
}

export async function saveUserSetting(settingId: string, value: any, delayPersistence = false): Promise<boolean> {
	await ensureInitialized();
	if (cachedStorageData["currentSettings"] == null) {
		cachedStorageData["currentSettings"] = {};
	}
	cachedStorageData["currentSettings"][settingId] = value;
	cachedStorageData["activeTheme"] = "custom";
	logger.info("STORAGE", "Updating user setting:", settingId, value);

	if (!delayPersistence) {
		return await persistCachedDataToStorage();
	}
	return true;
}

export async function saveToStorage(key: string, value: any, delayPersistence = false): Promise<boolean> {
	if (EXTERNAL_STORAGE_KEYS.includes(key)) {
		return await saveRootValue(key, value, delayPersistence);
	} else {
		return await saveUserSetting(key, value, delayPersistence);
	}
}

export async function saveAddOnStyleShiftItems(items: any[], delayPersistence = false): Promise<boolean> {
	return await saveRootValue("addOnStyleShiftItems", items, delayPersistence);
}

export async function persistCachedDataToStorage(): Promise<boolean> {
	if (!isStorageInitialized || isPersistenceSuppressed) return false;
	logger.info("STORAGE", "Persisting data to disk:", currentContextDomain);
	try {
		await chrome.storage.local.set({ [currentContextDomain]: cachedStorageData });
		return true;
	} catch (error) {
		logger.error("STORAGE", "Failed to save data:", error);
		createError("Could not save your changes. Check the console for details.");
		return false;
	}
}

export async function getRootValue(key?: string): Promise<any> {
	await ensureInitialized();
	return key == null ? cachedStorageData : cachedStorageData[key];
}

export async function getUserSetting(settingId: string): Promise<any> {
	await ensureInitialized();
	return cachedStorageData["currentSettings"]?.[settingId] ?? null;
}

export async function getFromStorage(key: string): Promise<any> {
	const settingValue = await getUserSetting(key);
	return settingValue !== null ? settingValue : await getRootValue(key);
}

export async function wipeAllExtensionStorage(): Promise<void> {
	await chrome.storage.local.clear();
}
