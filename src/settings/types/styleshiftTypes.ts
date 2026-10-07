export type Category = {
	category: string | CategoryNameWithIcon;
	rainbow?: boolean;
	layout?: "list" | "grid";
	selector?: string;

	editable?: boolean;
	settings: Setting[];
	highlightColor?: string;
};

export type CategoryNameWithIcon = { icon: string; label: string };
export type SeparateCategory = { isHeader: boolean; label: string };

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SettingValue = JsonValue;
export type SettingAction = () => void;
export type SettingValueCallback<T extends SettingValue = SettingValue> = (value: T) => void;
export type SettingCssCallback = (value: SettingValue) => string;
export type SettingRequirementValue = SettingValue | SettingValue[];
export type SettingRequirements = Record<string, SettingRequirementValue>;

export type QuickCustomizeMode = "basic" | "advanced";
export type QuickCustomizeMetadata = {
	basicStyles: Record<string, string>;
	enabledStyles: Record<string, boolean>;
};
export type QuickCustomizeData = {
	selector: string;
	mode: QuickCustomizeMode;
	metadata: QuickCustomizeMetadata;
};

export type Option = {
	label: string;
	value: string;
	enableCss?: string;

	enableFunction?: string | SettingAction;
	disableFunction?: string | SettingAction;
};

export type Color_obj = {
	hex: string;
	alpha: number;
};

export type BaseSetting = {
	hoverPreview?: false | { selectors: string[] };
	lock?: {
		condition: boolean;
		message?: string;
	};
	require?: SettingRequirements;
	quickCustomize?: QuickCustomizeData;
};

export enum SettingType {
	Text = "text",
	SubText = "subText",
	Button = "button",
	Checkbox = "checkbox",
	NumberSlide = "numberSlide",
	Dropdown = "dropdown",
	Color = "color",
	TextInput = "textInput",
	ImageInput = "imageInput",
	PreviewImage = "previewImage",
	Custom = "custom",
	CombineSetting = "combineSetting",
	ConditionSetting = "conditionSetting",
	KeyboardShortcuts = "keyboardShortcuts",
	Group = "group",
	SelectorInput = "selectorInput",
}

export type Setting = (
	| {
			type: "text";
			id?: string;

			html: string;

			align?: "left" | "center" | "right";
			color?: string;
			fontSize?: number;

			editable?: boolean;
	  }
	| {
			type: "subText";
			id?: string;

			text: string;

			align?: "left" | "center" | "right";
			color?: string;
			fontSize?: number;

			editable?: boolean;
	  }
	| {
			type: "button";
			id?: string;
			name: string;
			description?: string;

			icon?: string;
			iconSize?: number;
			iconScale?: number;
			align?: "left" | "center" | "right";
			color?: string;
			fontSize?: number;

			clickFunction?: string | SettingAction;

			editable?: boolean;
	  }
	| {
			type: "checkbox";
			id: string;
			name: string;
			description?: string;

			value: boolean;

			constantCss?: string;

			setupFunction?: string | SettingAction;
			updateFunction?: string | SettingValueCallback<boolean>;

			enableCss?: string;
			enableFunction?: string | SettingAction;

			disableCss?: string;
			disableFunction?: string | SettingAction;

			editable?: boolean;
	  }
	| {
			type: "numberSlide";
			id: string;
			name: string;
			description?: string;

			min?: number;
			max?: number;
			step?: number;
			value: number;
			unit?: string;

			//--------------

			varCss?: string;

			constantCss?: string | SettingCssCallback;

			setupFunction?: string | SettingAction;

			updateFunction?: string | SettingValueCallback<number>;

			//--------------

			editable?: boolean;
	  }
	| {
			type: "dropdown";
			id: string;
			name: string;
			description?: string;

			value: string;

			//--------------

			constantCss?: string;

			setupFunction?: string | SettingAction;

			updateFunction?: string | SettingValueCallback<string>;

			options: Option[];

			//--------------

			editable?: boolean;
	  }
	| {
			type: "color";
			id: string;
			name: string;
			description?: string;
			showAlphaSlider?: boolean;

			value: string;

			//--------------

			varCss?: string;

			constantCss?: string | SettingCssCallback;

			setupFunction?: string | SettingAction;

			updateFunction?: string | SettingValueCallback<string>;

			//--------------

			editable?: boolean;
	  }
	| {
			type: "textInput";
			id: string;
			name: string;
			description?: string;

			value: string;

			updateFunction?: string | SettingValueCallback<string>;

			//--------------
			editable?: boolean;
	  }
	| {
			type: "imageInput";
			id: string;
			name: string;
			description?: string;

			value: string;
			maxFileSize: number;

			//--------------
			editable?: boolean;
	  }
	| {
			type: "previewImage";
			id: string;
			title?: string;
			preset?: "default" | "topbar" | "banner" | "card" | "avatar";
			settingIds?: {
				url?: string;
				size?: string;
				positionX?: string;
				positionY?: string;
				cropTop?: string;
				cropBottom?: string;
				cropLeft?: string;
				cropRight?: string;
				flip?: string;
			};
			editable?: boolean;
	  }
	| {
			type: "custom";
			id: string;
			name?: string;
			description?: string;
			value?: SettingValue;

			//--------------

			constantCss?: string | SettingCssCallback;
			setupFunction?: string | SettingAction;
			uiFunction?: string | ((this: SettingByType<"custom">, frame: HTMLElement) => void);
			transparent?: boolean;

			//--------------

			editable?: boolean;
	  }
	| {
			type: "combineSetting";
			id?: string;
			name?: string;
			description?: string;
			settingIds: string[];
			updateFunction?: string;
			editable?: boolean;
	  }
	| {
			type: "conditionSetting";
			id?: string;
			name?: string;
			description?: string;
			condition: SettingRequirements;
			enableCss?: string;
			disableCss?: string;
			enableFunction?: string | SettingAction;
			disableFunction?: string | SettingAction;
			editable?: boolean;
	  }
	| {
			type: "keyboardShortcuts";
			id?: string;
			name?: string;
			description?: string;
			editable?: boolean;
	  }
	| {
			type: "group";
			id?: string;
			text: string;
			leftSeparator?: boolean;
			editable?: boolean;
	  }
	| {
			type: "selectorInput";
			id: string;
			name: string;
			description?: string;
			value: string;
			updateFunction?: string | SettingValueCallback<string>;
			editable?: boolean;
	  }
) &
	BaseSetting;

export type SettingKind = Setting["type"];
export type SettingByType<T extends SettingKind> = Extract<Setting, { type: T }>;
export type SettingField<T extends SettingKind> = Extract<keyof SettingByType<T>, string>;

export type PersistedSettingValue = JsonValue;
export type PersistedSettingRequirementValue = PersistedSettingValue | PersistedSettingValue[];
export type PersistedSettingRequirements = Record<string, PersistedSettingRequirementValue>;

export type PersistedOption = Omit<Option, "enableFunction" | "disableFunction"> & {
	enableFunction?: string;
	disableFunction?: string;
};

type PersistedExecutableSettingField =
	| "clickFunction"
	| "setupFunction"
	| "updateFunction"
	| "enableFunction"
	| "disableFunction"
	| "constantCss"
	| "uiFunction";

type PersistedSettingReplacedField<T extends SettingKind> =
	| PersistedExecutableSettingField
	| "options"
	| "require"
	| "quickCustomize"
	| (T extends "custom" ? "value" : never);

type PersistedSettingBase<T extends SettingKind> = Omit<SettingByType<T>, PersistedSettingReplacedField<T>>;

type PersistedExecutableSettingFields<T extends SettingKind> = {
	[K in Extract<keyof SettingByType<T>, PersistedExecutableSettingField>]?: string;
};

type PersistedSettingMetadata = {
	require?: PersistedSettingRequirements;
	quickCustomize?: QuickCustomizeData;
};

type PersistedSettingOptions<T extends SettingKind> =
	SettingByType<T> extends { options: Option[] } ? { options: PersistedOption[] } : object;

type PersistedCustomSettingValue<T extends SettingKind> = T extends "custom"
	? { value?: PersistedSettingValue }
	: object;

type PersistedSettingMember<T extends SettingKind> = PersistedSettingBase<T> &
	PersistedExecutableSettingFields<T> &
	PersistedSettingMetadata &
	PersistedSettingOptions<T> &
	PersistedCustomSettingValue<T>;

export type PersistedSetting = {
	[T in SettingKind]: PersistedSettingMember<T>;
}[SettingKind];

export type PersistedCategory = Omit<Category, "settings" | "editable" | "highlightColor"> & {
	settings: PersistedSetting[];
};

export type PersistedSettings = Record<string, JsonValue>;
export type PersistedStyleShiftData = {
	currentSettings?: PersistedSettings;
	addOnStyleShiftItems?: PersistedCategory[];
};
export type PersistedPreset = PersistedStyleShiftData & {
	themeId?: string;
	themeName?: string;
};
