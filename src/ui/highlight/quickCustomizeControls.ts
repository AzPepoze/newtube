export type QuickControlType = "color" | "numberSlide" | "dropdown" | "textInput";

export type QuickControl = {
	id: string;
	label: string;
	type: QuickControlType;
	defaultValue: string;
	/** CSS property to write; defaults to the control id. */
	cssProperty?: string;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	options?: { label: string; value: string }[];
	placeholder?: string;
	/** Full-value transform (e.g. background-image -> url()). */
	toCss?: (value: string) => string;
	/** Fragment for a property shared by several controls (e.g. filter, transform). */
	part?: (value: string) => string;
};

export type QuickControlGroup = {
	id: string;
	label: string;
	icon: string;
	controls: QuickControl[];
};

export const CONTROL_GROUPS: QuickControlGroup[] = [
	{
		id: "background",
		label: "Background",
		icon: "format_color_fill",
		controls: [
			{ id: "background-color", label: "Background color", type: "color", defaultValue: "#ffffff" },
			{
				id: "background-image",
				label: "Background image",
				type: "textInput",
				defaultValue: "",
				placeholder: "https://example.com/image.png",
				toCss: (value) => `url("${value}")`,
			},
			{
				id: "background-size",
				label: "Background size",
				type: "dropdown",
				defaultValue: "cover",
				options: [
					{ label: "Cover", value: "cover" },
					{ label: "Contain", value: "contain" },
					{ label: "Auto", value: "auto" },
					{ label: "Stretch", value: "100% 100%" },
				],
			},
			{
				id: "background-position",
				label: "Background position",
				type: "dropdown",
				defaultValue: "center",
				options: [
					{ label: "Center", value: "center" },
					{ label: "Top", value: "top" },
					{ label: "Bottom", value: "bottom" },
					{ label: "Left", value: "left" },
					{ label: "Right", value: "right" },
				],
			},
			{
				id: "background-repeat",
				label: "Background repeat",
				type: "dropdown",
				defaultValue: "no-repeat",
				options: [
					{ label: "No repeat", value: "no-repeat" },
					{ label: "Repeat", value: "repeat" },
					{ label: "Repeat X", value: "repeat-x" },
					{ label: "Repeat Y", value: "repeat-y" },
				],
			},
			{
				id: "opacity",
				label: "Opacity",
				type: "numberSlide",
				defaultValue: "100",
				min: 0,
				max: 100,
				unit: "%",
				toCss: (value) => String(Number(value) / 100),
			},
		],
	},
	{
		id: "text",
		label: "Text",
		icon: "title",
		controls: [
			{ id: "color", label: "Text color", type: "color", defaultValue: "#000000" },
			{ id: "font-size", label: "Font size", type: "numberSlide", defaultValue: "14", min: 8, max: 72, unit: "px" },
			{
				id: "font-weight",
				label: "Font weight",
				type: "dropdown",
				defaultValue: "400",
				options: [
					{ label: "Light", value: "300" },
					{ label: "Normal", value: "400" },
					{ label: "Medium", value: "500" },
					{ label: "Semibold", value: "600" },
					{ label: "Bold", value: "700" },
					{ label: "Black", value: "900" },
				],
			},
			{
				id: "font-family",
				label: "Font family",
				type: "dropdown",
				defaultValue: "inherit",
				options: [
					{ label: "Inherit", value: "inherit" },
					{ label: "Inter", value: "'Inter', sans-serif" },
					{ label: "Roboto", value: "Roboto, sans-serif" },
					{ label: "Arial", value: "Arial, sans-serif" },
					{ label: "Georgia", value: "Georgia, serif" },
					{ label: "Times", value: "'Times New Roman', serif" },
					{ label: "Monospace", value: "monospace" },
				],
			},
			{
				id: "text-align",
				label: "Text align",
				type: "dropdown",
				defaultValue: "left",
				options: [
					{ label: "Left", value: "left" },
					{ label: "Center", value: "center" },
					{ label: "Right", value: "right" },
					{ label: "Justify", value: "justify" },
				],
			},
			{
				id: "line-height",
				label: "Line height",
				type: "numberSlide",
				defaultValue: "1.4",
				min: 0.8,
				max: 3,
				step: 0.1,
			},
			{
				id: "letter-spacing",
				label: "Letter spacing",
				type: "numberSlide",
				defaultValue: "0",
				min: -2,
				max: 10,
				step: 0.1,
				unit: "px",
			},
			{
				id: "text-transform",
				label: "Text transform",
				type: "dropdown",
				defaultValue: "none",
				options: [
					{ label: "None", value: "none" },
					{ label: "Uppercase", value: "uppercase" },
					{ label: "Lowercase", value: "lowercase" },
					{ label: "Capitalize", value: "capitalize" },
				],
			},
			{
				id: "text-decoration",
				label: "Text decoration",
				type: "dropdown",
				defaultValue: "none",
				options: [
					{ label: "None", value: "none" },
					{ label: "Underline", value: "underline" },
					{ label: "Line through", value: "line-through" },
					{ label: "Overline", value: "overline" },
				],
			},
			{
				id: "text-shadow",
				label: "Text shadow",
				type: "dropdown",
				defaultValue: "none",
				options: [
					{ label: "None", value: "none" },
					{ label: "Soft", value: "0 1px 2px rgba(0, 0, 0, 0.3)" },
					{ label: "Medium", value: "0 2px 6px rgba(0, 0, 0, 0.4)" },
					{ label: "Strong", value: "0 2px 10px rgba(0, 0, 0, 0.6)" },
				],
			},
		],
	},
	{
		id: "spacing",
		label: "Spacing & size",
		icon: "straighten",
		controls: [
			{ id: "padding", label: "Padding", type: "numberSlide", defaultValue: "0", min: 0, max: 100, unit: "px" },
			{ id: "margin", label: "Margin", type: "numberSlide", defaultValue: "0", min: 0, max: 100, unit: "px" },
			{ id: "gap", label: "Gap", type: "numberSlide", defaultValue: "0", min: 0, max: 100, unit: "px" },
			{
				id: "width",
				label: "Width",
				type: "textInput",
				defaultValue: "",
				placeholder: "auto | 100% | 320px",
			},
			{
				id: "height",
				label: "Height",
				type: "textInput",
				defaultValue: "",
				placeholder: "auto | 100% | 320px",
			},
		],
	},
	{
		id: "border",
		label: "Border",
		icon: "rounded_corner",
		controls: [
			{
				id: "border-radius",
				label: "Radius",
				type: "numberSlide",
				defaultValue: "0",
				min: 0,
				max: 50,
				unit: "px",
			},
			{
				id: "border-width",
				label: "Border width",
				type: "numberSlide",
				defaultValue: "0",
				min: 0,
				max: 20,
				unit: "px",
			},
			{ id: "border-color", label: "Border color", type: "color", defaultValue: "#000000" },
			{
				id: "border-style",
				label: "Border style",
				type: "dropdown",
				defaultValue: "solid",
				options: [
					{ label: "Solid", value: "solid" },
					{ label: "Dashed", value: "dashed" },
					{ label: "Dotted", value: "dotted" },
					{ label: "None", value: "none" },
				],
			},
		],
	},
	{
		id: "effects",
		label: "Effects",
		icon: "auto_awesome",
		controls: [
			{
				id: "filter-blur",
				label: "Blur",
				type: "numberSlide",
				defaultValue: "0",
				min: 0,
				max: 20,
				unit: "px",
				cssProperty: "filter",
				part: (value) => `blur(${value}px)`,
			},
			{
				id: "filter-brightness",
				label: "Brightness",
				type: "numberSlide",
				defaultValue: "100",
				min: 0,
				max: 200,
				unit: "%",
				cssProperty: "filter",
				part: (value) => `brightness(${value}%)`,
			},
			{
				id: "filter-saturation",
				label: "Saturation",
				type: "numberSlide",
				defaultValue: "100",
				min: 0,
				max: 200,
				unit: "%",
				cssProperty: "filter",
				part: (value) => `saturate(${value}%)`,
			},
			{
				id: "backdrop-blur",
				label: "Backdrop blur",
				type: "numberSlide",
				defaultValue: "0",
				min: 0,
				max: 40,
				unit: "px",
				cssProperty: "backdrop-filter",
				part: (value) => `blur(${value}px)`,
			},
			{
				id: "box-shadow",
				label: "Shadow",
				type: "dropdown",
				defaultValue: "none",
				options: [
					{ label: "None", value: "none" },
					{ label: "Soft", value: "0 2px 6px rgba(0, 0, 0, 0.25)" },
					{ label: "Medium", value: "0 4px 14px rgba(0, 0, 0, 0.35)" },
					{ label: "Strong", value: "0 8px 30px rgba(0, 0, 0, 0.5)" },
				],
			},
		],
	},
	{
		id: "transform",
		label: "Transform",
		icon: "open_with",
		controls: [
			{
				id: "transform-scale",
				label: "Scale",
				type: "numberSlide",
				defaultValue: "100",
				min: 0,
				max: 200,
				unit: "%",
				cssProperty: "transform",
				part: (value) => `scale(${Number(value) / 100})`,
			},
			{
				id: "transform-rotate",
				label: "Rotate",
				type: "numberSlide",
				defaultValue: "0",
				min: -180,
				max: 180,
				unit: "deg",
				cssProperty: "transform",
				part: (value) => `rotate(${value}deg)`,
			},
		],
	},
	{
		id: "layout",
		label: "Layout & visibility",
		icon: "visibility",
		controls: [
			{
				id: "display",
				label: "Display",
				type: "dropdown",
				defaultValue: "block",
				options: [
					{ label: "Show", value: "block" },
					{ label: "Hide", value: "none" },
					{ label: "Flex", value: "flex" },
					{ label: "Grid", value: "grid" },
					{ label: "Inline block", value: "inline-block" },
				],
			},
			{
				id: "position",
				label: "Position",
				type: "dropdown",
				defaultValue: "static",
				options: [
					{ label: "Static", value: "static" },
					{ label: "Relative", value: "relative" },
					{ label: "Absolute", value: "absolute" },
					{ label: "Fixed", value: "fixed" },
					{ label: "Sticky", value: "sticky" },
				],
			},
			{ id: "z-index", label: "Z-index", type: "numberSlide", defaultValue: "0", min: 0, max: 100 },
			{
				id: "flex-direction",
				label: "Flex direction",
				type: "dropdown",
				defaultValue: "row",
				options: [
					{ label: "Row", value: "row" },
					{ label: "Column", value: "column" },
				],
			},
			{
				id: "overflow",
				label: "Overflow",
				type: "dropdown",
				defaultValue: "visible",
				options: [
					{ label: "Visible", value: "visible" },
					{ label: "Hidden", value: "hidden" },
					{ label: "Scroll", value: "scroll" },
					{ label: "Auto", value: "auto" },
				],
			},
		],
	},
];

export const ALL_CONTROLS: QuickControl[] = CONTROL_GROUPS.flatMap((group) => group.controls);

export function defaultBasicStyles(): Record<string, string> {
	return Object.fromEntries(ALL_CONTROLS.map((control) => [control.id, control.defaultValue]));
}

export function defaultEnabledStyles(): Record<string, boolean> {
	return Object.fromEntries(ALL_CONTROLS.map((control) => [control.id, false]));
}
