import { type Category } from "@settings/types/styleshiftTypes";
import {
	THUMBNAIL_DEFAULT_BADGE_SELECTOR,
	THUMBNAIL_LIVE_BADGE_SELECTOR,
	THUMBNAIL_SELECTOR,
	THUMBNAIL_TIME_SELECTOR,
	THUMBNAIL_TIME_SELECTORS,
} from "./selectors";

export const thumbnailCategory: Category = {
	category: { icon: "image_search", label: "Thumbnail & Clip Cover" },
	selector: THUMBNAIL_SELECTOR,
	settings: [
		{
			type: "numberSlide",
			id: "ThumbnailTimeCornerRadius",
			hoverPreview: { selectors: THUMBNAIL_TIME_SELECTORS },
			name: "Time Corner Radius",
			description: "Adjusts the corner roundness of the video duration timestamp shown on thumbnails.",
			value: 10,
			min: 0,
			max: 30,
			step: 1,
			varCss: "--nt-timestamp-radius",
			constantCss: `${THUMBNAIL_TIME_SELECTOR} { border-radius: var(--nt-timestamp-radius, 10px) !important; }`,
		},
		{
			type: "color",
			id: "ThumbnailTimeBackgroundColor",
			hoverPreview: { selectors: ["ytd-thumbnail-overlay-time-status-renderer", THUMBNAIL_DEFAULT_BADGE_SELECTOR] },
			name: "Time Background",
			description: "Sets the background color of the duration timestamp on video thumbnails.",
			value: "#00000080",
			varCss: "--nt-timestamp-bg",
			constantCss: `ytd-thumbnail-overlay-time-status-renderer, ${THUMBNAIL_DEFAULT_BADGE_SELECTOR} { background-color: var(--nt-timestamp-bg, #00000080) !important; }`,
		},
		{
			type: "color",
			id: "ThumbnailLiveBadgeBackgroundColor",
			hoverPreview: { selectors: [THUMBNAIL_LIVE_BADGE_SELECTOR] },
			name: "Live Badge Background",
			description: "Sets the background color of the LIVE badge shown on video thumbnails.",
			value: "#ff0033ff",
			varCss: "--nt-thumbnail-live-badge-bg",
			constantCss: `${THUMBNAIL_LIVE_BADGE_SELECTOR} { background-color: var(--nt-thumbnail-live-badge-bg, #ff0033ff) !important; }`,
		},
		{
			type: "color",
			id: "ThumbnailLiveBadgeTextColor",
			hoverPreview: { selectors: [THUMBNAIL_LIVE_BADGE_SELECTOR] },
			name: "Live Badge Text",
			description: "Sets the text color of the LIVE badge shown on video thumbnails.",
			value: "#ffffffff",
			varCss: "--nt-thumbnail-live-badge-text",
			constantCss: `${THUMBNAIL_LIVE_BADGE_SELECTOR} { color: var(--nt-thumbnail-live-badge-text, #ffffffff) !important; }`,
		},
		{
			type: "numberSlide",
			id: "ThumbnailTimeHeight",
			hoverPreview: { selectors: THUMBNAIL_TIME_SELECTORS },
			name: "Time Height",
			description: "Adjusts the vertical size of the timestamp indicator.",
			value: 20,
			min: 0,
			max: 100,
			step: 1,
			varCss: "--nt-timestamp-height",
			unit: "px",
			constantCss: `${THUMBNAIL_TIME_SELECTOR} { height: var(--nt-timestamp-height, 12px) !important; }`,
		},
		{
			type: "checkbox",
			id: "ThumbnailTimeBorderEnabled",
			hoverPreview: { selectors: THUMBNAIL_TIME_SELECTORS },
			name: "Time Borders",
			description: "Applies borders or shadows to the thumbnail time indicator based on your global settings.",
			value: true,
			enableCss: `${THUMBNAIL_TIME_SELECTOR} {
				box-shadow: var(--nt-global-shadow) !important;
				border: var(--nt-global-outline) !important;
			}`,
		},
		{
			type: "checkbox",
			id: "ThumbnailTimeHideOnHover",
			hoverPreview: { selectors: ["yt-thumbnail-bottom-overlay-view-model"] },
			name: "Hide Time on Hover",
			description:
				"Automatically fades out the duration timestamp when you hover over a thumbnail, keeping the image clear.",
			value: true,
			enableCss: `
                yt-thumbnail-bottom-overlay-view-model {
                    transition: all .2s ease-out;
                }
                yt-thumbnail-view-model:hover yt-thumbnail-bottom-overlay-view-model {
                    opacity: 0 !important;
					transform: translateY(5px) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "ThumbnailTimeCenterEnabled",
			hoverPreview: { selectors: ["yt-thumbnail-bottom-overlay-view-model"] },
			name: "Center Time Overlay",
			description:
				"Centers the duration timestamp and bottom panel on thumbnails instead of keeping them in the corner.",
			value: true,
			enableCss: `
				yt-thumbnail-bottom-overlay-view-model {
					z-index: 1;
					border-radius: var(--nt-timestamp-radius, 10px) !important;
				}
				
                yt-thumbnail-bottom-overlay-view-model,
                yt-thumbnail-bottom-overlay-view-model .ytThumbnailBottomOverlayViewModelBadgeContainer,
                yt-thumbnail-bottom-overlay-view-model yt-thumbnail-badge-view-model,
				yt-thumbnail-bottom-overlay-view-model badge-shape {
                    width: 100% !important;
                    margin: 0px !important;
                    padding: 0px !important;
                    bottom: 0px;
                    justify-content: center !important;
					text-align: center !important;
					position: absolute;
                }
            `,
		},
		{
			type: "checkbox",
			id: "ThumbnailHoverOverlayEnabled",
			hoverPreview: { selectors: ["ytd-thumbnail", "ytd-playlist-thumbnail", "yt-thumbnail-view-model"] },
			name: "Hover Glow Effect",
			description: "Adds a glowing border or shadow when you hover over a video thumbnail.",
			value: true,
			enableCss: `
                ytd-thumbnail:hover,
                ytd-playlist-thumbnail:hover,
                yt-thumbnail-view-model:hover {
                    outline: var(--nt-hover-border-width, 1px) solid var(--nt-hover-color) !important;
                    box-shadow: 0 0 15px var(--nt-hover-color) !important;
                }
                ytd-thumbnail:active,
                ytd-playlist-thumbnail:active,
                yt-thumbnail-view-model:active {
                    outline-color: var(--nt-click-color) !important;
                }
            `,
		},
		{
			type: "color",
			id: "ThumbnailHoverBorderColor",
			hoverPreview: { selectors: ["ytd-thumbnail", "ytd-playlist-thumbnail", "yt-thumbnail-view-model"] },
			name: "Hover Glow Color",
			description: "Sets the color of the glow and outline when a thumbnail is hovered.",
			value: "#659affff",
			varCss: "--nt-hover-color",
			require: { ThumbnailHoverOverlayEnabled: true },
		},
		{
			type: "color",
			id: "ThumbnailClickBorderColor",
			hoverPreview: { selectors: ["ytd-thumbnail", "ytd-playlist-thumbnail", "yt-thumbnail-view-model"] },
			name: "Click Glow Color",
			description: "Sets the color of the border at the moment you click a thumbnail.",
			value: "#ffffffff",
			varCss: "--nt-click-color",
			require: { ThumbnailHoverOverlayEnabled: true },
		},
		{
			type: "numberSlide",
			id: "ThumbnailHoverBorderWidth",
			hoverPreview: { selectors: ["ytd-thumbnail", "ytd-playlist-thumbnail", "yt-thumbnail-view-model"] },
			name: "Glow Border Width",
			description: "Adjusts the thickness of the hover glow border.",
			value: 1,
			min: 0,
			max: 10,
			step: 1,
			varCss: "--nt-hover-border-width",
			require: { ThumbnailHoverOverlayEnabled: true },
		},
		{
			type: "numberSlide",
			id: "ThumbnailHoverZoomScale",
			hoverPreview: { selectors: ["ytd-thumbnail", "ytd-playlist-thumbnail", "yt-thumbnail-view-model"] },
			name: "Zoom Intensity",
			description: "Adjusts how much the thumbnail grows when 'Zoom' animation is selected.",
			value: 1.075,
			min: 1,
			max: 1.5,
			step: 0.005,
			varCss: "--nt-zoom-scale",
			require: { ThumbnailHoverAnimationStyle: ["Zoom", "Slide&Zoom"] },
		},
		{
			type: "checkbox",
			id: "ThumbnailLoadAnimationEnabled",
			hoverPreview: { selectors: ["yt-lockup-view-model", "ytd-video-renderer"] },
			name: "Load Animation",
			description: "Adds a smooth fade and lift effect when thumbnails first appear on the page.",
			value: true,
			enableCss: `
				@keyframes thumbnailXLoadAnimation {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				yt-lockup-view-model,
				ytd-video-renderer {
					opacity: 0;
				}

                yt-lockup-view-model:has(.ytCoreImageLoaded),
				ytd-video-renderer:has(.ytCoreImageLoaded) {
                    animation: thumbnailXLoadAnimation 0.5s forwards;
				}
            `,
		},
	],
};
