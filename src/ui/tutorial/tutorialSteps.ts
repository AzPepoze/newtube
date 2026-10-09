export type TutorialTier = "core" | "optional";

export const PANEL_CATEGORY = {
	quickPalette: "Quick Palette",
	customElements: "Custom Elements",
	importExport: "Import / Export Theme",
	extensionSettings: "Extention's settings",
} as const;

export interface TutorialStepOption {
	id: string;
	label: string;
	icon: string;
	color: string;
	category: string;
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
	show?: {
		panelCategory?: string;
		themeTab?: "installed" | "store";
	};
	secondaryShow?: {
		label: string;
		themeTab?: "installed" | "store";
	};
	try?: "quickCustomize" | "customize";
	options?: TutorialStepOption[];
}

export function requiresSettingsPanel(step: TutorialStep): boolean {
	const hasPanelCategory = step.panelCategory !== undefined || step.show?.panelCategory !== undefined;
	return hasPanelCategory || (step.options?.length ?? 0) > 0;
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
		targetSelector: '[data-category="Import / Export Theme"]',
		panelCategory: PANEL_CATEGORY.importExport,
		show: {
			panelCategory: PANEL_CATEGORY.importExport,
		},
		actionLabel: "Show Import / Export",
	},
	{
		id: "developer-mode",
		tier: "optional",
		title: "Developer Mode",
		accent: "#ffb020",
		body: "Turn on Developer Mode in Extension's settings to edit settings. Use + Add Setting to create one, the pencil to change it, and the trash icon to delete it.",
		bullets: ["Shortcut: Alt+Shift+A", "Drag the handle to reorder settings"],
		targetSelector: '[data-category="Extention\'s settings"]',
		panelCategory: PANEL_CATEGORY.extensionSettings,
		show: {
			panelCategory: PANEL_CATEGORY.extensionSettings,
		},
		actionLabel: "Show Extension's settings",
	},
	{
		id: "more-options",
		tier: "optional",
		title: "More options",
		accent: "#4caf50",
		body: "These extras are optional. Click one to jump straight to its setting.",
		bullets: [],
		targetSelector: ".styleshift-settings-main",
		options: [
			{
				id: "share",
				label: "Share Your Theme",
				icon: "ios_share",
				color: "#ffb020",
				category: PANEL_CATEGORY.quickPalette,
			},
			{
				id: "realtime",
				label: "Realtime Updating",
				icon: "bolt",
				color: "#3eadad",
				category: PANEL_CATEGORY.extensionSettings,
			},
			{
				id: "autoUpdate",
				label: "Auto Update Themes",
				icon: "system_update",
				color: "#7f5db7",
				category: PANEL_CATEGORY.extensionSettings,
			},
			{
				id: "glass",
				label: "Glass UI",
				icon: "blur_on",
				color: "#2196f3",
				category: PANEL_CATEGORY.extensionSettings,
			},
			{
				id: "shortcuts",
				label: "Keyboard Shortcuts",
				icon: "keyboard",
				color: "#e45eff",
				category: PANEL_CATEGORY.extensionSettings,
			},
		],
	},
];
