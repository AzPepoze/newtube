import type { ExposureOptions } from "./types";

export type ExposureGroupId = "content" | "settings" | "device";

export interface ExposureGroup {
	id: ExposureGroupId;
	label: string;
}

export interface ExposureSwitch {
	key: keyof ExposureOptions;
	label: string;
	hint: string;
	group: ExposureGroupId;
}

export const EXPOSURE_GROUPS: ExposureGroup[] = [
	{ id: "content", label: "Page content" },
	{ id: "settings", label: "StyleShift" },
	{ id: "device", label: "Device" },
];

export const EXPOSURE_SWITCHES: ExposureSwitch[] = [
	{ key: "text", label: "Text", hint: "Off: words show as XXXX.", group: "content" },
	{ key: "names", label: "Channel and user names", hint: "Off: names show as XXXX.", group: "content" },
	{ key: "images", label: "Images", hint: "Off: gray boxes.", group: "content" },
	{ key: "video", label: "Video poster", hint: "Off: empty player box.", group: "content" },
	{ key: "links", label: "Links and video URL", hint: "Off: no links, page URL has no video id.", group: "content" },
	{ key: "alt", label: "Alt text and tooltips", hint: "Off: removed.", group: "content" },
	{
		key: "fonts",
		label: "Icon fonts",
		hint: "On: font files are embedded so icons draw. File gets bigger.",
		group: "content",
	},
	{ key: "settings", label: "My StyleShift settings", hint: "Off: settings are removed.", group: "settings" },
	{ key: "css", label: "Injected CSS", hint: "Off: custom CSS is removed.", group: "settings" },
	{
		key: "layout",
		label: "Layout details (regions, selectors)",
		hint: "Off: page structure is removed.",
		group: "settings",
	},
	{ key: "browser", label: "Browser and OS", hint: "Off: browser and OS details are removed.", group: "device" },
	{ key: "screen", label: "Screen size", hint: "Off: screen size is removed.", group: "device" },
];
