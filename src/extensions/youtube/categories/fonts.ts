import { type Category } from "@settings/types/styleshiftTypes";
import { settingsUi } from "@ui/settings/settingsApi";
import FontManager from "../features/fonts/views/FontManager.svelte";
import { FONT_SELECTOR } from "./selectors";

export const fontsCategory: Category = {
	category: { icon: "text_fields", label: "Fonts" },
	selector: FONT_SELECTOR,
	settings: [
		{
			type: "custom",
			id: "FontManager",
			transparent: true,
			uiFunction: function (frame: HTMLElement) {
				settingsUi.renderComponent(FontManager, { setting: this }, frame);
			},
			constantCss: (value) => {
				if (!Array.isArray(value)) return "";
				const enabledFonts = value.filter(
					(f): f is { enabled: boolean; fontName: string; importUrl?: string } =>
						!!f && typeof f === "object" && !Array.isArray(f) && f.enabled === true && typeof f.fontName === "string",
				);
				if (enabledFonts.length === 0) return "";

				// Deduplicate imports by URL
				const uniqueUrls = [
					...new Set(
						enabledFonts
							.map((f) => f.importUrl)
							.filter((url): url is string => typeof url === "string" && url.trim().length > 0),
					),
				];
				const imports = uniqueUrls.length > 0 ? uniqueUrls.map((url) => `@import url('${url}');`).join("\n") : "";

				// Generate font stack.
				const fontStack = enabledFonts
					.map((f) =>
						f.fontName
							.split(",")
							.map((name) => {
								const trimmed = name.trim();
								return trimmed.startsWith("'") || trimmed.startsWith('"') ? trimmed : `'${trimmed}'`;
							})
							.join(", "),
					)
					.join(", ");

				return `
                    ${imports}
                    body,
                    #masthead,
                    .ytd-app,
                    button,
                    input,
                    textarea,
                    select,
                    * { 
                        font-family: ${fontStack}, Roboto, Arial, sans-serif !important; 
                    }
                `;
			},
		},
	],
};
