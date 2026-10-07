import { mount } from "svelte";
import ConfigEditorRenderer from "./views/developer/ConfigEditorRenderer.svelte";
import ConfigWindow from "./views/developer/ConfigWindow.svelte";
import SettingsWindow from "./views/panel/SettingsWindow.svelte";

export function settingsWindow(props: any, target: HTMLElement) {
	return mount(SettingsWindow as any, {
		target,
		intro: true,
		props,
	});
}

export function configWindow(props: any, target: HTMLElement) {
	return mount(ConfigWindow as any, {
		target,
		intro: true,
		props,
	});
}

export function configEditorRenderer(props: any, target: HTMLElement) {
	return mount(ConfigEditorRenderer as any, {
		target,
		intro: true,
		props,
	});
}
