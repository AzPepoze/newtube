import type { PersistedCategory, PersistedSetting, PersistedSettings, SettingKind } from "./styleshiftTypes";

export type {
	JsonObject,
	JsonPrimitive,
	JsonValue,
	PersistedCategory,
	PersistedOption,
	PersistedSetting,
	PersistedSettings,
	PersistedPreset,
} from "./styleshiftTypes";

export type PersistedCurrentSettings = PersistedSettings;
export type PersistedStyleShiftData = {
	currentSettings?: PersistedCurrentSettings;
	addOnStyleShiftItems?: PersistedCategory[];
};

const LEGACY_FIELDS = ["Selector", "Highlight_color", "setup_"] as const;
type LegacyField = (typeof LEGACY_FIELDS)[number];

export class PersistedSchemaMigrationError extends Error {
	readonly field: LegacyField;
	readonly path: string;

	constructor(field: LegacyField, path: string) {
		super(`Migration required: legacy persisted field "${path}.${field}" is not supported.`);
		this.name = "PersistedSchemaMigrationError";
		this.field = field;
		this.path = path;
	}
}

export function assertNoLegacyPersistedFields(value: unknown, path = "persisted data"): void {
	if (Array.isArray(value)) {
		for (const [index, child] of value.entries()) {
			assertNoLegacyPersistedFields(child, `${path}[${index}]`);
		}
		return;
	}

	if (!value || typeof value !== "object") return;

	for (const [key, child] of Object.entries(value)) {
		if ((LEGACY_FIELDS as readonly string[]).includes(key)) {
			throw new PersistedSchemaMigrationError(key as LegacyField, path);
		}
		assertNoLegacyPersistedFields(child, `${path}.${key}`);
	}
}

export function assertCanonicalPersistedItems(
	value: unknown,
	path = "addOnStyleShiftItems",
): asserts value is PersistedCategory[] {
	if (!Array.isArray(value)) throw new TypeError(`${path} must be an array of categories.`);

	for (const [categoryIndex, category] of value.entries()) {
		if (!category || typeof category !== "object" || Array.isArray(category)) {
			throw new TypeError(`${path}[${categoryIndex}] must be a category object.`);
		}

		assertNoLegacyPersistedFields(category, `${path}[${categoryIndex}]`);
		const settings = (category as { settings?: unknown }).settings;
		if (!Array.isArray(settings)) throw new TypeError(`${path}[${categoryIndex}].settings must be an array.`);

		for (const [settingIndex, setting] of settings.entries()) {
			if (!setting || typeof setting !== "object" || Array.isArray(setting)) {
				throw new TypeError(`${path}[${categoryIndex}].settings[${settingIndex}] must be a setting object.`);
			}
			assertNoLegacyPersistedFields(setting, `${path}[${categoryIndex}].settings[${settingIndex}]`);
			if (!isPersistedSettingKind((setting as { type?: unknown }).type)) {
				throw new TypeError(
					`${path}[${categoryIndex}].settings[${settingIndex}].type is not a supported setting type.`,
				);
			}
		}
	}
}

export function isPersistedSetting(value: unknown): value is PersistedSetting {
	return Boolean(value && typeof value === "object" && !Array.isArray(value) && "type" in value);
}

export function isPersistedSettingKind(value: unknown): value is SettingKind {
	return (
		typeof value === "string" &&
		[
			"text",
			"subText",
			"button",
			"checkbox",
			"numberSlide",
			"dropdown",
			"color",
			"textInput",
			"imageInput",
			"previewImage",
			"custom",
			"combineSetting",
			"conditionSetting",
			"keyboardShortcuts",
			"group",
			"selectorInput",
		].includes(value)
	);
}
