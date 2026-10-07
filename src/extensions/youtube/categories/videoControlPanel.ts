import { type Category } from "@settings/types/styleshiftTypes";
import {
	ytPlayerWatchMode,
	ytTheaterModeContainer,
	ytVideoContainerWatchMode,
	ytdPlayerWatchMode,
} from "../modules/youtube";
import { setupDetachControlsAspectGuard } from "../features/video/detachControlsAspectGuard";
import { PLAYER_SELECTOR } from "./selectors";

const DETACH_CONTROLS_RATIO_SELECTOR = "html.nt-detach-controls-16x9";

export const videoControlPanelCategory: Category = {
	category: { icon: "settings_input_component", label: "Video Control Panel" },
	selector: PLAYER_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "EnableControlsBelowVideo",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom"] },
			name: "Detach Controls",
			description:
				"Moves the entire video control bar (play, volume, settings) from an overlay on top of the video to a dedicated space directly underneath it.",
			value: true,
			setupFunction: setupDetachControlsAspectGuard,
			enableCss: `
				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytdPlayerWatchMode},
				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytPlayerWatchMode}
				{
					padding-bottom: var(--nt-player-below-space, 70px) !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytTheaterModeContainer} {
					margin-bottom: var(--nt-player-below-space, 70px) !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} {
					overflow: visible !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .ytp-chrome-bottom,
				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .ytp-gradient-bottom,
				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .ytp-tooltip {
					overflow: visible !important;
					transform: translateY(var(--nt-player-below-space, 70px)) !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .ytp-chrome-bottom {
					padding-top: 0px !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} #ytp-caption-window-container,
				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .ytp-overlays-container {
					height: 100% !important;
				}

				${DETACH_CONTROLS_RATIO_SELECTOR} ${ytVideoContainerWatchMode} .caption-window.ytp-caption-window-bottom {
					margin-bottom: 0px !important;
				}
			`,
		},
		{
			type: "numberSlide",
			id: "ControlsBelowVideoDistance",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom"] },
			name: "Detach Gap",
			description: "Adjusts the vertical distance between the video player and the detached control bar.",
			value: 75,
			min: 30,
			max: 200,
			step: 1,
			varCss: "--nt-player-below-space",
			require: { EnableControlsBelowVideo: true },
		},
		{
			type: "checkbox",
			id: "EnableCenteredControls",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-controls"] },
			name: "Center Buttons",
			description: "Re-aligns the play, volume, and playback buttons to the exact center of the control bar.",
			value: true,
			enableCss: `
				.ytp-chrome-controls {
					display: flex !important;
					flex-direction: row !important;
					justify-content: center !important;
				}
				.ytp-left-controls,
				.ytp-chapter-title.ytp-button,
				.ytp-chapter-container {
					display: contents !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "EnableControlPanelAutohide",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom", "#ytd-player .ytp-gradient-bottom"] },
			name: "Auto-Hide Bar",
			description: "Automatically hides the control bar when your mouse is not moving over the player.",
			value: true,
			disableCss: `
                div.html5-video-player:not(.ytp-fullscreen):not(.ytp-embed):not(.ytp-live).ytp-autohide .ytp-gradient-bottom,
                div.html5-video-player:not(.ytp-fullscreen):not(.ytp-embed):not(.ytp-live).ytp-autohide .ytp-chrome-bottom {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableControlPanelButtonHoverScale",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom .ytp-button"] },
			name: "Button Pop",
			description: "Makes control icons grow slightly when you hover over them for better interactive feedback.",
			value: true,
			enableCss: `
                .ytp-chrome-bottom .ytp-button,
                .ytp-replay-button,
                .ytp-cards-button-icon {
                    transition: transform .2s !important;
                }
				
                .ytp-chrome-bottom .ytp-button:hover,
                .ytp-replay-button:hover,
                .ytp-cards-button-icon:hover {
                    transform: scale(1.5) !important;
                }
            `,
		},
		{
			type: "color",
			id: "ControlPanelBackgroundColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Bar Color",
			description: "Sets the background color of the main video control strip.",
			value: "#00000080",
			varCss: "--nt-player-bg",
			constantCss: `
			.ytp-gradient-bottom {
				background-color: var(--nt-player-bg) !important;
			}
			`,
		},
		{
			type: "checkbox",
			id: "EnableControlPanelBlur",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Glass Effect",
			description: "Applies a frosted-glass blur effect to the background of the video control bar.",
			value: true,
			enableCss: `
                .ytp-gradient-bottom {
                    backdrop-filter: blur(var(--nt-player-blur-amount, 10px)) !important;
                }
            `,
		},
		{
			type: "numberSlide",
			id: "ControlPanelBlurAmount",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Glass Intensity",
			description: "Adjusts the strength of the frosted-glass effect on the control bar.",
			value: 10,
			min: 0,
			max: 50,
			step: 1,
			varCss: "--nt-player-blur-amount",
			require: { EnableControlPanelBlur: true },
		},
		{
			type: "checkbox",
			id: "EnableControlPanelRemoveGradient",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Remove Default Gradient",
			description: "Removes the default dark gradient at the bottom of the video player.",
			value: false,
			enableCss: `.ytp-gradient-bottom { background-image: none !important; }`,
		},
		{
			type: "color",
			id: "ControlPanelTextColor",
			hoverPreview: {
				selectors: [
					"#ytd-player .ytp-time-display",
					"#ytd-player .ytp-chrome-bottom .ytp-button",
					"#ytd-player .ytp-volume-slider-handle",
				],
			},
			name: "Icon Color",
			description: "Changes the color of the icons, timestamps, and sliders within the video control bar.",
			value: "#ffffffff",
			varCss: "--nt-control-panel-icon-color",
			constantCss: `
				.ytp-time-contents *,
				.ytp-time-current,
				.ytp-time-separator,
				.ytp-time-duration
				 {
					color: var(--nt-control-panel-icon-color) !important;
				}
				
				div.ytp-chrome-controls path
				{
					fill: var(--nt-control-panel-icon-color) !important;
				}

				.ytp-autonav-toggle-button[aria-checked="true"]::after
				{
					background-color: var(--nt-control-panel-icon-color) !important;
				}

				.ytp-autonav-toggle-button
				{
					background-color: color-mix(in srgb, var(--nt-control-panel-icon-color) 50%, transparent 100%) !important;
				}

				.ytp-volume-slider-handle,
				.ytp-volume-slider-handle::before
				{
					background: var(--nt-control-panel-icon-color) !important;
					background-color: var(--nt-control-panel-icon-color) !important;
				}

				.ytp-swatch-color {
					color: var(--nt-control-panel-icon-color) !important;
				}
			`,
		},
		{
			type: "color",
			id: "ControlPanelButtonGroupColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom .ytp-button"] },
			name: "Button Group Color",
			description:
				"Sets the background color for groups of buttons within the control bar, such as the play button or volume control.",
			value: "#5bbdff20",
			varCss: "--nt-player-button-group-bg",
			constantCss: `
				#movie_player {
					--yt-spec-overlay-background-medium-light: var(--nt-player-button-group-bg) !important;
				}
    		`,
		},
		{
			type: "color",
			id: "ControlPanelButtonHoverColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom .ytp-button"] },
			name: "Hover Glow",
			description: "Sets the background highlight color when you hover over any button in the control bar.",
			value: "#5bbdff20",
			varCss: "--nt-theme-control-panel-hover",
			constantCss: `
				#movie_player {
					--yt-spec-overlay-button-secondary: var(--nt-theme-control-panel-hover) !important;
				}
    		`,
		},
		{
			type: "color",
			id: "ControlPanelPopupBackgroundColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-popup", "#ytd-player .ytp-settings-menu"] },
			name: "Popup Color",
			description: "Customizes the background color for all in-player popups.",
			value: "#00000080",
			varCss: "--nt-player-popup-bg",
			constantCss: `
				#movie_player .ytp-popup,
				#movie_player .ytp-settings-menu {
					background-color: var(--nt-player-popup-bg) !important;
				}
			`,
		},
		{
			type: "numberSlide",
			id: "ControlPanelBackgroundHeight",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Bar Height",
			description: "Increases or decreases the height of the control bar's background.",
			value: 70,
			min: 30,
			max: 150,
			step: 1,
			varCss: "--nt-player-bg-height",
			constantCss: `
                .ytp-gradient-bottom { height: var(--nt-player-bg-height, 60px) !important; }
            `,
		},
		{
			type: "checkbox",
			id: "EnableControlPanelBorder",
			hoverPreview: { selectors: ["#ytd-player .ytp-gradient-bottom"] },
			name: "Borders & Shadows",
			description: "Applies your global outline or glow shadow settings to the video control bar.",
			value: false,
			enableCss: `
                .ytp-gradient-bottom {
                    box-shadow: var(--nt-global-shadow) !important;
                    border: var(--nt-global-outline) !important;
                }
            `,
		},
		{
			type: "numberSlide",
			id: "ControlPanelBorderWidth",
			hoverPreview: { selectors: ["#ytd-player .ytp-chrome-bottom", "#ytd-player .ytp-gradient-bottom"] },
			name: "Local Border Width",
			description: "Overrides the global border width specifically for the video player's controls.",
			value: 1,
			min: 0,
			max: 20,
			step: 1,
			varCss: "--nt-player-border-width",
			require: { EnableControlPanelBorder: true },
		},
		{
			type: "color",
			id: "TimelineBackgroundColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-progress-bar"] },
			name: "Timeline Track",
			description: "Sets the color of the unplayed/background portion of the video progress bar.",
			value: "#ffffff20",
			varCss: "--nt-timeline-bg",
			constantCss: `
      .ytp-progress-bar {
        background-color: var(--nt-timeline-bg, #ffffff20) !important;
      }
    `,
		},
		{
			type: "color",
			id: "TimelineLoadedColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-load-progress"] },
			name: "Timeline Buffer",
			description: "Sets the color of the buffered/loaded portion of the progress bar.",
			value: "#ffffff50",
			varCss: "--nt-timeline-load",
			constantCss: `
      .ytp-load-progress {
        background: var(--nt-timeline-load, #ffffff50) !important;
      }
    `,
		},
	],
};
