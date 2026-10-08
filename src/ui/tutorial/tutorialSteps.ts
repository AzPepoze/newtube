export type TutorialVisualId =
	| "openPanel"
	| "quickCustomize"
	| "customizeElement"
	| "themesStore"
	| "saveExport"
	| "developerMode"
	| "moreOptions";

export type TutorialTier = "core" | "optional";

/** Panel section names, exactly as they appear in the StyleShift panel sidebar. */
export const PANEL_CATEGORY = {
	quickPalette: "Quick Palette",
	customElements: "Custom Elements",
	importExport: "Import / Export Theme",
	extensionSettings: "Extention's settings",
} as const;

export interface TutorialStep {
	id: string;
	tier: TutorialTier;
	title: string;
	/** Matches the color of the feature's button in the panel. */
	accent: string;
	body: string;
	bullets: string[];
	visual: TutorialVisualId;
	/** Number of animation beats the visual plays, starting at 0. */
	beats: number;
	/** Panel section the action button opens. Omit to only open the panel. */
	panelCategory?: string;
	/** Label of the action button. Omit when the step has no action button. */
	actionLabel?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: "open-panel",
		tier: "core",
		title: "Open the panel",
		accent: "#7f5db7",
		body: "Click the ✦ button at the top-right of YouTube. The StyleShift panel opens on the right, with a sidebar to switch between sections.",
		bullets: ["Shortcut: Alt+Shift+X also opens the panel"],
		visual: "openPanel",
		beats: 4,
		actionLabel: "Open the panel",
	},
	{
		id: "quick-customize",
		tier: "core",
		title: "Quick Customize",
		accent: "#e45eff",
		body: "In Quick Palette, click Quick Customize, then click an element on the page. A window opens where you name it and style it. Save adds it under Custom Elements.",
		bullets: ["Find it in the Quick Palette section"],
		visual: "quickCustomize",
		beats: 5,
		panelCategory: PANEL_CATEGORY.quickPalette,
		actionLabel: "Show Quick Palette",
	},
	{
		id: "customize-element",
		tier: "core",
		title: "Customize Elements",
		accent: "#3eadad",
		body: "In Quick Palette, click Customize Elements, then hover the page. Matching parts light up. Click one and its settings open beside it, so you can toggle them right away.",
		bullets: ["Shortcut: Alt+Shift+C turns it on or off"],
		visual: "customizeElement",
		beats: 5,
		panelCategory: PANEL_CATEGORY.quickPalette,
		actionLabel: "Show Quick Palette",
	},
	{
		id: "themes-store",
		tier: "core",
		title: "Themes and the store",
		accent: "#ff6d6d",
		body: "Themes opens your saved themes. Its Store tab browses the online store. Get downloads a theme, and Save keeps it in your collection.",
		bullets: ["Share Your Theme uploads your own theme to the store"],
		visual: "themesStore",
		beats: 4,
		panelCategory: PANEL_CATEGORY.quickPalette,
		actionLabel: "Show Quick Palette",
	},
	{
		id: "save-export",
		tier: "core",
		title: "Auto-save, export and import",
		accent: "#1932ff",
		body: "Settings save as you change them, so there is no Save button for them. Export Data copies your setup. Import Data loads one back in.",
		bullets: ["To keep a whole look as a theme, use Save in the Themes window"],
		visual: "saveExport",
		beats: 4,
		panelCategory: PANEL_CATEGORY.importExport,
		actionLabel: "Show Import / Export",
	},
	{
		id: "developer-mode",
		tier: "optional",
		title: "Developer Mode",
		accent: "#ffb020",
		body: "Turn on Developer Mode in Extension's settings to edit settings. Use + Add Setting to create one, the pencil to change it, and the trash icon to delete it.",
		bullets: ["Shortcut: Alt+Shift+A", "Drag the handle to reorder settings"],
		visual: "developerMode",
		beats: 4,
		panelCategory: PANEL_CATEGORY.extensionSettings,
		actionLabel: "Show Extension's settings",
	},
	{
		id: "more-options",
		tier: "optional",
		title: "More options",
		accent: "#4caf50",
		body: "These extras are optional. Click one to jump straight to its setting.",
		bullets: [],
		visual: "moreOptions",
		beats: 1,
	},
];
