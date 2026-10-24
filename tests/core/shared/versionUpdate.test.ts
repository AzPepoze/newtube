// @ts-nocheck
import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import { defaultSetting } from "../../../src/extensions/youtube/defaultSettings";
import { PRESET_THEMES } from "../../../src/extensions/youtube/presets";

const data = {};
const notifications = [];
let persistenceFails = false;

mock.module("@core/storage/manager", () => ({
	cachedStorageData: data,
	EXTERNAL_STORAGE_KEYS: [],
	getRootValue: async (key) => data[key],
	saveRootValue: async (key, value) => {
		if (persistenceFails) throw new Error("Storage unavailable");
		data[key] = value;
		return true;
	},
	saveUserSetting: async (key, value) => {
		data.currentSettings[key] = value;
		data.activeTheme = "custom";
		return true;
	},
	persistCachedDataToStorage: async () => true,
	saveToStorage: async () => true,
}));
mock.module("@settings/registry/items", () => ({ getSettingsList: () => ({}) }));
mock.module("@core/shared/notifications", () => ({
	createNotification: async (notification) => notifications.push(notification),
}));
mock.module("@core/theme/config", () => ({ STYLESHIFT_VERSION: "2.0.0" }));
mock.module("@shared/logger", () => ({ logger: { debug() {}, info() {}, warn() {}, error() {} } }));

const { checkAndShowUpdateNotification } = await import("../../../src/core/shared/versionUpdate");
const normal = PRESET_THEMES.find((preset) => preset.themeId === "preset-normal-youtube");

beforeEach(() => {
	for (const key of Object.keys(data)) delete data[key];
	Object.assign(data, {
		lastSeenVersion: "1.0.0",
		currentSettings: { ControlPanelTextColor: "#9c80eaff" },
		activeTheme: normal.themeId,
		themes: [{ ...normal, currentSettings: {} }],
	});
	notifications.length = 0;
	persistenceFails = false;
});
afterAll(() => mock.restore());

test("an extension update replaces saved presets and the active bundled look once", async () => {
	await checkAndShowUpdateNotification();

	expect(data.themes).toEqual([normal]);
	expect(data.currentSettings).toEqual(normal.currentSettings);
	expect(data.activeTheme).toBe(normal.themeName);
	expect(data.lastSeenVersion).toBe("2.0.0");
	expect(notifications.length).toBe(1);

	// Reloading this release must not replace values again or repeat the notification.
	data.currentSettings.ControlPanelTextColor = "#123456ff";
	await checkAndShowUpdateNotification();
	expect(data.currentSettings.ControlPanelTextColor).toBe("#123456ff");
	expect(notifications.length).toBe(1);
});

test("an update preserves custom themes, customized settings, and deleted presets", async () => {
	const customTheme = { themeId: "mine", themeName: "Mine", currentSettings: { MainThemeColor: "#123456ff" } };
	data.themes = [customTheme];
	data.activeTheme = "custom";
	const settings = { ...data.currentSettings };

	await checkAndShowUpdateNotification();

	expect(data.themes).toEqual([customTheme]);
	expect(data.currentSettings).toEqual(settings);
	expect(data.activeTheme).toBe("custom");
});

test("an update refreshes untouched default settings", async () => {
	data.activeTheme = "";
	await checkAndShowUpdateNotification();

	expect(data.currentSettings).toEqual(defaultSetting.currentSettings);
	expect(data.activeTheme).toBe("");
});

test("first launch records the version without an update notification", async () => {
	delete data.lastSeenVersion;
	await checkAndShowUpdateNotification();

	expect(data.lastSeenVersion).toBe("2.0.0");
	expect(notifications).toEqual([]);
});

test("a failed preset refresh leaves the version unchanged so the next launch retries", async () => {
	persistenceFails = true;
	await expect(checkAndShowUpdateNotification()).rejects.toThrow("Storage unavailable");
	expect(data.lastSeenVersion).toBe("1.0.0");
	expect(notifications).toEqual([]);
});
