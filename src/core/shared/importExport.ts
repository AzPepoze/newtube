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

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonWithContext<T>(text: string, sourceName: string): T {
	try {
		return JSON.parse(text) as T;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`"${sourceName}" is not valid JSON: ${reason}`);
	}
}

async function readOrderFile(loadedZip: any, path: string): Promise<string[] | null> {
	const orderFile = loadedZip.file(path);
	if (!orderFile) return null;

	const order = parseJsonWithContext<unknown>(await orderFile.async("string"), path);
	if (!Array.isArray(order) || order.some((entry) => typeof entry !== "string")) {
		throw new Error(`"${path}" must be an array of names.`);
	}
	return order;
}

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
		if (!isPlainObject(styleshiftData)) {
			throw new Error("Import data must be an object with currentSettings and/or addOnStyleShiftItems.");
		}

		assertNoLegacyPersistedFields(styleshiftData);
		const addOnItems = styleshiftData.addOnStyleShiftItems;
		if (addOnItems !== undefined) {
			if (!Array.isArray(addOnItems)) {
				throw new Error("addOnStyleShiftItems must be an array of categories.");
			}
			assertCanonicalPersistedItems(addOnItems);
		}
		const currentSettings = styleshiftData.currentSettings;
		if (currentSettings !== undefined && !isPlainObject(currentSettings)) {
			throw new Error("currentSettings must be an object of setting values.");
		}
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

	const archiveName = (zipFile as File)?.name || "archive.zip";
	let loadedZip: any;
	try {
		loadedZip = await zip.loadAsync(zipFile, {
			createFolders: true,
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`Could not read "${archiveName}" as a ZIP file: ${reason}`);
	}

	const fileNames = Object.keys(loadedZip.files);

	let addOnStyleShiftItems: PersistedCategory[] = [];
	let currentSettings: PersistedCurrentSettings | null = null;

	const settingsFile = loadedZip.file("currentSettings.json");
	if (settingsFile) {
		const parsed = parseJsonWithContext<unknown>(await settingsFile.async("string"), "currentSettings.json");
		if (!isPlainObject(parsed)) {
			throw new Error('"currentSettings.json" must contain an object of setting values.');
		}
		currentSettings = parsed as PersistedCurrentSettings;
	}

	let itemsBasePath = "";
	if (fileNames.some((f) => f.startsWith("addOnStyleShiftItems/"))) {
		itemsBasePath = "addOnStyleShiftItems/";
	}

	const categoryFolders: string[] = [];
	const orderedCategories = await readOrderFile(loadedZip, `${itemsBasePath}order.json`);

	if (orderedCategories) {
		for (const name of orderedCategories) {
			const path = `${itemsBasePath}${name}/`;
			if (loadedZip.files[path]) {
				categoryFolders.push(path);
			}
		}
	} else {
		const folders = fileNames.filter((path) => {
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

		const parsedCategory = parseJsonWithContext<unknown>(
			await categoryConfig.async("string"),
			`${categoryPathName}/config.json`,
		);
		if (!isPlainObject(parsedCategory)) {
			throw new Error(`"${categoryPathName}/config.json" must contain a category object.`);
		}
		const categoryData = parsedCategory as PersistedCategory;
		const settings: PersistedSetting[] = [];

		const settingFolders: string[] = [];
		const orderedSettings = await readOrderFile(loadedZip, `${categoryPathName}/order.json`);

		if (orderedSettings) {
			for (const name of orderedSettings) {
				const path = `${categoryPathName}/${name}/`;
				if (loadedZip.files[path]) {
					settingFolders.push(path);
				}
			}
		} else {
			const folders = fileNames.filter((path) => {
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

			const parsedSetting = parseJsonWithContext<unknown>(
				await settingConfig.async("string"),
				`${settingPathName}/config.json`,
			);
			if (!isPlainObject(parsedSetting)) {
				throw new Error(`"${settingPathName}/config.json" must contain a setting object.`);
			}
			const settingData = parsedSetting as PersistedSetting;

			for (const filePath of fileNames) {
				const isPropertyFile =
					filePath.startsWith(settingPath) &&
					!filePath.endsWith("/") &&
					!filePath.toLowerCase().endsWith("/config.json") &&
					!filePath.toLowerCase().endsWith("/order.json");

				if (!isPropertyFile) continue;

				const fileName = filePath.split("/").pop() || "";
				const propertyName = fileName.slice(0, fileName.lastIndexOf("."));
				const propertyFile = loadedZip.file(filePath);
				if (!propertyName || !propertyFile) continue;
				settingData[propertyName] = await propertyFile.async("string");
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

	if (!currentSettings && styleshiftData.addOnStyleShiftItems.length === 0) {
		throw new Error(
			`"${archiveName}" is not a NewTube theme archive: no currentSettings.json or addOnStyleShiftItems were found.`,
		);
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
