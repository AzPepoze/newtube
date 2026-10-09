import { randomNumberInRange } from "@/core/shared/utilities";
import { refreshExtensionState } from "@core/index";
import { saveAndRefreshAll } from "@core/runtime/controller";
import { getRootValue, saveToStorage } from "@core/storage/manager";
import { getDefaultItems } from "@extensions/youtube/buildInItems";
import { getStyleShiftAddOnItems } from "@extensions/youtube/addOnItems";
import { getStyleShiftDefaultItems } from "@extensions/youtube/defaultItems";
import { attachBehaviorToSetting } from "@settings/engine/functions";
import { type Category, type Setting } from "@settings/types/styleshiftTypes";
import { logger } from "@shared/logger";
import { getCategoryLabel } from "./category";

const highlightColors = [`255, 109, 109`, `167, 242, 255`, `255, 167, 248`, `188, 167, 255`, `255, 241, 167`];

const styleshiftItems: { Default: (Category | { isHeader: boolean; label: string })[]; AddOn: Category[] } = {
	Default: [],
	AddOn: [],
};

export function getStyleShiftItems() {
	return styleshiftItems;
}

export function getAddOnItems() {
	return styleshiftItems.AddOn;
}

export function getBuiltInItems() {
	return styleshiftItems.Default;
}

export function getAddOnSettings() {
	return styleshiftItems.AddOn.map((item) => item.settings).flat();
}

export function getAllStyleShiftItems() {
	return [...styleshiftItems.Default, ...styleshiftItems.AddOn];
}

export function getAllStyleShiftCategoriesOnly(): Category[] {
	return getAllStyleShiftItems().filter((item) => (item as any).category != null) as Category[];
}

export function getAllStyleShiftSettings() {
	return getAllStyleShiftCategoriesOnly()
		.map((item) => item.settings)
		.flat();
}

export function findExistSettings(setting: Setting) {
	return getAllStyleShiftSettings().some(
		(thisSetting) =>
			thisSetting.id === setting.id &&
			//@ts-ignore
			(thisSetting.name == null || thisSetting.name === setting.name),
	);
}

export function getSettingCategory(setting: Setting): Category | null {
	for (const thisCategory of getAllStyleShiftCategoriesOnly()) {
		for (const thisSetting of thisCategory.settings) {
			if (thisSetting === setting) {
				return thisCategory;
			}
		}
	}
	return null;
}

export function findExistCategory(category: Category) {
	return getAllStyleShiftCategoriesOnly().some((thisCategory) => thisCategory.category === category.category);
}

function autoAddHightlight(array: (Category | { isHeader: boolean; label: string })[]) {
	for (const item of array) {
		const categoryObj = item as Category;
		if (categoryObj.category && categoryObj.highlightColor == null) {
			const categoryName = getCategoryLabel(categoryObj);
			const getColorId = randomNumberInRange(0, highlightColors.length - 1, categoryName);
			logger.debug("highlight", "random id", categoryName, getColorId);
			categoryObj.highlightColor = highlightColors[getColorId];
		}
	}
}

async function saveAddOnItemsAndRefreshExtensionState(addOnItems) {
	await saveToStorage("addOnStyleShiftItems", addOnItems);
	refreshExtensionState();
}

export async function updateStyleShiftItems() {
	styleshiftItems.Default = [...getStyleShiftDefaultItems(), ...getDefaultItems()];

	const storedAddOn = await getRootValue("addOnStyleShiftItems");
	if (storedAddOn && Array.isArray(storedAddOn) && storedAddOn.length > 0) {
		logger.debug("settings", "Loading add-on items from storage");
		styleshiftItems.AddOn = storedAddOn;
	} else {
		logger.debug("settings", "No add-on items in storage, using defaults");
		styleshiftItems.AddOn = getStyleShiftAddOnItems();
	}

	autoAddHightlight(getAllStyleShiftItems());
	getSettingsList(true);

	// Default
	for (const item of styleshiftItems.Default) {
		if ((item as any).category) {
			const thisCategory = item as Category;
			if (thisCategory.editable !== true) {
				thisCategory.editable = false;
			}
			for (const thisSetting of thisCategory.settings) {
				if (thisSetting.editable !== true) {
					thisSetting.editable = false;
				}
			}
		}
	}

	// AddOn
	for (const thisCategory of styleshiftItems.AddOn) {
		thisCategory.editable = true;
		for (const thisSetting of thisCategory.settings) {
			thisSetting.editable = true;
		}
	}
}

let settingsList = {} as { [id: string]: Setting };

export function getSettingsList(rebuild = false): { [id: string]: Setting } {
	if (!rebuild && Object.keys(settingsList).length) {
		return settingsList;
	}

	settingsList = {};

	for (const categoryObj of getAllStyleShiftCategoriesOnly()) {
		for (const setting of categoryObj.settings) {
			if ("id" in setting && setting.id != null) {
				settingsList[setting.id] = setting;
			}
		}
	}

	return settingsList;
}

export function getSettingById(id: string): Setting | undefined {
	return getSettingsList()[id];
}

//--------------------------------------------------

export function findAddOnCategory(category: Category): Category | undefined {
	const label = getCategoryLabel(category);
	return getAddOnItems().find((candidate) => getCategoryLabel(candidate) === label);
}

function makeUniqueSetting(thisSetting: Setting): Setting {
	let result = thisSetting;
	let times = 0;

	while (findExistSettings(result)) {
		times++;
		result = { ...thisSetting };
		result.id = `${thisSetting.id}_${times}`;
		if ((thisSetting as any).name != null) {
			(result as any).name = `${(thisSetting as any).name}_${times}`;
		}
	}

	return result;
}

export async function addSettingToCategory(category: Category, thisSetting: Setting): Promise<void> {
	const canonical = findAddOnCategory(category);
	if (!canonical) {
		logger.warn("settings", "Cannot add setting, category not found:", getCategoryLabel(category));
		return;
	}

	const setting = makeUniqueSetting(thisSetting);
	canonical.settings.push(setting);
	logger.info("settings", "Added setting to category", getCategoryLabel(canonical), setting);

	getSettingsList(true);

	const value = (setting as any).value;
	if (value) {
		await saveToStorage(setting.id, value);
	}

	attachBehaviorToSetting(setting);

	await saveAndRefreshAll();
}

export async function removeSetting(thisSetting: Setting): Promise<boolean> {
	let wasRemoved = false;

	for (const thisCategory of getAddOnItems()) {
		const index = (thisCategory.settings || []).findIndex(
			(checkSetting) =>
				checkSetting === thisSetting ||
				(!!thisSetting.id && "id" in checkSetting && checkSetting.id === thisSetting.id),
		);

		if (index > -1) {
			thisCategory.settings.splice(index, 1);
			wasRemoved = true;
			break;
		}
	}

	if (wasRemoved) {
		getSettingsList(true);
		await saveAndRefreshAll();
	}
	return wasRemoved;
}

//--------------------------------------------------

export async function addCategory(categoryName: string) {
	let thisCategory: Category = {
		category: categoryName,
		settings: [],
	};

	let findSimilar = findExistCategory(thisCategory);
	let newCategory: Category;
	let times = 0;

	while (findSimilar) {
		times++;
		newCategory = Object.assign({}, thisCategory);
		newCategory.category += `_${times}`;
		findSimilar = findExistCategory(newCategory);
		logger.info("category", findSimilar, times, newCategory);
	}

	if (newCategory) {
		thisCategory = newCategory;
	}

	const addOnItems = getAddOnItems();
	addOnItems.push(thisCategory);
	logger.info("category", "Added Category", addOnItems);

	getSettingsList(true);

	// Track the new category ID for UI highlighting
	const categoryId = getCategoryLabel(thisCategory);
	await saveToStorage("lastAddedCategory", categoryId);

	await saveAddOnItemsAndRefreshExtensionState(addOnItems);
}

export async function removeCategory(thisCategory: Category): Promise<boolean> {
	const addOnItems = getAddOnItems();
	const categoryLabel = getCategoryLabel(thisCategory);

	const index = addOnItems.findIndex((checkCategory) => {
		const checkLabel = getCategoryLabel(checkCategory);
		return checkCategory === thisCategory || checkLabel === categoryLabel;
	});

	if (index === -1) return false;

	addOnItems.splice(index, 1);
	getSettingsList(true);
	await saveAddOnItemsAndRefreshExtensionState(addOnItems);
	return true;
}

//-------------------------------------------------
