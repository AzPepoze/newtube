import { getRootValue } from "@core/storage/manager";
import { getFile } from "@core/shared/extensionHelpers";
import { createError, createNotification, createSuccess, createWarning } from "@core/shared/notifications";
import { exportThemeWithSelection } from "@core/theme/exporter";
import { importThemeZipWithWorkflow } from "@core/theme/importer";
import { type Category } from "@settings/types/styleshiftTypes";
import { logger } from "@shared/logger";
import { openApiReference } from "@ui/docs/apiReferenceService";
import { showUserConfirmation } from "@ui/window/windowFactory";
import { showAllCurrentSave } from "./dangerzone";
import { applyDiagnosticsSettings, parseDiagnosticsReport } from "./features/diagnostics/replay";

type DevCategory = Category & { insertAfter?: string };

/** Developer-only replay of a diagnostics report captured on another machine. */
async function importDiagnosticsReport() {
	const file = await getFile(".json,application/json").catch(() => null);
	if (!file) return;

	try {
		const report = parseDiagnosticsReport(await file.text());
		const confirmed = await showUserConfirmation(
			`This replaces your current settings and custom items with the ones captured in "${file.name}". Continue?`,
			"Import settings from a report",
			{ confirmLabel: "Apply settings", confirmColor: "var(--theme-0)" },
		);
		if (!confirmed) return;
		await applyDiagnosticsSettings(report);
	} catch (error) {
		logger.error("diagnostics", "Failed to import settings from a report", error);
		createError(error instanceof Error ? error.message : "Failed to import the report.");
	}
}

const devOnlyItems: DevCategory[] = [
	{
		category: { icon: "settings", label: "Extension's settings" },
		settings: [
			{
				id: "ShowAllCurrentSaveButton",
				name: "Show All Current Save",
				description: "Displays the complete raw storage data (all current save data, not just settings).",
				clickFunction: showAllCurrentSave,
				type: "button",
				color: "#7f5db7",
				align: "left",
				icon: "data_object",
				require: { developerMode: true },
			},
		],
	},
	{
		category: { icon: "swap_vert", label: "Import / Export Theme" },
		settings: [
			{
				type: "subText",
				fontSize: 15,
				align: "center",
				text: "file (.NewTube.zip)",
			},
			{
				type: "button",
				id: "ExportZipFileButton",
				name: "Export active theme",
				description: "Exports your currently active theme configuration to clipboard or ZIP file.",
				color: "#1a34ffff",
				fontSize: 15,
				clickFunction: async function () {
					const activeThemeId = await getRootValue("activeTheme");
					const themes = (await getRootValue("themes")) || [];
					const theme = themes.find((t: any) => t.themeId === activeThemeId);
					if (theme) {
						await exportThemeWithSelection(activeThemeId, theme.themeName, theme);
					} else {
						const currentSettings = await getRootValue("currentSettings");
						const addOnStyleShiftItems = await getRootValue("addOnStyleShiftItems");
						await exportThemeWithSelection("current", "Current Theme", { currentSettings, addOnStyleShiftItems });
					}
				},
				align: "center",
				icon: "publish",
			},
			{
				type: "button",
				id: "ImportZipFileButton",
				name: "Import theme file",
				description: "Imports a theme configuration from a ZIP file into your Theme Manager.",
				color: "#1a34ffff",
				fontSize: 15,
				clickFunction: async function () {
					await importThemeZipWithWorkflow();
				},
				align: "center",
				icon: "download",
			},
			{
				type: "button",
				id: "ApiReferenceButton",
				name: "API Reference",
				description: "Browse every built-in function and setting kind with copyable examples.",
				color: "#2196f3",
				fontSize: 15,
				clickFunction: async function () {
					await openApiReference();
				},
				align: "center",
				icon: "menu_book",
			},
		],
	},
	{
		category: { icon: "science", label: "Test" },
		insertAfter: "Import / Export Theme",
		settings: [
			{
				type: "subText",
				fontSize: 14,
				align: "center",
				text: "Notification tests",
			},
			{
				type: "button",
				id: "TestNotificationButton",
				name: "Test Notification",
				description: "Fires a standard notification with an icon.",
				clickFunction: () =>
					createNotification({
						icon: "notifications",
						iconColor: "#7f5db7",
						title: "Test Notification",
						content: "This is a test notification.",
						timeout: 5000,
					}),
				color: "#7f5db7",
				fontSize: 15,
				align: "left",
				icon: "notifications",
			},
			{
				type: "button",
				id: "TestSuccessNotificationButton",
				name: "Test Success",
				description: "Fires a success notification.",
				clickFunction: () => createSuccess("Test success message."),
				color: "#4caf50",
				fontSize: 15,
				align: "left",
				icon: "check_circle",
			},
			{
				type: "button",
				id: "TestWarningNotificationButton",
				name: "Test Warning",
				description: "Fires a warning notification.",
				clickFunction: () => createWarning("Test warning message."),
				color: "#ff9800",
				fontSize: 15,
				align: "left",
				icon: "warning",
			},
			{
				type: "button",
				id: "TestErrorNotificationButton",
				name: "Test Error",
				description: "Fires an error notification.",
				clickFunction: () => createError("Test error message."),
				color: "#f44336",
				fontSize: 15,
				align: "left",
				icon: "error",
			},
			{
				type: "button",
				id: "TestPersistentNotificationButton",
				name: "Test Persistent",
				description: "Fires a notification without auto-close (closes with the X).",
				clickFunction: () =>
					createNotification({
						icon: "push_pin",
						iconColor: "#2196f3",
						title: "Persistent Notification",
						content: "This notification stays until you close it.",
						timeout: 0,
					}),
				color: "#2196f3",
				fontSize: 15,
				align: "left",
				icon: "push_pin",
			},
		],
	},
	{
		category: { icon: "bug_report", label: "Diagnostics" },
		settings: [
			{
				type: "button",
				id: "ImportDiagnosticsButton",
				name: "Import settings from a report",
				description: "Replays the settings captured in a diagnostics report.",
				clickFunction: importDiagnosticsReport,
				color: "#3eadad",
				fontSize: 15,
				align: "left",
				icon: "upload",
			},
		],
	},
];

export function getStyleShiftDevOnlyItems() {
	return [...devOnlyItems];
}
