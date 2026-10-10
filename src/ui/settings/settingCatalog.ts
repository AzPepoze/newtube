export const catalogGroups = [
	{ id: "all", label: "All" },
	{ id: "display", label: "Display" },
	{ id: "inputs", label: "Inputs" },
	{ id: "actions", label: "Actions" },
	{ id: "logic", label: "Logic" },
];

export const kindGroups: Record<string, string> = {
	text: "display",
	subText: "display",
	previewImage: "display",
	button: "actions",
	checkbox: "inputs",
	color: "inputs",
	numberSlide: "inputs",
	dropdown: "inputs",
	textInput: "inputs",
	selectorInput: "inputs",
	imageInput: "inputs",
	combineSetting: "logic",
	conditionSetting: "logic",
	custom: "logic",
};

export const kindDescriptions: Record<string, string> = {
	text: "Static text with font size and alignment.",
	subText: "Smaller secondary text under a title.",
	previewImage: "Shows a preview image from the setting.",
	button: "Clickable button that runs a click script.",
	checkbox: "On and off switch with a default value.",
	color: "Color picker with optional alpha slider.",
	numberSlide: "Number slider with min, max and step.",
	dropdown: "Pick one value from a list of options.",
	textInput: "Single line text value.",
	selectorInput: "CSS selector for targeting page elements.",
	imageInput: "Upload an image with a size limit.",
	combineSetting: "Keeps several settings in sync.",
	conditionSetting: "Shows or hides based on another setting.",
	custom: "Your own UI with a custom script.",
};
