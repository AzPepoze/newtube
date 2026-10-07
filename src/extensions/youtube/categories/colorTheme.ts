import { type Category } from "@settings/types/styleshiftTypes";
import { disableThemeByVideo, enableThemeByVideo } from "../features/theme";
import { COLOR_THEME_SELECTOR } from "./selectors";

export const colorThemeCategory: Category = {
	category: { icon: "palette", label: "Color Theme" },
	selector: COLOR_THEME_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "EnableStyleSync",
			name: "Sync YouTube Styles",
			description:
				"Forces YouTube's internal design system to use your custom colors. This ensures consistency in menus, buttons, and badges.",
			value: true,
			enableCss: `
                html,
                [watch-color-update] {
                    --ytd-chip-cloud-background: rgba(0,0,0,.3) !important;
                    --yt-spec-brand-background-primary: var(--nt-topbar-bg) !important;
                    --yt-spec-brand-background-solid: var(--nt-bg-main) !important;
                    --yt-spec-general-background-a: var(--nt-bg-main) !important;
                    --yt-spec-call-to-action: var(--nt-theme-color) !important;
                    --yt-spec-suggested-action: var(--nt-theme-accent) !important;
                    --yt-spec-badge-chip-background: var(--nt-theme-accent) !important;
                    --yt-spec-text-primary: var(--nt-text-primary) !important;
                    --yt-spec-text-secondary: var(--nt-text-secondary) !important;
                    --yt-spec-brand-button-background: var(--nt-theme-color) !important;
                    --yt-spec-static-brand-red: var(--nt-theme-color) !important;
                    --yt-spec-brand-icon-inactive: var(--nt-theme-color) !important;
                    --yt-spec-10-percelayer: var(--nt-theme-transparent) !important;
                    --yt-spec-general-background-b: transparent !important;
                    --yt-spec-wordmark-text: var(--nt-text-primary) !important;
                    --yt-spec-button-chip-background-hover: var(--nt-search-bg-hover) !important;
                    --yt-spec-text-primary-inverse: var(--nt-topbar-bg) !important;
                    --yt-spec-static-brand-white: var(--nt-text-primary) !important;
                    --yt-spec-base-background: var(--nt-topbar-bg) !important;
                    --yt-spec-raised-background: var(--nt-topbar-bg) !important;
                    --yt-spec-menu-background: var(--nt-topbar-bg) !important;
                    --yt-spec-static-overlay-text-primary: var(--nt-text-primary) !important;
                    --ytd-author-comment-badge-background-color: var(--nt-theme-transparent) !important;
                    --yt-spec-10-percent-layer: var(--nt-theme-transparent) !important;
                    --yt-spec-static-brand-black: var(--nt-text-primary) !important;
                    --yt-spec-additive-background: var(--nt-theme-transparent) !important;
                    --yt-spec-static-overlay-background-brand: var(--nt-theme-accent) !important;
                    --yt-spec-inverted-background: var(--nt-topbar-bg) !important;
                    --yt-spec-themed-blue: var(--nt-theme-color) !important;
                    --yt-live-chat-vem-background-color: var(--nt-topbar-bg) !important;
                    --ytmusic-background: transparent !important;
                    --yt-spec-themed-green: var(--nt-theme-color) !important;
                    --yt-spec-overlay-background-medium-light: var(--nt-theme-control-panel-button-group) !important;
					--yt-spec-outline: var(--nt-theme-transparent) !important;
					--yt-endpoint-hover-color: var(--nt-theme-color) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableThemeByVideo",
			name: "Dynamic Video Theme",
			description:
				"Automatically extracts the most prominent colors from the current video's thumbnail and applies them to your entire theme in real-time.",
			value: false,
			enableFunction: enableThemeByVideo,
			disableFunction: disableThemeByVideo,
		},
		{
			type: "checkbox",
			id: "EnableSolidThemeByVideo",
			name: "Solid Dynamic Background",
			description: "When using Dynamic Video Theme, this makes the background tint solid instead of semi-transparent.",
			value: false,
			require: { EnableThemeByVideo: true },
		},
		{
			type: "color",
			id: "MainThemeColor",
			name: "Primary Accent",
			description: "The main color used for highlights, active buttons, and primary UI accents.",
			value: "#659affff",
			varCss: "--nt-theme-color",
		},
		{
			type: "color",
			id: "TransparentThemeColor",
			name: "Surface Accent",
			description: "A semi-transparent version of the theme color used for hover states and subtle backgrounds.",
			value: "#659aff33",
			varCss: "--nt-theme-transparent",
		},
		{
			type: "color",
			id: "ThemeAccentColor",
			name: "Detail Accent",
			description: "A secondary accent color used for smaller details like borders and inactive badges.",
			value: "#659aff66",
			varCss: "--nt-theme-accent",
		},
		{
			type: "color",
			id: "PrimaryTextColor",
			name: "Primary Text",
			description: "Sets the color for all main text, including video titles.",
			value: "#ffffffff",
			varCss: "--nt-text-primary",
			constantCss: `
                ytd-watch-flexy,
                #video-title,
                ytd-watch-metadata #title h1 yt-formatted-string,
                .ytLockupMetadataViewModelTitle,
                .ytd-video-primary-info-renderer,
                .ytd-video-secondary-info-renderer,
                ytd-watch-metadata {
                    color: var(--nt-text-primary) !important;
                }
            `,
		},
		{
			type: "color",
			id: "SecondaryTextColor",
			name: "Secondary Text",
			description: "Sets the color for metadata, video descriptions, and comments.",
			value: "#c4c4c4ff",
			varCss: "--nt-text-secondary",
			constantCss: `
                #metadata-line,
                #metadata-line span,
                .ytd-video-meta-block,
                yt-content-metadata-view-model,
                .ytContentMetadataViewModelMetadataRow,
                #description-text,
                .ytd-comment-renderer,
                ytd-comment-view-model,
                .yt-formatted-string[is-empty] {
                    color: var(--nt-text-secondary) !important;
                }
            `,
		},
		{
			type: "color",
			id: "LinkTextColor",
			name: "Links",
			description: "The color applied to all clickable hyperlinks within YouTube.",
			value: "#5797ffff",
			varCss: "--nt-text-link",
			constantCss: `
                .yt-core-attributed-string__link {
                    color: var(--nt-text-link) !important;
                }
            `,
		},
		{
			type: "color",
			id: "TimestampTextColor",
			name: "Timestamps",
			description: "Color for the time indicators shown on video thumbnails.",
			value: "#ffffffff",
			varCss: "--nt-text-timestamp",
			constantCss: `
                ytd-thumbnail-overlay-time-status-renderer,
                yt-thumbnail-bottom-overlay-view-model,
                badge-shape.ytBadgeShapeThumbnailDefault,
                badge-shape.yt-badge-shape--thumbnail-default,
                .ytBadgeShapeThumbnailDefault .ytBadgeShapeText {
                    color: var(--nt-text-timestamp) !important;
                }
            `,
		},
		{
			type: "color",
			id: "ChannelNameColor",
			name: "Channel Titles",
			description: "Specifically sets the color for channel names in the video owner section.",
			value: "#ffffffff",
			varCss: "--nt-text-channel",
			constantCss: `
                #channel-name .ytd-video-owner-renderer {
                    color: var(--nt-text-channel) !important;
                }
            `,
		},
		{
			type: "color",
			id: "SidebarBackgroundColor",
			name: "Sidebar Surface",
			description: "Customizes the background color of the left-hand navigation menu.",
			value: "#00000000",
			varCss: "--nt-sidebar-bg",
			constantCss: `
                #guide-content,
                #guide-inner-content.ytd-app,
                #guide-renderer,
                ytd-guide-renderer,
                ytd-mini-guide-renderer {
                    background: var(--nt-sidebar-bg) !important;
                }
            `,
		},
		{
			type: "color",
			id: "ThemeOverlayColor",
			name: "Overlay Background",
			description: "Sets the background color for overlay elements like button groups in the video player.",
			value: "#5bbdff20",
			varCss: "--nt-theme-control-panel-button-group",
		},
		{
			type: "color",
			id: "EndScreenOverlayColor",
			name: "Endscreen Overlay",
			description: "The background color applied to the endscreen video grid.",
			value: "#00000080",
			varCss: "--nt-endscreen-bg",
		},
	],
};
