import { mount, unmount } from "svelte";
import SelectorPicker from "./views/SelectorPicker.svelte";
import { logger } from "@shared/logger";

let pickerComponent: any = null;
let container: HTMLDivElement | null = null;

export async function openSelectorPicker(
	onSelect?: (selector: string) => void,
	onCancel?: () => void,
	_options: any = {},
) {
	if (pickerComponent) {
		cleanup();
	}

	container = document.createElement("div");
	document.body.appendChild(container);

	logger.debug("Picker", "Starting integrated SelectorPicker");

	pickerComponent = mount(SelectorPicker, {
		target: container,
		props: {
			onSelect: (selector: string) => {
				logger.info("Picker", "Selector selected", selector);
				if (onSelect) onSelect(selector);
				cleanup();
			},
			onClose: () => {
				if (onCancel) onCancel();
				cleanup();
			},
		},
	});
}

export function closeSelectorPicker() {
	cleanup();
}

function cleanup() {
	if (pickerComponent) {
		unmount(pickerComponent);
		pickerComponent = null;
	}
	if (container) {
		container.remove();
		container = null;
	}
}
