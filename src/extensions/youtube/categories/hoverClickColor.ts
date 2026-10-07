import { type Category } from "@settings/types/styleshiftTypes";

export const hoverClickColorCategory: Category = {
	category: { icon: "touch_app", label: "Hover & Click Color" },
	settings: [
		{
			type: "color",
			id: "GlobalHoverBackgroundColor",
			name: "Main Hover",
			description:
				"Sets the background color for most clickable elements when you hover over them, such as menu items and buttons.",
			value: "#659aff80",
			varCss: "--nt-hover-bg",
			constantCss: `
                .ytp-menuitem:hover,
				#endpoint.yt-simple-endpoint.ytd-guide-entry-renderer:hover
				{
                    background-color: var(--nt-hover-bg) !important;
                }
            `,
		},
		{
			type: "color",
			id: "PlaylistHoverBackgroundColor",
			name: "Playlist Hover",
			description: "Specific background color for video items within a playlist when hovered.",
			value: "#659aff80",
			varCss: "--nt-playlist-hover-bg",
			constantCss: `
                ytd-playlist-panel-video-renderer:hover {
                    background-color: var(--nt-playlist-hover-bg) !important;
                }
            `,
		},
		{
			type: "color",
			id: "GlobalHoverBorderColor",
			name: "Border Hover",
			description: "The color applied to outlines or shadows when you hover over an interactive element.",
			value: "#099DFFFF",
			varCss: "--nt-hover-color",
		},
		{
			type: "color",
			id: "GlobalClickBorderColor",
			name: "Border Click",
			description: "The temporary color flash for borders or shadows when you click on an element.",
			value: "#ffea00ff",
			varCss: "--nt-click-color",
		},
	],
};
