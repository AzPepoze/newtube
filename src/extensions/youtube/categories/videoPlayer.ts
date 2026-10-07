import { IS_FIREFOX } from "@core/index";
import { type Category } from "@settings/types/styleshiftTypes";
import { setupVideoAnimations } from "../features/video/animations";
import { setupAutoTheater } from "../features/video/general";
import { disableAutoPip, enableAutoExitPip, enableAutoPip } from "../features/video/pip";
import { PLAYER_SELECTOR } from "./selectors";

export const videoPlayerCategory: Category = {
	category: { icon: "play_circle", label: "Video Player" },
	selector: PLAYER_SELECTOR,
	settings: [
		{
			type: "numberSlide",
			id: "VideoPlayerCornerRadius",
			name: "Player Roundness",
			description:
				"Controls how rounded the corners of the main video player are. Higher values create a softer, more modern look.",
			value: 20,
			min: 0,
			max: 60,
			step: 1,
			varCss: "--nt-player-radius",
			constantCss: `
				.html5-video-player {
					border-radius: var(--nt-player-radius, 20px) !important;
				}
				#movie_player .ytp-cued-thumbnail-overlay {
					border-radius: var(--nt-player-radius, 20px) !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "EnableEnhancedVideoAnimations",
			name: "Enhanced UI",
			description:
				"Replaces standard YouTube volume and play/pause indicators with modern, high-quality animated versions.",
			value: true,
			enableFunction: setupVideoAnimations,
			enableCss: `
				.newtube-vol-indicator {
					position: absolute;
					top: -10%;
					left: 50%;
					transform: translateX(-50%);
					background: rgba(0, 0, 0, 0.6);
					color: white;
					padding: 10px 20px;
					border-radius: 20px;
					font-size: 24px;
					font-weight: bold;
					opacity: 0;
					transition: opacity 0.3s, top 0.3s;
					pointer-events: none;
					z-index: 50;
					backdrop-filter: blur(5px);
					box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
				}
				.newtube-vol-indicator.show {
					opacity: 1;
					top: 10px;
				}

				/* Youtube Bezel (Play/Pause/Seek arrows) Customization */
				.ytp-bezel-text-wrapper {
					display: none !important;
				}
				.ytp-bezel {
					background: rgba(0, 0, 0, 0.7) !important;
					border-radius: 50% !important;
					backdrop-filter: blur(4px);
					box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
				}
				.ytp-bezel-icon {
					fill: white !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "EnableAutoTheaterMode",
			name: "Auto Theater",
			description:
				"Automatically switches the player to 'Theater Mode' every time you open a new video for a larger viewing area.",
			value: false,
			enableFunction: setupAutoTheater,
		},
		{
			type: "checkbox",
			id: "EnableFullTheaterMode",
			name: "Full-Height Mode",
			description: "Extends theater mode to fill the entire height of your window, hiding the header until you scroll.",
			value: false,
			enableCss: `
				ytd-watch-flexy[theater]:not([fullscreen]) #full-bleed-container.ytd-watch-flexy {
					height: calc(100vh - 56px) !important;
					max-height: unset !important;
				}
			`,
		},
		{
			type: "checkbox",
			id: "EnableAutoPictureInPicture",
			name: "Auto PiP",
			description:
				"Automatically shrinks the video into a small floating window when you switch browser tabs.\n\nNote: Need to click somewhere on the page after back to the tab to make the Auto PiP work.\n(Security limitations sorry for inconvenience.)",
			value: false,
			enableFunction: enableAutoPip,
			disableFunction: disableAutoPip,
			lock: {
				condition: IS_FIREFOX,
				message: "Picture-in-Picture functionality has security limitations in Firefox, I can't do anything I'm sorry.",
			},
		},
		{
			type: "checkbox",
			id: "EnableAutoExitPictureInPicture",
			name: "Auto Exit PiP",
			description: "Automatically restores the video to the main page as soon as you return to the tab.",
			value: false,
			enableFunction: enableAutoExitPip,
			disableFunction: disableAutoPip,
			lock: {
				condition: IS_FIREFOX,
				message: "Picture-in-Picture functionality has security limitations in Firefox, I can't do anything I'm sorry.",
			},
		},
		{
			type: "color",
			id: "EndScreenVideoHoverColor",
			hoverPreview: { selectors: ["#ytd-player .ytp-videowall-still-info-content"] },
			name: "Endscreen Hover",
			description: "The highlight color that appears when hovering over suggested videos at the end of a playback.",
			value: "#00000050",
			varCss: "--nt-endscreen-hover-bg",
			constantCss: `
      .ytp-videowall-still:hover .ytp-videowall-still-info-content {
        background: var(--nt-endscreen-hover-bg, #00000050) !important;
      }
    `,
		},
	],
};
