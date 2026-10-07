import { sequencedTask } from "@/core/shared/utilities";
import { applyDrag } from "@core/shared/eventHelpers";
import { getRootValue } from "@core/storage/manager";
import { triggerSettingUpdate } from "@settings/engine/functions";
import { type Category, type CategoryNameWithIcon } from "@settings/types/styleshiftTypes";
import { settingsUi } from "@ui/settings/settingsApi";
import { getCategoryParts } from "@ui/window/utils";
import { mount, unmount } from "svelte";
import { setupLeftTitleAnimation } from "./settingsManager";

import DropdownComponent from "@controls/Dropdown.svelte";
import CodeEditorComponent from "@editor/CodeEditor.svelte";
import BasicNumberInputComponent from "@base/BasicNumberInput.svelte";
import BasicSliderComponent from "@base/BasicSlider.svelte";
import CollapseSectionComponent from "@base/CollapseSection.svelte";
import FileInputComponent from "@base/FileInput.svelte";
import FrameComponent from "@base/Frame.svelte";
import IconButtonComponent from "@base/IconButton.svelte";
import LeftTitleComponent from "@base/LeftTitle.svelte";
import ResizeHandleComponent from "@base/ResizeHandle.svelte";
import SettingNameComponent from "@base/SettingName.svelte";
import SpaceComponent from "@base/Space.svelte";
import TextEditorComponent from "@base/TextEditor.svelte";
import TitleComponent from "@base/Title.svelte";
const dragIcon = "assets/icons/drag.svg";
const closeIcon = "assets/icons/close.svg";

export function resizeHandle(target: HTMLElement, position: "top" | "right" | "bottom" | "left" = "right") {
	return settingsUi.renderComponent(ResizeHandleComponent, {
		target,
		position,
	}) as HTMLDivElement;
}

export function fillScreen(fillBg: boolean = true) {
	return settingsUi.renderComponent(FrameComponent, {
		className: "styleshift-fillscreen",
		transparent: !fillBg,
		style: fillBg ? "" : "pointer-events: none;",
	}) as HTMLDivElement;
}

export function settingFrame(
	padding: boolean = true,
	vertical: boolean = true,
	center: { x: boolean; y: boolean } = { x: false, y: false },
	transparent = false,
	className: string = "",
) {
	return settingsUi.renderComponent(FrameComponent, {
		padding,
		vertical,
		centerX: center.x,
		centerY: center.y,
		transparent,
		className: className,
	}) as HTMLDivElement;
}

export function fileInput(callback: (file: File) => void, type: string | null = null) {
	return settingsUi.renderComponent(FileInputComponent, {
		accept: type,
		onFileSelect: callback,
	}) as HTMLDivElement;
}

function createEditorController(obj: any, key: string, onUpdate?: (val: string) => void) {
	let afterOnChange: ((value: string) => void) | null = null;
	let rearrangeValue: ((value: string) => Promise<string> | string) | null = null;

	let onChange = sequencedTask(async (value: string) => {
		obj[key] = value;
		onUpdate?.(value);
		afterOnChange?.(value);
	});

	const handleInput = async (val: string) => {
		if (await getRootValue("enableRealtimeExtension")) {
			onChange(val);
		}
	};

	const handleBlur = async (val: string, setValue?: (v: string) => void) => {
		let finalValue = val;
		if (rearrangeValue) {
			finalValue = await rearrangeValue(finalValue);
			setValue?.(finalValue);
		}
		onChange(finalValue);
	};

	return {
		handleInput,
		handleBlur,
		api: {
			onChange: (callback: (value: string) => void) => {
				(onChange as any) = callback;
			},
			afterOnChange: (callback: (value: string) => void) => {
				afterOnChange = callback;
			},
			rearrangeValue: (callback: (value: string) => Promise<string> | string) => {
				rearrangeValue = callback;
			},
		},
	};
}

export function textEditor(obj: any = {}, key: string = "") {
	const ctrl = createEditorController(obj, key);
	const element = settingsUi.renderComponent(TextEditorComponent, {
		value: obj[key] || "",
		onInput: ctrl.handleInput,
		onBlur: ctrl.handleBlur,
	} as any) as HTMLTextAreaElement;

	return { textEditor: element, ...ctrl.api };
}

export async function codeEditor(
	parent: HTMLDivElement,
	obj: any,
	key: string,
	language: string,
	height: string | number = 400,
) {
	const ctrl = createEditorController(obj, key, () => {
		if (obj["id"]) triggerSettingUpdate(obj["id"]);
	});

	const target = document.createElement("div");
	Object.assign(target.style, { height: "100%", display: "flex", flexDirection: "column" });
	parent.append(target);

	const instance = settingsUi.renderComponent(
		CodeEditorComponent as any,
		{
			value: obj[key] || "",
			language,
			height,
			onInput: ctrl.handleInput,
			onBlur: (val: string) => ctrl.handleBlur(val, (v) => (instance as any).setValue?.(v)),
		} as any,
		target,
	);

	return ctrl.api;
}

export function settingName(text: string, position: "left" | "center" | "right" = "left") {
	return settingsUi.renderComponent(SettingNameComponent, {
		text,
		align: position,
	}) as HTMLDivElement;
}

export function drag(target: HTMLElement) {
	const drag = settingsUi.renderComponent(IconButtonComponent, {
		icon: dragIcon,
		className: "styleshift-drag-top",
		size: 20,
		onClick: () => {},
	}) as HTMLDivElement;

	applyDrag(drag, target);
	return drag;
}

export function close() {
	return settingsUi.renderComponent(IconButtonComponent, {
		icon: closeIcon,
		className: "styleshift-close",
		size: 20,
		onClick: () => {},
	}) as HTMLDivElement;
}

export async function title(thisCategory: Category) {
	const frame = document.createElement("div");

	const updateUi = () => {
		frame.innerHTML = "";
		const { text, icon } = getCategoryParts(thisCategory.category);
		settingsUi.renderComponent(TitleComponent, { text, icon, rainbow: thisCategory.rainbow }, frame);
	};

	updateUi();

	await settingsUi.configMainSection(
		frame,
		thisCategory,
		{
			category: ["Category", frame],
			selector: "Selector",
			Rainbow: "Rainbow",
		},
		updateUi,
	);

	return { frame };
}

export function leftTitle(
	category: string | CategoryNameWithIcon,
	skipAnimation: boolean,
	isHeader: boolean = false,
	separator: boolean = false,
	isNew: boolean = false,
) {
	const element = settingsUi.renderComponent(LeftTitleComponent, {
		category,
		skipAnimation,
		isHeader,
		separator,
		isNew,
	}) as HTMLDivElement;

	if (!skipAnimation && !isHeader) setupLeftTitleAnimation(element);
	return element;
}

export function subTitle(thisData: { text: string; leftSeparator?: boolean; editable?: boolean }) {
	const { text, leftSeparator = false, editable = false } = thisData;
	const frame = settingsUi.renderComponent(TitleComponent, {
		text,
		subtitle: true,
		leftSeparator,
		editable,
	}) as HTMLDivElement;

	return { frame, data: thisData };
}

export async function collapsedButton(buttonName: string, color: string, contentEl: HTMLElement) {
	const parent = contentEl.parentElement;
	const target = document.createElement("div");

	if (parent) parent.insertBefore(target, contentEl);

	settingsUi.renderComponent(CollapseSectionComponent, { buttonName, color, contentEl }, target);

	return { button: (target.firstElementChild as HTMLDivElement) || target };
}

export function showDropdown(options: unknown, target: HTMLElement) {
	let resolve: (value: string | null) => void;
	const selection = new Promise<string | null>((r) => {
		resolve = r;
	});

	const container = document.createElement("div");
	const mainWindow = document.querySelector(".styleshift-main.styleshift-window");
	(mainWindow || document.body).appendChild(container);

	const removeDropdown = () => {
		if (container.parentNode) {
			unmount(dropdown);
			container.remove();
		}
	};

	const dropdown = mount(DropdownComponent as any, {
		target: container,
		props: {
			options,
			triggerEl: target,
			isOpen: true,
			justMenu: true,
			onUpdate: (option: string) => {
				resolve(option);
				removeDropdown();
			},
			onClose: () => {
				resolve(null);
				removeDropdown();
			},
		},
	});

	return {
		selection,
		cancel: () => {
			removeDropdown();
			resolve(null);
		},
	};
}

export function numberSlideUi(parent: HTMLElement) {
	const element = settingsUi.renderComponent(BasicSliderComponent, {}, parent) as HTMLInputElement;

	const updateNumberSlide = (min: number = 0, max: number = 100, step: number = 1) => {
		element.min = min.toString();
		element.max = max.toString();
		element.step = step.toString();
	};

	return { numberSlideUi: element, updateNumberSlide };
}

export function numberInputUi(parent: HTMLElement) {
	return settingsUi.renderComponent(BasicNumberInputComponent, {}, parent) as HTMLDivElement;
}

export function space(parent: HTMLElement, size: number = 20) {
	settingsUi.renderComponent(SpaceComponent, { size }, parent);
}
