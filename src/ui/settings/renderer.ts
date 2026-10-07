import type { Category, Setting } from "@settings/types/styleshiftTypes";
import Confirm from "@ui/window/views/Confirm.svelte";
import Prompt from "@ui/window/views/Prompt.svelte";
import Taskbar from "@ui/window/views/Taskbar.svelte";
import Window from "@ui/window/views/Window.svelte";
import { mount, unmount } from "svelte";
import SettingRenderer from "@renderers/setting/SettingRenderer.svelte";
import { registerExternalCategory } from "./settingsManager";

export { unmount };

export function renderWindow(props: any, target: HTMLElement = document.createElement("div")) {
	return mount(Window, {
		target,
		intro: true,
		props,
	});
}

export function renderTaskbar(target: HTMLElement = document.createElement("div")) {
	return mount(Taskbar, {
		target,
		intro: true,
	});
}

export function renderSetting(
	setting: Setting,
	onUpdate?: (value: any) => void,
	target: HTMLElement = document.createElement("div"),
) {
	mount(SettingRenderer as any, {
		target,
		intro: true,
		props: { setting, onUpdate: onUpdate },
	});
	return (target.firstElementChild as HTMLElement) || target;
}

export function renderComponent(component: any, props: any = {}, target: HTMLElement = document.createElement("div")) {
	mount(component, {
		target,
		intro: true,
		props,
	});
	return (target.firstElementChild as HTMLElement) || target;
}

export function mountComponent(component: any, props: any = {}, target: HTMLElement = document.createElement("div")) {
	return mount(component, {
		target,
		intro: true,
		props,
	});
}

export function confirm(props: any, target: HTMLElement = document.createElement("div")) {
	return mount(Confirm, {
		target,
		intro: true,
		props,
	});
}

export function prompt(props: any, target: HTMLElement = document.createElement("div")) {
	return mount(Prompt, {
		target,
		intro: true,
		props,
	});
}

export function registerExternalStyleshiftCategory(category: Category) {
	registerExternalCategory(category);
}
