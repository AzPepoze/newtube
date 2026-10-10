import { openSettingPage } from "@core/shared/extensionHelpers";
import { showExtensionUpdateNotification } from "@core/shared/versionUpdate";
import { exportThemeWithSelection } from "@core/theme/exporter";
import { exportCurrentSettingsObject, importThemeWorkflow } from "@core/theme/importer";
import { checkAndUpdateTheme, openThemeStore, openThemeSubmitPage } from "@core/theme/storeIntegration";
import { getAddOnItems } from "@settings/registry/items";
import { type Category, type SeparateCategory } from "@settings/types/styleshiftTypes";
import { toggleCustomize } from "@ui/highlight/highlight";
import { startQuickCustomize } from "@ui/highlight/quickCustomizeService";
import { openTutorialOverlay } from "@ui/tutorial/tutorialService";
import { playCelebration } from "@ui/tutorial/celebrationService";
import { showThemeManager } from "@ui/themes/themeManagerService";
import { showTryImportOldNPreset } from "./dangerzone";
import { copyDiagnosticsToClipboard, exportDiagnosticsFile } from "./features/diagnostics/export";
import { showWelcome } from "./welcome";

const diagnosticsLinkStyle = [
	"display: inline-flex",
	"align-items: center",
	"padding: 8px 18px",
	"border-radius: 999px",
	"background: var(--theme-0)",
	"color: #ffffff",
	"font-weight: 700",
	"text-decoration: none",
].join("; ");
const diagnosticsIntroHtml = `
<div style="display: flex; flex-direction: column; gap: 14px; width: 100%;">
	<p style="margin: 0;">
		<b>Create a report</b> so I can find and fix your problem faster.
	</p>
	<div>
		<b>The report includes:</b>
		<ul style="margin: 6px 0 0; padding-left: 18px; line-height: 1.7;">
			<li>Your layout, styling, settings and browser info</li>
			<li>No video titles, comments or account details</li>
			<li>Nothing is sent automatically</li>
		</ul>
	</div>
	<div>
		<b>Then send it to me:</b>
		<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px;">
			<a href="https://discord.gg/BgxvVqap4G" target="_blank" rel="noopener noreferrer" style="${diagnosticsLinkStyle}">Discord</a>
			<a href="https://github.com/AzPepoze/NewTube/issues" target="_blank" rel="noopener noreferrer" style="${diagnosticsLinkStyle}">GitHub issue</a>
		</div>
	</div>
</div>
`;

const defaultStyleShiftItems: (Category | SeparateCategory)[] = [
	{ isHeader: true, label: "Extension" },
	{
		category: { icon: "volunteer_activism", label: "Buy me a chocolate mlik! (I don't drink a coffee)" },
		rainbow: true,
		settings: [
			{
				clickFunction: 'window.open("https://github.com/sponsors/AzPepoze");',
				color: "#e45eff",
				fontSize: 20,
				description:
					"Support the development of NewTube by becoming a sponsor. Your contribution helps fund new features, improvements, maintenance and my life.",
				icon: "https://media.tenor.com/XmUpFK6JyU8AAAAj/cute-please.gif",
				iconSize: 100,
				iconScale: 1.3,
				name: "GitHub Sponsors",
				align: "left",
				type: "button",
			},
		],
		selector: "",
	},
	{
		category: { icon: "group", label: "Join my Discord!" },
		rainbow: true,
		settings: [
			{
				clickFunction: 'window.open("https://discord.gg/BgxvVqap4G");',
				color: "#1932ffff",
				fontSize: 15,
				icon: "https://brandlogos.net/wp-content/uploads/2021/11/discord-logo.png",
				name: "NEWTUBE",
				align: "left",
				type: "button",
			},
		],
	},
	{
		category: { icon: "settings_input_component", label: "Quick Palette" },
		rainbow: true,
		layout: "grid",
		settings: [
			{
				clickFunction: showThemeManager,
				color: "#7f5db7",
				description: "Browse and manage your collection of saved themes with live previews.",
				fontSize: 15,
				id: "OpenThemeManagerButton",
				name: "Themes",
				align: "left",
				type: "button",
				icon: "collections",
			},
			{
				clickFunction: openThemeStore,
				color: "#ff6d6d",
				description: "Discover and download thousands of themes from the official NewTube store.",
				fontSize: 15,
				id: "ExploreThemesButton",
				name: "Explore Themes",
				align: "left",
				type: "button",
				icon: "storefront",
			},
			{
				clickFunction: openThemeSubmitPage,
				type: "button",
				id: "ShareThemeButton",
				name: "Share Your Theme",
				description: "Submit your current setup to the NewTube store and share it with everyone.",
				fontSize: 15,
				color: "#ffb020",
				align: "left",
				icon: "ios_share",
			},
			{
				clickFunction: startQuickCustomize,
				type: "button",
				id: "StyleShiftQuickCustomize",
				name: "Quick Customize",
				description: "Pick any element and create a custom style instantly.",
				fontSize: 15,
				color: "#e45eff",
				align: "left",
				icon: "auto_fix_high",
			},
			{
				clickFunction: toggleCustomize,
				type: "button",
				id: "StyleShiftToggleCustomize",
				name: "Customize Elements",
				description: "Toggle element selection mode.",
				fontSize: 15,
				color: "#3eadad",
				align: "left",
				icon: "highlight_alt",
			},
			{
				clickFunction: openTutorialOverlay,
				type: "button",
				id: "StyleShiftTutorialButton",
				name: "Tutorial",
				description: "Learn how Developer Mode, Quick Customize and Customize Element work together.",
				fontSize: 15,
				color: "#ffb020",
				align: "left",
				icon: "school",
			},
			{
				clickFunction: () => playCelebration({ title: "Yay!", message: "Yay!", yayLabel: "Yay!" }),
				type: "button",
				id: "StyleShiftCelebrate",
				name: "Yay!",
				description: "Fire the confetti cannons, just for fun.",
				fontSize: 15,
				color: "#8b7cf6",
				align: "left",
				icon: "celebration",
			},
			{
				clickFunction: openSettingPage,
				color: "#646464ff",
				description: "Opens the full-page settings dashboard in a new tab.",
				fontSize: 15,
				id: "OpenDashboardButton",
				name: "Full Settings Page",
				align: "left",
				type: "button",
				icon: "display_settings",
			},
		],
	},
	{
		category: { icon: "settings", label: "Extension's settings" },
		settings: [
			{
				type: "subText",
				text: `Extension version: ${chrome.runtime.getManifest().version}`,
				fontSize: 14,
				align: "left",
			},
			{
				id: "enableExtension",
				name: "Enable Extension",
				type: "checkbox",
				value: true,
				disableFunction: "disableExtension()",
				enableFunction: "enableExtension()",
			},
			{
				id: "enableRealtimeExtension",
				name: "Realtime Updating",
				description: "Instantly applies visual changes as you move sliders or pick colors.",
				type: "checkbox",
				value: true,
			},
			{
				id: "developerMode",
				name: "Developer Mode",
				description: "Enables advanced features and detailed logging for developers.",
				type: "checkbox",
				value: false,
			},
			{
				id: "AutoUpdateTheme",
				name: "Auto Update Themes",
				description: "Automatically updates installed themes from the NewTube store when an update is available.",
				type: "checkbox",
				value: true,
			},
			{
				id: "ManualThemeUpdateBtn",
				name: "Check for Updates",
				description: "Manually check if an update is available for your currently active theme.",
				clickFunction: () => checkAndUpdateTheme(true),
				type: "button",
				color: "#3eadad",
				align: "center",
			},
			{
				type: "checkbox",
				id: "EnableSettingsBackgroundBlur",
				name: "Glass UI",
				description: "Applies a frosted-glass blur effect to the background of this settings window.",
				value: false,
			},
			{
				type: "numberSlide",
				id: "SettingsBackgroundBlurAmount",
				name: "Glass Intensity",
				description: "Adjusts the strength of the background blur for the settings menu.",
				value: 40,
				min: 0,
				max: 50,
				step: 1,
				varCss: "--setting-bg-blur-amount",
				require: { EnableSettingsBackgroundBlur: true },
			},

			{
				clickFunction: 'window.open("https://github.com/AzPepoze/Newtube");',
				color: "#2e16feff",
				description: "View the source code, contribute, or check for updates on GitHub.",
				fontSize: 15,
				icon: "assets/icons/github.svg",
				id: "GithubButton",
				name: "GitHub Repository",
				align: "left",
				type: "button",
			},
			{
				clickFunction: 'window.open("https://discord.gg/BgxvVqap4G");',
				color: "#e60005ff",
				description: "Found a bug? Have a suggestion? Join our Discord community!",
				fontSize: 15,
				id: "ReportBugButton",
				name: "❗Report Bugs & Issues❗\n",
				align: "center",
				type: "button",
			},
			{
				id: "KeyboardShortcuts",
				name: "Keyboard Shortcuts",
				description: "View all available keyboard shortcuts for quick access.",
				type: "keyboardShortcuts",
			},
			{
				id: "ShowWelcomePage",
				name: "Show Welcome Page",
				description: "Replay NewTube's welcome tour.",
				clickFunction: showWelcome,
				type: "button",
				color: "#7f5db7",
				align: "left",
				icon: "waving_hand",
			},
			{
				id: "TestVersionUpdateNotification",
				name: "Test Version Update Notification",
				description: "Show a preview notification for extension updates.",
				clickFunction: showExtensionUpdateNotification,
				type: "button",
				color: "#7f5db7",
				align: "left",
				icon: "system_update",
			},
		],
	},
	{
		category: { icon: "swap_vert", label: "Import / Export Theme" },
		settings: [
			{
				clickFunction: async function () {
					const currentSettings = await exportCurrentSettingsObject();
					const addOnStyleShiftItems = getAddOnItems();
					await exportThemeWithSelection("current", "Current Settings", {
						currentSettings,
						addOnStyleShiftItems,
					});
				},
				color: "#1932ffff",
				description: "Copies your current theme and settings as a text code to your clipboard.",
				fontSize: 15,
				icon: "file_upload",
				id: "ExportDataButton",
				name: "Export Data",
				align: "center",
				type: "button",
			},
			{
				clickFunction: async function () {
					await importThemeWorkflow();
				},
				color: "#1932ffff",
				description: "Import one or more StyleShift themes from pasted JSON, JSON files, or ZIP files.",
				fontSize: 15,
				icon: "download",
				id: "ImportDataButton",
				name: "Import Data",
				align: "center",
				type: "button",
			},
			{
				id: "ShowTryImportOldNPresetButton",
				name: "Import Old NPreset",
				description: "Import legacy NPreset JSON format from older versions of NewTube.",
				clickFunction: showTryImportOldNPreset,
				color: "#1932ffff",
				fontSize: 15,
				icon: "file_open",
				align: "center",
				type: "button",
			},
		],
	},
	{
		category: { icon: "bug_report", label: "Diagnostics" },
		settings: [
			{
				type: "text",
				html: diagnosticsIntroHtml,
				fontSize: 13,
				align: "left",
			},
			{
				type: "button",
				id: "CopySupportReportButton",
				name: "Copy support report",
				description: "Copies the report to your clipboard.",
				clickFunction: copyDiagnosticsToClipboard,
				color: "#7f5db7",
				fontSize: 15,
				align: "left",
				icon: "content_copy",
			},
			{
				type: "button",
				id: "SaveSupportReportButton",
				name: "Save support report",
				description: "Downloads the report as a .json file.",
				clickFunction: exportDiagnosticsFile,
				color: "#3eadad",
				fontSize: 15,
				align: "left",
				icon: "download",
			},
		],
	},
];

export function getStyleShiftDefaultItems() {
	return defaultStyleShiftItems;
}
