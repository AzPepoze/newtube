import { chooseSelection } from "@core/shared/dialogs";
import { copyToClipboard } from "@core/shared/extensionHelpers";
import { createNotification } from "@core/shared/notifications";
import { sortObjectKeys } from "@core/shared/utilities";
import { addItemsToZip, downloadZip } from "@core/theme/importer";

function sortCurrentSettings(data: any) {
	return {
		...data,
		...(data.currentSettings && { currentSettings: sortObjectKeys(data.currentSettings) }),
	};
}

/**
 * Handles the theme export process with user selection for content and format.
 */
export async function exportThemeWithSelection(themeId: string, themeName: string, themeData: any) {
	const displayName = themeName || themeId;

	const exportType = await chooseSelection({
		title: `Export "${displayName}"`,
		message: "What would you like to export?",
		buttons: [
			{
				label: "Build-in settings only",
				color: "var(--theme-0)",
				description: "Exports only the settings that come by default with NewTube.",
			},
			{
				label: "Add-ons settings only",
				color: "var(--theme-0)",
				description: "Exports only the add-ons settings.",
			},
			{
				label: "Both",
				color: "var(--theme-0)",
				description: "Exports both default and add-ons settings.",
			},
		],
		vertical: true,
	});

	if (!exportType) return;

	const method = await chooseSelection({
		title: `Export "${displayName}"`,
		message: "How would you like to export this theme?\n(Click outside to cancel)",
		buttons: [
			{ label: "Clipboard", color: "var(--theme-0)" },
			{ label: "ZIP File", color: "var(--theme-0)" },
		],
	});

	if (!method) return;

	const exportData: any = {
		themeId,
		themeName,
	};

	if (exportType === "Both" || exportType === "Build-in settings only") {
		exportData.currentSettings = themeData.currentSettings;
	}

	if (exportType === "Both" || exportType === "Add-ons settings only") {
		exportData.addOnStyleShiftItems = themeData.addOnStyleShiftItems;
	}

	if (method === "Clipboard") {
		exportThemeToClipboard(displayName, exportData);
	} else if (method === "ZIP File") {
		await exportThemeAsZip(displayName, exportData);
	}
}

/**
 * Copies theme data to the clipboard as a JSON string.
 */
export function exportThemeToClipboard(name: string, data: any) {
	const jsonText = JSON.stringify(sortCurrentSettings(data), null, 2);
	copyToClipboard(jsonText);

	createNotification({
		icon: "content_copy",
		title: "Theme Exported",
		content: `"${name}" copied to clipboard.`,
	});
}

/**
 * Downloads theme data as a structured ZIP file (high-fidelity).
 */
export async function exportThemeAsZip(name: string, data: any) {
	const files: Record<string, string | Blob> = {};

	if (data.currentSettings) {
		files["currentSettings.json"] = JSON.stringify(sortObjectKeys(data.currentSettings), null, 2);
	}

	if (data.addOnStyleShiftItems && Array.isArray(data.addOnStyleShiftItems)) {
		await addItemsToZip(data.addOnStyleShiftItems, files, "addOnStyleShiftItems");
	}

	for (const [key, value] of Object.entries(data)) {
		if (
			typeof value === "string" &&
			!files[`${key}.js`] && // Avoid overwriting if they were already added
			(key.endsWith("Css") || key.endsWith("Function") || key.endsWith("Script"))
		) {
			files[`${key}.js`] = value;
		}
	}

	await downloadZip(`${name}.zip`, "", files);
}
