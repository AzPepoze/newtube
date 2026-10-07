import { rearrangeSelector } from "@core/shared/domHelpers";
import { type Setting } from "@settings/types/styleshiftTypes";
import { settingsUi } from "@ui/settings/settingsApi";

import AddSettingButtonComponent from "./AddSettingButton.svelte";
import ConfigMainSectionComponent from "./ConfigMainSection.svelte";
import ConfigSubSectionComponent from "./ConfigSubSection.svelte";
import DevSettingSectionComponent from "./DevSettingSection.svelte";
import KeyboardShortcutsComponent from "./KeyboardShortcuts.svelte";

export async function settingDeveloperTextEditor(
	parent: HTMLElement,
	thisSetting,
	thisProperty,
	updateUi = function (_value) {},
) {
	const mainUi = settingsUi.settingFrame(true, true, { x: false, y: false }, false, "styleshift-config-sub-frame");

	const textEditors = {};

	for (const [title, property] of Object.entries(thisProperty)) {
		mainUi.append(settingsUi.subTitle({ text: title }).frame);
		const settingDeveloperTextEditor = settingsUi.textEditor(thisSetting, property as string);
		settingDeveloperTextEditor.afterOnChange(updateUi);
		mainUi.append(settingDeveloperTextEditor.textEditor);
		textEditors[title] = settingDeveloperTextEditor;
	}

	if (parent && parent !== mainUi) {
		parent.appendChild(mainUi);
	}

	return { mainUi, textEditors };
}

export async function settingDeveloperFrame(
	parent,
	thisSetting,
	runType,
	extArray = ["function", "css"],
	updateConfig,
) {
	return settingsUi.renderComponent(
		DevSettingSectionComponent,
		{
			setting: thisSetting,
			runType: runType,
			extArray: extArray,
			onUpdateConfig: updateConfig,
		},
		parent,
	) as HTMLDivElement;
}

export async function configMainSection(parent, thisSetting, props, updateUi = function () {}) {
	settingsUi.renderComponent(
		ConfigMainSectionComponent,
		{
			setting: thisSetting,
			props: props,
			updateUI: updateUi,
		},
		parent,
	);
}

export async function configSubSection(parent, thisSetting, props) {
	settingsUi.renderComponent(
		ConfigSubSectionComponent,
		{
			setting: thisSetting,
			props: props,
		},
		parent,
	);
}

export async function selectorTextEditor(parent, thisCategory) {
	const selectorTextEditor = await settingsUi.textEditor(thisCategory, "selector");
	selectorTextEditor.textEditor.className += " styleshift-selector-text-editor";
	selectorTextEditor.rearrangeValue(function (value: string) {
		return rearrangeSelector(value);
	});
	parent.append(selectorTextEditor.textEditor);
	return selectorTextEditor;
}

export async function settingDeleteButton(parent, whenClick, type: "full" | "mini" = "full") {
	const settingDeleteButton = await settingsUi.button({
		name: "🗑️",
		color: "#FF0000",
		align: "center",
	});
	(settingDeleteButton.button as HTMLDivElement).addEventListener("click", whenClick);
	parent.append(settingDeleteButton.button);

	switch (type) {
		case "full":
			(settingDeleteButton.button as HTMLDivElement).style.width = "100%";
			break;
		case "mini":
			(settingDeleteButton.button as HTMLDivElement).style.width = "30px";
			break;
	}

	return settingDeleteButton;
}

export async function addSettingButton(categorySettings: Setting[]) {
	const target = document.createElement("div");
	settingsUi.renderComponent(
		AddSettingButtonComponent,
		{
			categorySettings: categorySettings,
		},
		target,
	);

	return { frame: (target.firstElementChild as HTMLDivElement) || target };
}

export async function keyboardShortcuts() {
	const target = document.createElement("div");
	settingsUi.renderComponent(KeyboardShortcutsComponent, {}, target);

	return { frame: (target.firstElementChild as HTMLDivElement) || target };
}
