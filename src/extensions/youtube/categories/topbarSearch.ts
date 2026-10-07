import { type Category } from "@settings/types/styleshiftTypes";
import { SEARCH_SELECTOR } from "./selectors";

let topbarScrollHandler: (() => void) | null = null;

export const topbarSearchCategory: Category = {
	category: { icon: "search", label: "Topbar & Search" },
	selector: SEARCH_SELECTOR,
	settings: [
		{
			type: "checkbox",
			id: "EnableTopbarTransparency",
			hoverPreview: { selectors: ["#masthead #background.ytd-masthead"] },
			name: "Adaptive Topbar",
			description:
				"Makes the top header bar transparent by default and applies your custom background color only when you begin to scroll down.",
			value: true,
			enableFunction: function () {
				const masthead = document.querySelector("#background.ytd-masthead") as HTMLElement;
				if (!masthead || topbarScrollHandler) return;

				topbarScrollHandler = () => {
					if (window.scrollY > 0) {
						masthead.classList.add("scrolled");
					} else {
						masthead.classList.remove("scrolled");
					}
				};

				window.addEventListener("scroll", topbarScrollHandler);
			},
			disableFunction: function () {
				if (topbarScrollHandler) {
					window.removeEventListener("scroll", topbarScrollHandler);
					topbarScrollHandler = null;
				}
				const masthead = document.querySelector("#background.ytd-masthead") as HTMLElement;
				if (masthead) masthead.classList.remove("scrolled");
			},
			enableCss: `
                #masthead #background.ytd-masthead {
                    transition: all 0.3s;
                }

                #masthead #background.ytd-masthead:not(.scrolled) {
					background-color: transparent !important;
					backdrop-filter: blur(0px) !important;
					box-shadow: none !important;
					border: none !important;
				}


                #masthead #background.ytd-masthead.scrolled {
                    background-color: var(--nt-topbar-bg, #00000080) !important;
					backdrop-filter: blur(var(--nt-topbar-blur-amount, 10px)) !important;
                }
            `,
		},
		{
			type: "numberSlide",
			id: "TopbarBlurAmount",
			hoverPreview: { selectors: ["#masthead #background.ytd-masthead"] },
			name: "Topbar Blur",
			description: "Adjusts the blur intensity of the adaptive topbar.",
			value: 10,
			min: 0,
			max: 50,
			step: 1,
			varCss: "--nt-topbar-blur-amount",
			require: { EnableTopbarTransparency: true },
		},
		{
			type: "color",
			id: "TopbarBackgroundColor",
			hoverPreview: { selectors: ["#masthead #background.ytd-masthead"] },
			name: "Topbar Color",
			description:
				"Customizes the background color of the top header. Best used with 'Adaptive Topbar' for a smooth transition while scrolling.",
			value: "#00000080",
			varCss: "--nt-topbar-bg",
			require: { EnableTopbarTransparency: true },
		},
		{
			type: "color",
			id: "SearchSuggestionHoverColor",
			hoverPreview: { selectors: [".ytSuggestionComponentSuggestion", "ytd-searchbox-spt .sbsb_c > li"] },
			name: "Search Hover",
			description: "Sets the background highlight color when navigating through the search suggestion dropdown menu.",
			value: "#ffffffff",
			varCss: "--nt-search-bg-hover",
			constantCss: `
                .ytSuggestionComponentSuggestion:hover,
                .ytSuggestionComponentSuggestion[aria-selected="true"],
                .ytSuggestionComponentSuggestion [aria-selected="true"],
                ytd-searchbox-spt .sbsb_c > li:hover,
                ytd-searchbox-spt .sbsb_c > li[aria-selected="true"],
                ytd-searchbox-spt .sbsb_c > li.selected {
                    background-color: var(--nt-search-bg-hover) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableTopbarBorder",
			hoverPreview: { selectors: ["#masthead #background.ytd-masthead"] },
			name: "Topbar Borders",
			description: "Applies your global outline or shadow settings to the bottom of the top navigation bar.",
			value: true,
			enableCss: `
                #background.ytd-masthead {
                    box-shadow: var(--nt-global-shadow) !important;
                    border-bottom: var(--nt-global-outline) !important;
                }
            `,
		},
		{
			type: "color",
			id: "ChipsBarBackgroundColor",
			hoverPreview: { selectors: ["#chips-wrapper.ytd-feed-filter-chip-bar-renderer"] },
			name: "Chips Bar Color",
			description:
				"Changes the background color of the horizontal category list (the 'chips') found at the top of the home and search feeds.",
			value: "#00000080",
			varCss: "--nt-chips-bg",
			constantCss: `
                #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
                    background-color: var(--nt-chips-bg) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableChipsBarBorder",
			hoverPreview: { selectors: ["#chips-wrapper.ytd-feed-filter-chip-bar-renderer"] },
			name: "Chips Bar Borders",
			description: "Adds global outlines or shadows to the horizontal category chips bar.",
			value: false,
			enableCss: `
                #chips-wrapper.ytd-feed-filter-chip-bar-renderer {
                    box-shadow: var(--nt-global-shadow) !important;
                    border-bottom: var(--nt-global-outline) !important;
                }
            `,
		},
		{
			type: "checkbox",
			id: "EnableEnhancedSearchStyle",
			hoverPreview: { selectors: [".ytSearchboxComponentInputBox", ".ytSearchboxComponentSearchButton"] },
			name: "Enhanced Search Style",
			description:
				"Adds a sleek slide-in and fade animation when the search bar is focused, enhancing the overall feel of the header.",
			value: true,
			enableCss: `
                .ytSearchboxComponentInputBox {
					border: none !important;
				}

				.ytSearchboxComponentSearchButton {
					border-radius: var(--nt-border-radius);
				}
            `,
		},
	],
};
