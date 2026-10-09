export type TutorialTier = "core" | "optional";

export const PANEL_CATEGORY = {
	quickPalette: "Quick Palette",
	customElements: "Custom Elements",
	importExport: "Import / Export Theme",
	extensionSettings: "Extension's settings",
} as const;

export interface TutorialChoice {
	/** Label of the button that continues into the branched content. */
	acceptLabel: string;
	/** Label of the button that skips the branched content. */
	declineLabel: string;
	/**
	 * Step id to jump to when the user declines. When omitted, declining ends
	 * the tutorial with a celebration instead.
	 */
	declineToId?: string;
}

export interface TutorialStep {
	id: string;
	tier: TutorialTier;
	title: string;
	accent: string;
	body: string;
	bullets: string[];
	panelCategory?: string;
	actionLabel?: string;
	targetSelector?: string;
	spotlight?: boolean;
	requiresDeveloperMode?: boolean;
	choice?: TutorialChoice;
	show?: {
		panelCategory?: string;
		themeTab?: "installed" | "store";
		docs?: boolean;
	};
	secondaryShow?: {
		label: string;
		themeTab?: "installed" | "store";
	};
	try?: "quickCustomize" | "customize";
}

export function requiresSettingsPanel(step: TutorialStep): boolean {
	return step.panelCategory !== undefined || step.show?.panelCategory !== undefined;
}

export function hasSpotlight(step: TutorialStep): boolean {
	return step.spotlight !== false && step.targetSelector !== undefined;
}

export function needsDeveloperMode(step: TutorialStep): boolean {
	return step.requiresDeveloperMode === true;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: "open-panel",
		tier: "core",
		title: "Open the panel",
		accent: "#7f5db7",
		body: "Click the ✦ button at the top-right of YouTube. The StyleShift panel opens on the right, with a sidebar to switch between sections.",
		bullets: ["Shortcut: Alt+Shift+X also opens the panel"],
		targetSelector: "#NEWTUBESET",
		show: {},
		actionLabel: "Open the panel",
	},
	{
		id: "meet-panel",
		tier: "core",
		title: "Your settings panel",
		accent: "#38bdf8",
		body: "Everything lives in this panel. Pick a section on the left, change its settings on the right.",
		bullets: [],
		targetSelector: ".styleshift-settings-main",
		panelCategory: PANEL_CATEGORY.quickPalette,
	},
	{
		id: "panel-sidebar",
		tier: "core",
		title: "The sidebar",
		accent: "#f472b6",
		body: "Each row jumps to a settings group. Headers split them into sections like Video Experience and Visual Style.",
		bullets: [],
		targetSelector: ".styleshift-sidebar",
		panelCategory: PANEL_CATEGORY.quickPalette,
	},
	{
		id: "panel-content",
		tier: "core",
		title: "The main area",
		accent: "#a3e635",
		body: "The selected section opens here. Longer sections scroll, so keep going down.",
		bullets: [],
		targetSelector: ".styleshift-settings-list",
		panelCategory: PANEL_CATEGORY.quickPalette,
	},
	{
		id: "panel-search",
		tier: "core",
		title: "Search everything",
		accent: "#fb923c",
		body: "Type here to filter every setting instantly, no matter which section it lives in.",
		bullets: ["Press / anywhere to jump straight to search"],
		targetSelector: ".styleshift-search-wrapper",
		panelCategory: PANEL_CATEGORY.quickPalette,
	},
	{
		id: "keyboard-shortcuts",
		tier: "core",
		title: "Keyboard shortcuts",
		accent: "#4caf50",
		body: "Four keys run the show: Alt+Shift+Z toggles, X opens the panel, C customizes, A flips Developer Mode.",
		bullets: ["Change them in your browser's extension shortcut settings"],
		targetSelector: "#KeyboardShortcuts",
		panelCategory: PANEL_CATEGORY.extensionSettings,
		show: {
			panelCategory: PANEL_CATEGORY.extensionSettings,
		},
		actionLabel: "Show Extension's settings",
	},
	{
		id: "customize-element",
		tier: "core",
		title: "Customize Elements",
		accent: "#3eadad",
		body: "In Quick Palette, click Customize Elements, then hover the page. Matching parts light up. Click one and its settings open beside it, so you can toggle them right away.",
		bullets: ["Shortcut: Alt+Shift+C turns it on or off"],
		targetSelector: "#StyleShiftToggleCustomize",
		panelCategory: PANEL_CATEGORY.quickPalette,
		show: {
			panelCategory: PANEL_CATEGORY.quickPalette,
		},
		try: "customize",
		actionLabel: "Show Quick Palette",
	},
	{
		id: "quick-customize",
		tier: "core",
		title: "Quick Customize",
		accent: "#e45eff",
		body: "In Quick Palette, click Quick Customize, then click an element on the page. A window opens where you name it and style it. Save adds it under Custom Elements.",
		bullets: ["Find it in the Quick Palette section"],
		targetSelector: "#StyleShiftQuickCustomize",
		panelCategory: PANEL_CATEGORY.quickPalette,
		show: {
			panelCategory: PANEL_CATEGORY.quickPalette,
		},
		try: "quickCustomize",
		actionLabel: "Show Quick Palette",
	},
	{
		id: "dev-bridge",
		tier: "core",
		title: "Want to explore Developer Mode?",
		accent: "#8b7cf6",
		body: "Those clicks touched real settings. Developer Mode is the hard manual way: build, code, pack.",
		bullets: [],
		panelCategory: PANEL_CATEGORY.extensionSettings,
		spotlight: false,
		choice: {
			acceptLabel: "We need to go deeper!",
			declineLabel: "I'm fine",
		},
	},
	{
		id: "developer-mode",
		tier: "core",
		title: "Developer Mode",
		accent: "#ffb020",
		body: "Turn on the Developer Mode checkbox. It unlocks the + buttons, the pencil, and the trash icon.",
		bullets: ["Shortcut: Alt+Shift+A flips it anytime"],
		targetSelector: "#developerMode",
		panelCategory: PANEL_CATEGORY.extensionSettings,
		show: {
			panelCategory: PANEL_CATEGORY.extensionSettings,
		},
		actionLabel: "Show Extension's settings",
		requiresDeveloperMode: true,
	},
	{
		id: "dev-add-category",
		tier: "core",
		title: "Add a category",
		accent: "#22d3ee",
		body: "Use the sidebar + to add a category. It lands under ADD-ON and stays editable.",
		bullets: ["Categories you add can be reordered and removed"],
		targetSelector: ".styleshift-add-category-button",
		panelCategory: PANEL_CATEGORY.quickPalette,
		show: {
			panelCategory: PANEL_CATEGORY.quickPalette,
		},
		actionLabel: "Show sidebar button",
		requiresDeveloperMode: true,
	},
	{
		id: "dev-add-setting",
		tier: "core",
		title: "Add a setting",
		accent: "#2dd4bf",
		body: "Inside your ADD-ON category, use its + button to pick a kind. It lands editable.",
		bullets: ["Pencil edits a setting, trash deletes it"],
		targetSelector: ".styleshift-add-setting-button-wrapper",
		panelCategory: PANEL_CATEGORY.quickPalette,
		show: {
			panelCategory: PANEL_CATEGORY.quickPalette,
		},
		actionLabel: "Show setting button",
		requiresDeveloperMode: true,
	},
	{
		id: "dev-code-zip",
		tier: "core",
		title: "Code it and pack it",
		accent: "#f43f5e",
		body: "Code settings by hand: pair CSS/JS with a config.json, then export it.",
		bullets: [
			"Scope: Build-in, Add-ons, or Both",
			"Output: Clipboard or ZIP",
			"The API Reference window lists every function and setting kind",
		],
		targetSelector: "#ExportDataButton",
		panelCategory: PANEL_CATEGORY.importExport,
		show: {
			docs: true,
		},
		actionLabel: "Open API Reference",
	},
	{
		id: "themes-store",
		tier: "core",
		title: "Themes and the store",
		accent: "#ff6d6d",
		body: "Themes opens your saved themes. Its Store tab browses the online store. Get downloads a theme, and Save keeps it in your collection.",
		bullets: ["Share Your Theme uploads your own theme to the store"],
		targetSelector: "#OpenThemeManagerButton",
		panelCategory: PANEL_CATEGORY.quickPalette,
		show: {
			themeTab: "installed",
		},
		secondaryShow: {
			label: "Theme Store",
			themeTab: "store",
		},
		actionLabel: "Show Themes",
	},
	{
		id: "save-export",
		tier: "core",
		title: "Auto-save, export and import",
		accent: "#1932ff",
		body: "Settings save as you change them, so there is no Save button for them. Export Data copies your setup. Import Data loads one back in.",
		bullets: ["To keep a whole look as a theme, use Save in the Themes window"],
		targetSelector: "#ImportDataButton",
		panelCategory: PANEL_CATEGORY.importExport,
		show: {
			panelCategory: PANEL_CATEGORY.importExport,
		},
		actionLabel: "Show Import / Export",
	},
];
