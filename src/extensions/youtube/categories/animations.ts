import { type Category } from "@settings/types/styleshiftTypes";
import { playerWatchModeSelector, ytPlayerWatchMode } from "../modules/youtube";
import { secondaryContainer } from "./enhancement";
import {
	LOCKUP_VIEW_MODEL_HORIZONTAL_SELECTOR,
	LOCKUP_VIEW_MODEL_HOST_SELECTOR,
	WATCH_SIDEBAR_SELECTOR,
} from "./selectors";

const HORIZONTAL_LOCKUP_SELECTOR = `${LOCKUP_VIEW_MODEL_HOST_SELECTOR}${LOCKUP_VIEW_MODEL_HORIZONTAL_SELECTOR}`;

export const animationCategory: Category = {
	category: { icon: "slideshow", label: "Animations" },
	selector: WATCH_SIDEBAR_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "AnimationsGlobal",
			name: "Global Animations",
			description: "Enable or disable all added animations.",
			enableCss: `
				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes fadeInLeft {
					from {
						opacity: 0;
						transform: translateX(-10px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}

				@keyframes fadeInRight {
					from {
						opacity: 0;
						transform: translateX(10px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}

				@keyframes fadeOutDown {
					from {
						opacity: 1;
						transform: translateY(0);
					}
					to {
						opacity: 0;
						transform: translateY(10px);
					}
				}
					
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 1;
					}
				}

				@keyframes fadeOut {
					from {
						opacity: 1;
					}
					to {
						opacity: 0;
					}
				}

				@keyframes scaleIn {
					from {
						opacity: 0;
						transform: scale(0.95);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				@keyframes scaleOut {
					from {
						opacity: 1;
						transform: scale(1);
					}
					to {
						opacity: 0;
						transform: scale(0.95);
					}
				}
					
				@keyframes slideIn {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes slideOut {
					from {
						opacity: 1;
						transform: translateY(0);
					}
					to {
						opacity: 0;
						transform: translateY(10px);
					}
				}
			`,
			value: true,
		},
		{
			type: "checkbox",
			id: "AnimationPageTransitions",
			name: "Page Transitions",
			description:
				"Adds a smooth fade-in and slide-in motion effect when navigating between different video pages or search results.",
			value: true,
			enableCss: `
                ytd-page-manager {
                    transition: all 0.5s;
                }
            `,
		},
		{
			type: "checkbox",
			id: "AnimationMenu",
			name: "Menu Animations",
			description:
				"Applies a polished fade and scale-up animation to all dropdown menus, context menus, and popup windows.",
			value: true,
			enableCss: `
                tp-yt-iron-dropdown {
                    transition: transform .4s, opacity .4s;
                    display: flex !important;
                }

                tp-yt-iron-dropdown:not([aria-hidden="true"]) {
                    animation: scaleIn .4s;
                }

                tp-yt-iron-dropdown[aria-hidden="true"] {
                    pointer-events: none;
                    opacity: 0 !important;
                    transform: scale(0.9) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "AnimationSearch",
			name: "Search Animation",
			description: "Adds a subtle animation to the search bar and search suggestions.",
			value: true,
			enableCss: `
                .ytSearchboxComponentInnerSearchIcon {
					animation: fadeInRight 0.2s ease-out forwards;
				}

				.ytSearchboxComponentSuggestionsContainer:not([hidden]) {
					opacity: 0;
					display: block !important;
					animation: fadeInUp 0.3s ease-out forwards;
				}

				.ytSearchboxComponentSuggestionsContainer[hidden] {
					animation: fadeOutDown 0.3s ease-out forwards;
					pointer-events: none;
				}

				.ytSearchboxComponentClearButtonWrapper {
					animation: scaleIn 0.2s ease-out forwards;
				}
            `,
		},
		{
			type: "checkbox",
			id: "AnimationVideoTransitions",
			name: "Smooth Loading",
			description:
				"Adds a subtle fade and scale animation when a new video starts playing, making the transition between videos feel more premium.",
			value: true,
			enableCss: `
				.html5-video-container {
					transition: all 1s, background 0.1s;
				}
					
				div.ended-mode .html5-video-container,
				div.unstarted-mode:not(.ytp-small-mode) .html5-video-container {
					opacity: 0 !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "AnimationThumbnailPreview",
			name: "Thumbnail Previews Animation",
			description: "Adds a subtle fade-in animation to thumbnail previews.",
			value: true,
			enableCss: `
				@keyframes thumbnailPreviewAnimation {
					from {
						opacity: 0;
						transform: scale(1.1);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				animated-thumbnail-overlay-view-model {
					animation: thumbnailPreviewAnimation 0.2s forwards;
				}
			`,
		},
		{
			type: "checkbox",
			id: "AnimationThumbnailButton",
			name: "Thumbnail Button Animation",
			description: "Adds a subtle slide animation to thumbnail buttons.",
			value: true,
			enableCss: `
				@keyframes thumbnailButtonShow {
					from {
						opacity: 0;
						transform: translateX(40px) rotate(45deg);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}

				yt-thumbnail-hover-overlay-toggle-actions-view-model {
					opacity: 0;
					animation: thumbnailButtonShow 0.5s forwards;
				}
			`,
		},
		{
			type: "checkbox",
			id: "AnimationThumbnailOverlay",
			name: "Thumbnail Overlay Animation",
			description: "Adds a subtle slide animation to thumbnail overlays.",
			value: true,
			enableCss: `
				@keyframes thumbnailOverlayShow {
					from {
						opacity: 0;
						transform: scale(1.05);
					}
					to {
						opacity: 1;
						transform: scale(1);
					}
				}

				thumbnail-hover-overlay-view-model {
					animation: thumbnailOverlayShow 0.3s forwards;
				}
			`,
		},
		{
			type: "checkbox",
			id: "ThumbnailSlideOnHoverAnimation",
			name: "Thumbnail Slide On Hover",
			description: "Adds a subtle slide animation to thumbnail buttons.",
			value: true,
			enableCss: `
				yt-lockup-view-model.ytd-watch-next-secondary-results-renderer > ${HORIZONTAL_LOCKUP_SELECTOR},
				yt-lockup-view-model.ytd-item-section-renderer > ${HORIZONTAL_LOCKUP_SELECTOR} {
					transition: all 0.15s ease-out;
				}

				yt-lockup-view-model.ytd-watch-next-secondary-results-renderer:hover > ${HORIZONTAL_LOCKUP_SELECTOR},
				yt-lockup-view-model.ytd-item-section-renderer:hover > ${HORIZONTAL_LOCKUP_SELECTOR} {
					transform: translateX(-10px) !important;
				}
			`,
		},
		{
			type: "conditionSetting",
			id: "ThumbnailSlideOnHoverAnimationPadding",
			name: "Thumbnail Slide On Hover Animation",
			condition: {
				EnhancementSwapLayout: false,
			},
			enableCss: `
				${secondaryContainer} {
					padding-left: 20px !important;
					margin-left: -20px !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "AnimationVideoControlsPanel",
			name: "Video Controls Panel Animation",
			description: "Adds a subtle fade and slide animation to the video controls panel.",
			value: true,
			enableCss: `
				${ytPlayerWatchMode} .ytp-chrome-bottom {
					width: 98% !important;
					left: unset !important;
					transition: all 0.4s;
				}
			`,
		},
		{
			type: "conditionSetting",
			id: "AnimationVideoControlsPanelAutohide",
			condition: {
				AnimationVideoControlsPanel: true,
				EnableControlPanelAutohide: true,
			},
			enableCss: `
				${ytPlayerWatchMode} .ytp-autohide .ytp-chrome-bottom {
					width: 0px !important;
					left: unset !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "AnimationHoverVideoPreview",
			name: "Player Controls Hover Preview Animation",
			description:
				"Adds scale and fade animations to the video preview that appears when hovering over the progress bar.",
			value: true,
			enableCss: `
				${playerWatchModeSelector} .ytp-tooltip {
					display: block !important;
					transition: all 0.15s ease-out;
					pointer-events: none;
				}

				${playerWatchModeSelector}:not(.ytp-progress-bar-hover) .ytp-tooltip {
					transform: scale(1.1);
					opacity: 0 !important;
				}
			`,
		},
	],
};
