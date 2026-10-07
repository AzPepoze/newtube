import { type Category } from "@settings/types/styleshiftTypes";
import { WATCH_DETAILS_SELECTOR } from "./selectors";

export const videoLayoutCategory: Category = {
	category: { icon: "ondemand_video", label: "Video Layout" },
	selector: WATCH_DETAILS_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "CenterVideoTitleNormal",
			name: "Center Title",
			description: "Aligns the video title and description to the center of the page when in default view.",
			value: true,
			enableCss: `
				#title.ytd-watch-metadata,
				#container.ytd-video-primary-info-renderer {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin-block: 30px;
				}
				ytd-watch-metadata.ytd-watch-flexy {
					display: flex;
					flex-direction: column;
				}
				h1.ytd-watch-metadata {
					text-align: center;
				}
			`,
		},
		{
			type: "checkbox",
			id: "CenterVideoTitleTheater",
			name: "Center Title (Theater)",
			description: "Centers the video title overlay specifically when watching in theater or fullscreen mode.",
			value: true,
			enableCss: `
				.ytp-big-mode .ytp-title-text {
					text-align: center;
				}
    		`,
		},
		{
			type: "numberSlide",
			id: "SpaceBelowVideoPlayer",
			name: "Bottom Margin",
			description: "Adds extra vertical space below the video player before the details and comments start.",
			value: 0,
			min: 0,
			max: 200,
			step: 5,
			varCss: "--nt-video-bottom-space",
			constantCss: `
				#below {
					margin-top: var(--nt-video-bottom-space, 0px) !important;
				}
    		`,
		},
		{
			type: "numberSlide",
			id: "PlaylistPanelMaxHeightNormal",
			name: "Playlist Height",
			description: "Sets the maximum height of the playlist sidebar in standard viewing mode.",
			value: 600,
			min: 200,
			max: 2000,
			step: 10,
			varCss: "--nt-playlist-height-normal",
			constantCss: `
				#items.ytd-playlist-panel-renderer,
				#container.ytd-playlist-panel-renderer,
				ytd-playlist-panel-renderer#playlist {
					max-height: var(--nt-playlist-height-normal, 600px) !important;
				}
    		`,
		},
		{
			type: "numberSlide",
			id: "PlaylistPanelMaxHeightTheater",
			name: "Playlist Height (Theater)",
			description: "Sets the maximum height of the playlist sidebar when watching in theater mode.",
			value: 800,
			min: 200,
			max: 2000,
			step: 10,
			varCss: "--nt-playlist-height-theater",
			constantCss: `
				ytd-watch-flexy[theater] #items.ytd-playlist-panel-renderer,
				ytd-watch-flexy[theater] #container.ytd-playlist-panel-renderer,
				ytd-watch-flexy[theater] ytd-playlist-panel-renderer#playlist {
					max-height: var(--nt-playlist-height-theater, 800px) !important;
				}
    		`,
		},
	],
};
