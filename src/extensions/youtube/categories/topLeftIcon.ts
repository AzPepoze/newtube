import { type Category } from "@settings/types/styleshiftTypes";
import { disableTopLeftIconChanger, enableTopLeftIconChanger } from "../features/topLeftIcon";
import { TOP_LEFT_ICON_SELECTOR } from "./selectors";

// Restores the wordmark and play symbol to their native colors so the global
// Accent Integration fill rule only recolors the play button.
const LOGO_NATIVE_PARTS_CSS = `
    #logo-icon svg [id^="youtube-paths"] path,
    #logo-icon svg > g:nth-child(2) path {
        fill: currentColor !important;
    }
    #logo-icon svg > g:first-child > path:nth-child(2) {
        fill: #fff !important;
    }
`;

const LOGO_PLAY_BUTTON_SELECTOR = `
    #logo-icon svg > g:first-child > path:first-child,
    #logo-icon svg path[fill="#FF0033"],
    #logo-icon svg path[fill="#FF0000"]
`;

export const topLeftIconCategory: Category = {
	category: { icon: "featured_video", label: "Top-Left Icon" },
	selector: TOP_LEFT_ICON_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "EnableCustomTopLeftIcon",
			name: "Custom Logo",
			description: "Replaces the default YouTube logo in the top-left corner with your own image or animated GIF.",
			value: true,
			setupFunction: enableTopLeftIconChanger,
			disableFunction: disableTopLeftIconChanger,
			enableCss: `
                ytd-topbar-logo-renderer .ytd-topbar-logo-renderer {
                    opacity: 0;
                }
                ytd-topbar-logo-renderer {
                    display: flex !important;
                    align-items: center;
                    justify-content: flex-start;
                    height: 56px !important;
                    min-width: 40px;
					position: relative;
                }
                #nt-custom-logo {
                    height: 100% !important;
                    width: auto !important;
                    object-fit: contain;
                    transform: var(--nt-top-icon-flip) scale(--nt-top-icon-size);
                    transition: height 0.2s;
					position: absolute;
					left: -50%;
					top: -50%;
					pointer-events: none;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableTopLeftIconSyncTheme",
			name: "Sync Logo Color",
			description:
				"Makes the play button of the default YouTube logo match your main theme color. The play symbol and wordmark keep their native colors. This setting is ignored if a 'Custom Logo' is enabled.",
			value: true,
			enableCss: `
                ${LOGO_NATIVE_PARTS_CSS}
                ${LOGO_PLAY_BUTTON_SELECTOR} {
                    fill: var(--nt-theme-color, #FF0000) !important;
                }
            `,
			disableCss: `
                ${LOGO_NATIVE_PARTS_CSS}
                ${LOGO_PLAY_BUTTON_SELECTOR} {
                    fill: var(--nt-logo-play-color, #FF0000) !important;
                }
            `,
			require: { EnableCustomTopLeftIcon: false },
		},
		{
			type: "color",
			id: "TopLeftIconPlayTriangleColor",
			name: "Logo Play Button Color",
			description:
				"Sets the color of the play button in the default YouTube logo when 'Sync Logo Color' is off. Defaults to YouTube red and stays independent of your main theme color.",
			value: "#FF0000",
			varCss: "--nt-logo-play-color",
			require: { EnableCustomTopLeftIcon: false },
		},
		{
			type: "imageInput",
			id: "TopLeftIconImageUrl",
			name: "Logo Image",
			description: "Upload or paste a URL for your custom logo. Transparent PNGs or GIFs work best.",
			value: "https://i.gifer.com/17xo.gif",
			maxFileSize: 2000000,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconSize",
			name: "Logo Size",
			description: "Adjusts the scale of your custom logo to fit perfectly within the header bar.",
			value: 0.7,
			min: 0.05,
			max: 20,
			step: 0.05,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconPositionX",
			name: "Position X",
			description: "Fine-tune the horizontal alignment of the custom logo.",
			value: 50,
			min: -500,
			max: 500,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconPositionY",
			name: "Position Y",
			description: "Fine-tune the vertical alignment of the custom logo.",
			value: 50,
			min: -500,
			max: 500,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconCropTop",
			name: "Crop Top (%)",
			description: "Crop edges from the top of the logo non-destructively.",
			value: 0,
			min: 0,
			max: 100,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconCropBottom",
			name: "Crop Bottom (%)",
			description: "Crop edges from the bottom of the logo non-destructively.",
			value: 0,
			min: 0,
			max: 100,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconCropLeft",
			name: "Crop Left (%)",
			description: "Crop edges from the left of the logo non-destructively.",
			value: 0,
			min: 0,
			max: 100,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "numberSlide",
			id: "TopLeftIconCropRight",
			name: "Crop Right (%)",
			description: "Crop edges from the right of the logo non-destructively.",
			value: 0,
			min: 0,
			max: 100,
			step: 1,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "checkbox",
			id: "EnableTopLeftIconFlip",
			name: "Flip Logo",
			description: "Mirror your custom logo horizontally.",
			value: false,
			enableCss: `ytd-topbar-logo-renderer { --nt-top-icon-flip: scaleX(-1); }`,
			disableCss: `ytd-topbar-logo-renderer { --nt-top-icon-flip: scaleX(1); }`,
			require: { EnableCustomTopLeftIcon: true },
		},
		{
			type: "checkbox",
			id: "EnableTopLeftIconRepeat",
			name: "Repeat Logo",
			description: "Tiles the custom logo image. Useful for small textures or patterns.",
			value: false,
			enableCss: `ytd-topbar-logo-renderer { --nt-top-icon-repeat: repeat; }`,
			disableCss: `ytd-topbar-logo-renderer { --nt-top-icon-repeat: no-repeat; }`,
			require: { EnableCustomTopLeftIcon: true },
		},
	],
};
