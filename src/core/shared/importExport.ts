import { loadJSZip, jszipInstance as jszip, saveAndRefreshAll } from "@core/runtime/controller";
import { initializeRequiredStorageStructures as setNullSave } from "@core/storage/maintenance";
import { ALLOWED_STORAGE_KEYS, cachedStorageData as savedData } from "@core/storage/manager";
import { fromPersistedCategory, toPersistedCategory } from "@core/theme/exportConverter";
import type {
	PersistedCategory,
	PersistedCurrentSettings,
	PersistedSetting,
	PersistedStyleShiftData,
} from "@settings/types/persistedSettings";
import { assertCanonicalPersistedItems, assertNoLegacyPersistedFields } from "@settings/types/persistedSettings";
import { logger } from "@shared/logger";

import { createError, createNotification, createWarning } from "./notifications";
import { deepClone, sleep } from "./utilities";

/**
 * Imports StyleShift data from an object and updates the cached storage.
 * Shows a progress notification during the process.
 *
 * @param {object} styleshiftData - The object containing StyleShift configuration data.
 * @returns {Promise<void>}
 *
 * @example
 * await importStyleShiftData(myConfigObject);
 */
export async function importStyleShiftData(styleshiftData: PersistedStyleShiftData) {
	const notification = await createNotification({
		icon: "sync",
		title: "StyleShift - Importing data",
		content: "Please wait...",
		timeout: -1,
	});

	try {
		assertNoLegacyPersistedFields(styleshiftData);
		const addOnItems = styleshiftData.addOnStyleShiftItems;
		if (addOnItems !== undefined) assertCanonicalPersistedItems(addOnItems);
		for (const thisKey of ALLOWED_STORAGE_KEYS) {
			const value = styleshiftData[thisKey as keyof PersistedStyleShiftData];
			savedData[thisKey] =
				thisKey === "addOnStyleShiftItems" && Array.isArray(value) ? value.map(fromPersistedCategory) : value;
		}

		await setNullSave();
		saveAndRefreshAll();

		notification.setIcon("check_circle");
		notification.setTitle("StyleShift - Imported data");
		notification.setContent("Imported successfully!");

		await sleep(3000);

		notification.close();
	} catch (error) {
		notification.close();

		createError(error).then((notification: any) => {
			notification.setTitle("StyleShift - Import Failed");
		});
	}
}

/**
 * Exports current add-on items and settings into a data object.
 * Cleans up internal properties (like highlightColor, editable) before exporting.
 *
 * @returns {any} The cleaned export data object.
 *
 * @example
 * const data = exportStyleShiftData();
 * console.log(JSON.stringify(data));
 */
export function exportStyleShiftData(): PersistedStyleShiftData {
	const exportData: PersistedStyleShiftData = {};

	for (const thisKey of ALLOWED_STORAGE_KEYS) {
		if (savedData[thisKey]) {
			if (thisKey === "addOnStyleShiftItems") {
				exportData.addOnStyleShiftItems = savedData[thisKey].map(toPersistedCategory);
			} else {
				exportData.currentSettings = deepClone(savedData[thisKey]) as PersistedCurrentSettings;
			}
		}
	}

	const addOnItems = exportData["addOnStyleShiftItems"];

	if (addOnItems) {
		for (const thisCategory of addOnItems) {
			delete (thisCategory as Record<string, unknown>).highlightColor;
			delete (thisCategory as Record<string, unknown>).editable;

			for (const thisSetting of thisCategory.settings) {
				delete thisSetting.editable;
			}
		}
	} else {
		createWarning("No add-on items found. Skipping...");
	}

	return exportData;
}

/**
 * Imports StyleShift data from a JSON formatted string.
 *
 * @param {string} text - The JSON string to parse and import.
 * @returns {Promise<void>}
 *
 * @example
 * await importStyleShiftJsonText('{"currentSettings": {}}');
 */
export async function importStyleShiftJsonText(text: string) {
	await importStyleShiftData(JSON.parse(text) as PersistedStyleShiftData);
}

/**
 * Exports StyleShift data as a prettified JSON string.
 *
 * @returns {string} The JSON string representation of the exported data.
 *
 * @example
 * const jsonText = exportStyleShiftJsonText();
 */
export function exportStyleShiftJsonText() {
	return JSON.stringify(exportStyleShiftData(), null, 2);
}

/**
 * Parses a StyleShift backup ZIP file into a structured data object.
 * This function extracts categories, settings, and property files from the ZIP.
 *
 * @param {File | Blob} zipFile - The ZIP file to parse.
 * @returns {Promise<any>} A promise resolving to the parsed StyleShift data object.
 * @throws {Error} If JSZip is not loaded or the ZIP structure is invalid.
 *
 * @example
 * const data = await parseStyleShiftZip(myZipBlob);
 */
export async function parseStyleShiftZip(zipFile: File | Blob): Promise<PersistedStyleShiftData> {
	await loadJSZip();
	if (!jszip) {
		throw new Error("JSZip not loaded!");
	}
	const zip = new (jszip as any)();

	const loadedZip = await zip.loadAsync(zipFile, {
		createFolders: true,
	});

	let addOnStyleShiftItems: PersistedCategory[] = [];
	let currentSettings: PersistedCurrentSettings | null = null;

	const settingsFile = loadedZip.file("currentSettings.json");
	if (settingsFile) {
		currentSettings = JSON.parse(await settingsFile.async("string")) as PersistedCurrentSettings;
	}

	let itemsBasePath = "";
	if (Object.keys(loadedZip.files).some((f) => f.startsWith("addOnStyleShiftItems/"))) {
		itemsBasePath = "addOnStyleShiftItems/";
	}

	const categoryFolders: string[] = [];
	const categoriesOrderFile = loadedZip.file(`${itemsBasePath}order.json`);

	if (categoriesOrderFile) {
		const order = JSON.parse(await categoriesOrderFile.async("string")) as string[];
		for (const name of order) {
			const path = `${itemsBasePath}${name}/`;
			if (loadedZip.files[path]) {
				categoryFolders.push(path);
			}
		}
	} else {
		const folders = Object.keys(loadedZip.files).filter((path) => {
			const pathArray = path.split("/");
			const depth = itemsBasePath ? 2 : 1;
			return path.startsWith(itemsBasePath) && pathArray.length === depth + 1 && pathArray[depth] === "";
		});
		categoryFolders.push(...folders.sort());
	}

	for (let i = 0; i < categoryFolders.length; i++) {
		const categoryPath = categoryFolders[i];
		const categoryPathName = categoryPath.slice(0, -1);

		const categoryFolderBaseName = categoryPathName.split("/").pop() || "";
		let categoryIndex = i;
		if (categoryFolderBaseName.includes(" - ")) {
			const indexPart = parseInt(categoryFolderBaseName.split(" - ")[0]);
			if (!isNaN(indexPart)) categoryIndex = indexPart;
		}

		const categoryConfig = loadedZip.file(`${categoryPathName}/config.json`);

		if (!categoryConfig) continue;

		const categoryData = JSON.parse(await categoryConfig.async("string")) as PersistedCategory;
		const settings: PersistedSetting[] = [];

		const settingFolders: string[] = [];
		const settingsOrderFile = loadedZip.file(`${categoryPathName}/order.json`);

		if (settingsOrderFile) {
			const order = JSON.parse(await settingsOrderFile.async("string")) as string[];
			for (const name of order) {
				const path = `${categoryPathName}/${name}/`;
				if (loadedZip.files[path]) {
					settingFolders.push(path);
				}
			}
		} else {
			const folders = Object.keys(loadedZip.files).filter((path) => {
				const pathArray = path.split("/");
				const depth = categoryPathName.split("/").length;
				return path.startsWith(`${categoryPathName}/`) && pathArray.length === depth + 2 && pathArray[depth + 1] === "";
			});
			settingFolders.push(...folders.sort());
		}

		for (let j = 0; j < settingFolders.length; j++) {
			const settingPath = settingFolders[j];
			const settingPathName = settingPath.slice(0, -1);

			const settingFolderBaseName = settingPathName.split("/").pop() || "";
			let settingIndex = j;
			if (settingFolderBaseName.includes(" - ")) {
				const indexPart = parseInt(settingFolderBaseName.split(" - ")[0]);
				if (!isNaN(indexPart)) settingIndex = indexPart;
			}

			const settingConfig = loadedZip.file(`${settingPathName}/config.json`);
			if (!settingConfig) continue;

			const settingData = (JSON.parse(await settingConfig.async("string")) || {}) as PersistedSetting;

			for (const filePath of Object.keys(loadedZip.files)) {
				const isPropertyFile =
					filePath.startsWith(settingPath) &&
					!filePath.endsWith("/") &&
					!filePath.toLowerCase().endsWith("/config.json") &&
					!filePath.toLowerCase().endsWith("/order.json");

				if (isPropertyFile) {
					const fileName = filePath.split("/").pop() || "";
					const propertyName = fileName.slice(0, fileName.lastIndexOf("."));
					settingData[propertyName] = await loadedZip.file(filePath).async("string");
				}
			}

			settings[settingIndex] = settingData;
		}

		categoryData["settings"] = settings.filter((s) => s !== null);
		assertNoLegacyPersistedFields(categoryData);
		addOnStyleShiftItems[categoryIndex] = categoryData;
	}

	const styleshiftData: PersistedStyleShiftData = {
		addOnStyleShiftItems: addOnStyleShiftItems.filter((c) => c !== null),
	};

	if (currentSettings) {
		styleshiftData.currentSettings = currentSettings;
	}

	return styleshiftData;
}

/**
 * Imports StyleShift data from a backup ZIP file and applies it to the extension immediately.
 *
 * @param {File | Blob} zipFile - The backup ZIP file.
 * @returns {Promise<void>}
 *
 * @example
 * await importStyleShiftZip(myZipFile);
 */
export async function importStyleShiftZip(zipFile: File | Blob) {
	const styleshiftData = await parseStyleShiftZip(zipFile);
	logger.info("extension", "Importing StyleShift ZIP Data", styleshiftData);
	await importStyleShiftData(styleshiftData);
}
