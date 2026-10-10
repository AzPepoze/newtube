import { sleep } from "@/core/shared/utilities";
import { initializeDeveloperEnvironment, isDevModulesLoaded } from "@core/runtime/controller";
import { getDocumentBody, getDocumentHead } from "@core/shared/domHelpers";
import { waitOneFrame } from "@core/shared/eventHelpers";
import { getRootValue } from "@core/storage/manager";
import { logger } from "@shared/logger";
import { editorUi } from "@ui/window/editor";
import { unmount } from "svelte";
import { settingsUi } from "../settings/settingsApi";
import { applyThemeToElement } from "../themes/theme";
import { removeConfigUi } from "./config";
import { extensionSettingsUi } from "./extensionSettings";

/**
 * Creates and appends the main StyleShift window to the document.
 */
export async function createStyleShiftWindow({
	width = "50%",
	height = "80%",
	skipAnimation = false,
	title = "StyleShift",
	fullscreen = false,
	center = false,
	blurToggle = false,
	onWindowClosed = null as (() => void) | null,
}) {
	// Ensure developer tools are ready if mode is enabled
	if (await getRootValue("developerMode")) {
		await initializeDeveloperEnvironment();
	}

	logger.info("ui", "Initializing main window");

	await getDocumentHead();
	const overlayFrame = settingsUi.fillScreen(fullscreen);
	if (!fullscreen) {
		overlayFrame.style.pointerEvents = "none"; // Let window handle events
	}

	const mountPoint = document.createElement("div");
	overlayFrame.appendChild(mountPoint);

	let windowInstance: any;

	const closeWindowHandler = async () => {
		if (windowInstance) {
			await triggerWindowHideAnimation(windowContainer);
			await sleep(300);
			unmount(windowInstance);
		}
		overlayFrame.remove();
		if (onWindowClosed) {
			onWindowClosed();
		}
	};

	windowInstance = settingsUi.renderWindow(
		{
			title,
			width,
			height,
			fullscreen,
			center,
			blurToggle,
			onClose: closeWindowHandler,
			children: (_target: HTMLElement) => {
				return "";
			},
		},
		mountPoint,
	);

	const windowContainer = mountPoint.querySelector(".styleshift-window-container") as HTMLElement;
	await applyThemeToElement(windowContainer);
	const contentElement = windowContainer.querySelector(".styleshift-window-content") as HTMLElement;
	const topbar = windowContainer.querySelector(".styleshift-window-topbar") as HTMLElement | null;
	const closeButton = windowContainer.querySelector(".control-btn.close") as HTMLElement | null;

	requestAnimationFrame(async () => {
		(await getDocumentBody()).appendChild(overlayFrame);
		if (!skipAnimation && !fullscreen) {
			triggerWindowShowAnimation(windowContainer);
		} else {
			windowContainer.style.opacity = "1";
			windowContainer.style.transform = "scale(1)";
		}
	});

	return {
		overlayFrame,
		windowElement: windowContainer,
		contentElement,
		topbar,
		dragHandle: topbar,
		closeButton,
		closeWindowHandler,
	};
}

export let globalNotificationContainer: HTMLElement;

/**
 * Self-initializing notification layer.
 */
(async () => {
	await getDocumentHead();
	const notificationOverlay = settingsUi.fillScreen(false);
	notificationOverlay.classList.add("styleshift-main");
	notificationOverlay.style.zIndex = "20000";
	await applyThemeToElement(notificationOverlay);

	setTimeout(async () => {
		(await getDocumentBody()).append(notificationOverlay);
	}, 1);

	globalNotificationContainer = document.createElement("div");
	globalNotificationContainer.className = "styleshift-notification-container";
	notificationOverlay.append(globalNotificationContainer);

	const taskbarMountPoint = document.createElement("div");
	notificationOverlay.append(taskbarMountPoint);
	settingsUi.renderTaskbar(taskbarMountPoint);
})();

export const DEFAULT_ANIMATION_DURATION_MS = 250;

export async function playUiAnimation(target: HTMLElement, animationName: string): Promise<void> {
	if (animationName.includes("Show")) {
		target.style.opacity = "0";
		target.style.transform = "scale(0.95)";
		await waitOneFrame();
	}

	target.style.animation = `styleshift-${animationName.toLowerCase()} ${DEFAULT_ANIMATION_DURATION_MS / 1000}s forwards`;

	await sleep(DEFAULT_ANIMATION_DURATION_MS);

	if (animationName.includes("Show")) {
		target.style.opacity = "1";
		target.style.transform = "scale(1)";
		target.style.animation = "";
	}
}

export async function triggerWindowShowAnimation(target: HTMLElement): Promise<void> {
	await playUiAnimation(target, "Show-Pop-Animation");
}

export async function triggerWindowHideAnimation(target: HTMLElement): Promise<void> {
	await playUiAnimation(target, "Hide-Pop-Animation");
}

/**
 * Internal helper to render a dialog component and handle its lifecycle.
 */
function renderDialog<T>(renderFn: (mountPoint: HTMLElement, resolve: (val: T) => void) => any): Promise<T> {
	return new Promise((resolve) => {
		const mountPoint = document.createElement("div");
		document.body.appendChild(mountPoint);

		let component: any;
		const handleResolve = (val: T) => {
			resolve(val);
			setTimeout(() => {
				if (component) unmount(component);
				mountPoint.remove();
			}, 400);
		};

		component = renderFn(mountPoint, handleResolve);
	});
}

/**
 * Displays a confirmation dialog to the user.
 */
export async function showUserConfirmation(
	message: string,
	title: string = "Confirm Action",
	options: {
		confirmLabel?: string;
		cancelLabel?: string;
		confirmColor?: string;
		cancelColor?: string;
		align?: "left" | "center" | "right";
	} = {},
): Promise<boolean> {
	return renderDialog((mountPoint, resolve) =>
		settingsUi.confirm(
			{
				title,
				message,
				align: options.align || "center",
				buttons: [
					{
						label: options.confirmLabel || "Confirm",
						color: options.confirmColor || "#4caf50",
						onClick: () => resolve(true),
					},
					{
						label: options.cancelLabel || "Cancel",
						color: options.cancelColor || "var(--fg-opacity-20, #646464)",
						onClick: () => resolve(false),
					},
				],
				onClose: () => resolve(false),
			},
			mountPoint,
		),
	);
}

/**
 * Displays a selection dialog with multiple buttons.
 * @returns {Promise<string | null>} The label of the clicked button or null if cancelled.
 */
export async function showSelection(
	message: string,
	title: string = "Select Option",
	buttons: { label: string; color?: string; description?: string }[] = [],
	options: { align?: "left" | "center" | "right"; vertical?: boolean } = {},
): Promise<string | null> {
	return renderDialog((mountPoint, resolve) =>
		settingsUi.confirm(
			{
				title,
				message,
				align: options.align || "center",
				vertical: options.vertical || false,
				buttons: buttons.map((btn) => ({
					label: btn.label,
					color: btn.color || "#7f5db7",
					description: btn.description,
					onClick: () => resolve(btn.label),
				})),
				onClose: () => resolve(null),
			},
			mountPoint,
		),
	);
}

/**
 * Displays a prompt dialog with an input field to the user.
 */
export async function showUserPrompt(
	title: string = "Enter Text",
	placeholder: string = "Type here...",
	value: string = "",
	options: { content?: string; multiline?: boolean } = {},
): Promise<string | null> {
	return renderDialog((mountPoint, resolve) =>
		settingsUi.prompt(
			{
				title,
				placeholder,
				value,
				content: options.content || "",
				multiline: options.multiline || false,
				onConfirm: (val: string) => resolve(val),
				onCancel: () => resolve(null),
			},
			mountPoint,
		),
	);
}

/**
 * Re-renders all visible UI components to reflect state changes.
 */
export async function updateAllUiComponents(): Promise<void> {
	logger.info("ui", "Refreshing all UI components...");

	const isDevMode = await getRootValue("developerMode");

	if (isDevMode && !isDevModulesLoaded) {
		logger.info("ui", "Initializing developer environment...");
		await initializeDeveloperEnvironment();
	}

	if (extensionSettingsUi) await extensionSettingsUi.recreateUi();
	if (editorUi) await editorUi.recreateUi();

	if (!isDevMode) {
		removeConfigUi();
	}
}

/**
 * Displays an alert dialog with a message and OK button.
 */
export async function showAlert(
	message: string,
	title: string = "Alert",
	options: { okLabel?: string; okColor?: string; align?: "left" | "center" | "right" } = {},
): Promise<void> {
	return renderDialog((mountPoint, resolve) =>
		settingsUi.confirm(
			{
				title,
				message,
				align: options.align || "center",
				buttons: [
					{
						label: options.okLabel || "OK",
						color: options.okColor || "var(--theme-0)",
						onClick: () => resolve(),
					},
				],
				onClose: () => resolve(),
			},
			mountPoint,
		),
	);
}
