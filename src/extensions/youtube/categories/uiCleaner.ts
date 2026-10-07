import { type Category } from "@settings/types/styleshiftTypes";
import { SIDEBAR_SELECTOR } from "./selectors";

export const uiCleanerCategory: Category = {
	category: { icon: "layers_clear", label: "UI Cleaner" },
	selector: SIDEBAR_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "HideShortsEverywhere",
			name: "Hide Shorts",
			description: "Completely removes 'Shorts' from the sidebar, the home feed, and all recommended sections.",
			value: false,
			enableCss: `
                ytd-guide-entry-renderer:has(path[d^="M10 14.65v-5.3L15 12l-5 2.65"]),
                ytd-rich-shelf-renderer[is-shorts],
                ytd-reel-shelf-renderer {
                    display: none !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "HideTheaterModeBackground",
			name: "Clear Theater BG",
			description:
				"Removes the default black background that appears behind the video player when YouTube is in theater mode.",
			value: true,
			enableCss: `
                #full-bleed-container:has(div.html5-video-player:not(.ytp-fullscreen)) {
                    background-color: transparent !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "RemoveChannelBannerBg",
			name: "Remove BG for Channel Banner",
			description: "Removes the background from the channel banner header.",
			value: true,
			enableCss: `
                #page-header-container.ytd-tabbed-page-header,
                yt-page-header-view-model {
                    background: transparent !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "HideSidebarYourChannel",
			name: "Hide 'Your Channel'",
			description: "Removes the link to your own channel from the left-hand navigation sidebar.",
			value: false,
			enableCss: `
                #section-items > ytd-guide-entry-renderer:nth-child(2) {
                    display: none !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "HideSidebarYourVideos",
			name: "Hide 'Your Videos'",
			description: "Removes the link to your uploaded videos from the left-hand navigation sidebar.",
			value: false,
			enableCss: `
                #section-items > ytd-guide-entry-renderer:nth-child(4) {
                    display: none !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "HideSidebarExplore",
			name: "Hide Explore",
			description: "Removes the 'Explore' section (Trending, Music, Gaming, etc.) from the sidebar.",
			value: false,
			enableCss: `
                ytd-guide-section-renderer:has(path[d^="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2"]) {
                    display: none !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "HideSidebarMoreFromYouTube",
			name: "Hide 'More From YT'",
			description: "Removes the 'More from YouTube' section (Premium, Music, Kids) from the sidebar.",
			value: false,
			enableCss: `
                ytd-guide-section-renderer:has([href="/premium"]),
				ytd-guide-section-renderer:has([href="https://music.youtube.com/"])
				{
                    display: none !important;
                }
            `,
		},
	],
};
