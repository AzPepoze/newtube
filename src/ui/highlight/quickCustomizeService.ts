import { logger } from "@shared/logger";
import { openSelectorPicker } from "./selectorPicker";
import { mount, unmount } from "svelte";
import QuickCustomize from "./views/QuickCustomize.svelte";
import { addCategory, addSetting, getAddOnItems } from "@settings/registry/items";
import { createUniqueId } from "@/core/shared/utilities";
import { createStyleShiftWindow } from "../window/windowFactory";
import type { QuickCustomizeData, Setting } from "@settings/types/styleshiftTypes";

let quickCustomizeComponent: ReturnType<typeof mount> | null = null;
let pickerWindow: Awaited<ReturnType<typeof createStyleShiftWindow>> | null = null;

type QuickCustomizeSaveData = QuickCustomizeData & {
	css: string;
	name: string;
};

export async function startQuickCustomize(existingSetting?: Setting) {
	if (existingSetting) {
		openQuickCustomizeUI(existingSetting.quickCustomize?.selector || "", existingSetting);
		return;
	}

	logger.info("QuickCustomize", "Starting quick customize flow");

	await openSelectorPicker(
		(selector) => {
			logger.info("QuickCustomize", "Element selected for customization", selector);
			openQuickCustomizeUI(selector);
		},
		() => {
			logger.info("QuickCustomize", "Selection canceled");
		},
	);
}

async function openQuickCustomizeUI(selector: string, existingSetting?: Setting) {
	if (pickerWindow) {
		pickerWindow.closeWindowHandler();
	}

	pickerWindow = await createStyleShiftWindow({
		title: existingSetting && "name" in existingSetting ? `Edit: ${existingSetting.name}` : "Quick Customize",
		width: "680px",
		height: "680px",
		center: true,
	});

	quickCustomizeComponent = mount(QuickCustomize, {
		target: pickerWindow.contentElement,
		props: {
			selector,
			initialData:
				existingSetting && "name" in existingSetting
					? {
							name: existingSetting.name,
							mode: existingSetting.quickCustomize?.mode || "basic",
							basicStyles: existingSetting.quickCustomize?.metadata?.basicStyles ?? {},
							enabledStyles: existingSetting.quickCustomize?.metadata?.enabledStyles ?? {},
							rawCss: "enableCss" in existingSetting ? existingSetting.enableCss : undefined,
						}
					: null,
			onClose: () => {
				pickerWindow.closeWindowHandler();
			},
			onSave: async (data: QuickCustomizeSaveData) => {
				logger.info("QuickCustomize", "Saving customization", data);

				if (existingSetting && "name" in existingSetting) {
					existingSetting.name = data.name;
					if ("enableCss" in existingSetting) existingSetting.enableCss = data.css;
					existingSetting.quickCustomize = {
						selector: data.selector,
						mode: data.mode,
						metadata: data.metadata,
					};
					// Trigger update in storage/engine
					await addSetting([], existingSetting);
				} else {
					const categoryName = "Custom Elements";
					let addOnItems = getAddOnItems();
					let customCategory = addOnItems.find(
						(c) => (typeof c.category === "string" ? c.category : c.category.label) === categoryName,
					);

					if (!customCategory) {
						await addCategory(categoryName);
						addOnItems = getAddOnItems();
						customCategory = addOnItems.find(
							(c) => (typeof c.category === "string" ? c.category : c.category.label) === categoryName,
						);
					}

					if (customCategory) {
						const newSetting: Setting = {
							id: `custom_${createUniqueId(8)}`,
							name: data.name,
							description: `Custom styles for selector: ${data.selector}`,
							type: "checkbox",
							value: true,
							enableCss: data.css,
							quickCustomize: {
								selector: data.selector,
								mode: data.mode,
								metadata: data.metadata,
							},
							editable: true,
						};

						await addSetting(customCategory.settings, newSetting);
						logger.info("QuickCustomize", "New setting added", newSetting);
					}
				}

				pickerWindow.closeWindowHandler();
			},
		},
	});

	const originalClose = pickerWindow.closeWindowHandler;
	pickerWindow.closeWindowHandler = async () => {
		if (quickCustomizeComponent) {
			unmount(quickCustomizeComponent);
			quickCustomizeComponent = null;
		}
		await originalClose();
		pickerWindow = null;
	};
}
