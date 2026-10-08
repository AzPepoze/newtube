import { PANEL_CATEGORY } from "../tutorialSteps";

export interface PaletteItem {
	id: string;
	label: string;
	icon: string;
	color: string;
}

export interface PanelNavItem {
	label: string;
	icon: string;
}

/** Same buttons and colors as the Quick Palette section of the panel. */
export const QUICK_PALETTE_ITEMS: PaletteItem[] = [
	{ id: "themes", label: "Themes", icon: "collections", color: "#7f5db7" },
	{ id: "explore", label: "Explore Themes", icon: "storefront", color: "#ff6d6d" },
	{ id: "share", label: "Share Your Theme", icon: "ios_share", color: "#ffb020" },
	{ id: "quickCustomize", label: "Quick Customize", icon: "auto_fix_high", color: "#e45eff" },
	{ id: "customizeElements", label: "Customize Elements", icon: "highlight_alt", color: "#3eadad" },
	{ id: "tutorial", label: "Tutorial", icon: "school", color: "#ffb020" },
	{ id: "fullSettings", label: "Full Settings Page", icon: "display_settings", color: "#646464" },
];

export const PANEL_NAV: PanelNavItem[] = [
	{ label: PANEL_CATEGORY.quickPalette, icon: "settings_input_component" },
	{ label: PANEL_CATEGORY.extensionSettings, icon: "settings" },
	{ label: PANEL_CATEGORY.importExport, icon: "swap_vert" },
];

export const CUSTOM_NAV: PanelNavItem = { label: PANEL_CATEGORY.customElements, icon: "auto_awesome" };
