export type TutorialVisualId = "developerMode" | "quickCustomize" | "customizeElement" | "saveExport";

export interface TutorialStep {
	id: string;
	title: string;
	/** Short label shown in the topic list on the left. */
	summary: string;
	/** One or two line description shown next to the animated visual. */
	body: string;
	visual: TutorialVisualId;
	bullets: string[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
	{
		id: "developer-mode",
		title: "What is Developer Mode?",
		summary: "Unlock raw settings",
		body: "Developer Mode reveals the tools for building and editing your own settings. Everything you create is stored locally and only applies once you Save.",
		visual: "developerMode",
		bullets: [
			"Turn it on from the Developer section",
			"Create a new setting with the + button",
			"Edit any setting with the pencil button",
		],
	},
	{
		id: "quick-customize",
		title: "Quick Customize",
		summary: "Pick an element, get a setting",
		body: "Point at any part of YouTube and Quick Customize turns the visual change you want into a ready-to-save setting — no code required.",
		visual: "quickCustomize",
		bullets: [
			"Open Quick Customize, then hover the page",
			"Click the element you want to restyle",
			"Tweak the controls and review the generated CSS",
		],
	},
	{
		id: "customize-element",
		title: "Customize Element",
		summary: "Browse the known targets",
		body: "Prefer a starting point? Customize Element lists the parts of YouTube NewTube already targets, grouped by category, and jumps to the matching settings.",
		visual: "customizeElement",
		bullets: ["Browse targets by category", "See which settings already affect them", "Jump straight to the controls"],
	},
	{
		id: "save-export",
		title: "Saving and exporting",
		summary: "Keep and share your setup",
		body: "Changes are only applied when you Save. You can export your whole configuration to reuse it later or share it as a theme.",
		visual: "saveExport",
		bullets: [
			"Nothing applies until you Save",
			"Export a theme file to back up or share",
			"Import it again on any device",
		],
	},
];
