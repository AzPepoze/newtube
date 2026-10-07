import { type Category } from "@settings/types/styleshiftTypes";
import { THUMBNAIL_SELECTOR } from "./selectors";

export const bordersShadowsCategory: Category = {
	category: { icon: "border_all", label: "Borders / Shadows" },
	selector: THUMBNAIL_SELECTOR,
	settings: [
		{
			type: "dropdown",
			id: "GlobalStyleType",
			name: "Style Mode",
			description:
				"Select the primary visual enhancement for YouTube elements. 'Outline' adds a solid border, 'Shadow' creates a glowing depth effect, and 'None' keeps it flat.",
			value: "Sha",
			options: [
				{
					label: "Outline",
					value: "Out",
					enableCss: `
                        :root {
                            --nt-global-outline: var(--nt-border-width, 1px) solid var(--nt-border-color, #099DFF80);
                            --nt-global-shadow: none;
                        }
                    `,
				},
				{
					label: "Shadow",
					value: "Sha",
					enableCss: `
                        :root {
                            --nt-global-outline: none;
                            --nt-global-shadow: 0 0 var(--nt-border-width, 8px) var(--nt-theme-shadow, var(--nt-border-color, #099DFF80));
                        }
                    `,
				},
				{
					label: "None",
					value: "None",
					enableCss: `
                        :root {
                            --nt-global-outline: none;
                            --nt-global-shadow: none;
                        }
                    `,
				},
			],
		},
		{
			type: "color",
			id: "GlobalBorderColor",
			name: "Outline Color",
			description:
				"Sets the color of the global outlines. It is also used as a fallback for the shadow glow when no Shadow Color is set.",
			value: "#099DFF80",
			varCss: "--nt-border-color",
			require: { GlobalStyleType: ["Out", "Sha"] },
		},
		{
			type: "color",
			id: "ThemeShadowColor",
			name: "Shadow Color",
			description: "Sets the color of the glow in Shadow mode. Only visible while 'Style Mode' is set to 'Shadow'.",
			value: "#659aff80",
			varCss: "--nt-theme-shadow",
			require: { GlobalStyleType: ["Sha"] },
		},
		{
			type: "numberSlide",
			id: "GlobalBorderSize",
			name: "Effect Width",
			description: "Adjusts the thickness of borders or the spread distance of shadows.",
			value: 8,
			min: 1,
			max: 50,
			step: 1,
			varCss: "--nt-border-width",
			require: { GlobalStyleType: ["Out", "Sha"] },
		},
		{
			type: "numberSlide",
			id: "GlobalCornerRadius",
			name: "Corner Rounding",
			description:
				"Controls the global roundness of thumbnails, buttons, and panels. Higher values create a more organic, bubbly look.",
			value: 10,
			min: 0,
			max: 100,
			step: 1,
			unit: "px",
			varCss: "--nt-border-radius",
		},
	],
};
