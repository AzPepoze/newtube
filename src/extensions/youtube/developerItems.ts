import { getRootValue } from "@core/storage/manager";
import { getFile } from "@core/shared/extensionHelpers";
import { createError } from "@core/shared/notifications";
import { exportThemeWithSelection } from "@core/theme/exporter";
import { importThemeZipWithWorkflow } from "@core/theme/importer";
import { type Category } from "@settings/types/styleshiftTypes";
import { logger } from "@shared/logger";
import { showSelection, showUserConfirmation, showUserPrompt } from "@ui/window/windowFactory";
import { showAllCurrentSave } from "./dangerzone";
import { openDiagnosticsSandboxWithText, openDiagnosticsViewerWithText } from "./features/diagnostics/export";
import { applyDiagnosticsSettings, parseDiagnosticsReport } from "./features/diagnostics/replay";

type DevCategory = Category & { insertAfter?: string };

async function confirmAndApplyReport(text: string, sourceLabel: string) {
	try {
		const report = parseDiagnosticsReport(text);
		const confirmed = await showUserConfirmation(
			`This replaces your current settings and custom items with the ones captured in ${sourceLabel}. Continue?`,
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

/** Developer-only replay of a diagnostics report captured on another machine. */
async function importDiagnosticsReport() {
	const file = await getFile(".json,application/json").catch(() => null);
	if (!file) return;

	await confirmAndApplyReport(await file.text(), `"${file.name}"`);
}

/** Asks what to do with a pasted diagnostics report. Nothing changes until the user picks. */
async function pasteDiagnosticsReport() {
	const text = await showUserPrompt("Paste a report", "Paste the diagnostics JSON here", "", { multiline: true });
	if (!text || !text.trim()) return;

	const choice = await showSelection(
		"Choose what to do with this report.",
		"Paste a report",
		[
			{
				label: "Apply to my settings",
				color: "var(--theme-0)",
				description: "Replaces your settings with the report's. You confirm again before anything changes.",
			},
			{
				label: "Test in sandbox",
				description: "Opens a sandbox with the report's settings and page. Your settings are not changed.",
			},
			{
				label: "Just view",
				description: "Opens the preview page only. Nothing is applied.",
			},
		],
		{ vertical: true },
	);

	if (choice === "Apply to my settings") {
		await confirmAndApplyReport(text, "the pasted report");
	} else if (choice === "Test in sandbox") {
		await openDiagnosticsSandboxWithText(text);
	} else if (choice === "Just view") {
		await openDiagnosticsViewerWithText(text);
	}
}

const devOnlyItems: DevCategory[] = [
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
		],
	},
	{
		category: { icon: "bug_report", label: "Diagnostics" },
		settings: [
			{
				type: "button",
				id: "ImportDiagnosticsButton",
				name: "Import settings from a report",
				description: "Replays the settings captured in a saved diagnostics file.",
				clickFunction: importDiagnosticsReport,
				color: "#3eadad",
				fontSize: 15,
				align: "left",
				icon: "upload",
			},
			{
				type: "button",
				id: "PasteDiagnosticsButton",
				name: "Paste a report",
				description: "Paste a report you received, then choose to apply it, test it in a sandbox or just view it.",
				clickFunction: pasteDiagnosticsReport,
				color: "#3eadad",
				fontSize: 15,
				align: "left",
				icon: "content_paste",
			},
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
];

export function getStyleShiftDevOnlyItems() {
	return [...devOnlyItems];
}
