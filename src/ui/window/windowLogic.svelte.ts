import { windowManager } from "@ui/window/windowManager.svelte";
import { constrainWindowPosition } from "./windowUtils";

export class WindowLogic {
	windowId: string;
	title = $state("");
	isMaximized = $state(false);
	isMinimized = $state(false);
	isDragging = $state(false);
	isResizing = $state(false);
	isHovering = $state(false);
	activityTimeout: any;

	previousRect = $state({
		width: "50%",
		height: "80%",
		translate: "",
	});

	onClose: () => void;
	onPositionChange: (pos: any) => void;
	autoHideTopbar = $state(false);

	constructor(config: {
		windowId: string;
		title?: string;
		onClose: () => void;
		onPositionChange: (pos: any) => void;
		autoHideTopbar?: boolean;
	}) {
		this.windowId = config.windowId;
		this.title = config.title ?? "";
		this.onClose = config.onClose;
		this.onPositionChange = config.onPositionChange;
		this.autoHideTopbar = config.autoHideTopbar ?? false;
	}

	handleActivity = () => {
		if (!this.autoHideTopbar) return;
		this.isHovering = true;
		clearTimeout(this.activityTimeout);
		this.activityTimeout = setTimeout(() => {
			if (!this.isDragging && !this.isResizing) {
				this.isHovering = false;
			}
		}, 2000);
	};

	handleClose = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		this.onClose();
	};

	toggleMaximize = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		const windowEl = document.querySelector(`[data-window-id="${this.windowId}"]`) as HTMLElement;
		if (!windowEl) return;

		if (this.isMaximized) {
			windowEl.style.width = this.previousRect.width;
			windowEl.style.height = this.previousRect.height;
			windowEl.style.translate = this.previousRect.translate;
			this.isMaximized = false;
		} else {
			this.previousRect = {
				width: windowEl.style.width || "50%",
				height: windowEl.style.height || "80%",
				translate: windowEl.style.translate || "",
			};
			windowEl.style.width = "100vw";
			windowEl.style.height = "100vh";
			windowEl.style.translate = "0px 0px";
			this.isMaximized = true;
		}
	};

	toggleMinimize = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		this.isMinimized = true;
		windowManager.addWindow({
			id: this.windowId,
			title: this.title,
			restore: () => this.restoreFromTaskbar(),
		});
	};

	restoreFromTaskbar = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		this.isMinimized = false;
		windowManager.removeWindow(this.windowId);
	};

	handleDrag = (e: MouseEvent, minVisibleRatio: number) => {
		if (this.isMaximized) return;
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest(".control-btn")) return;

		const windowEl = document.querySelector(`[data-window-id="${this.windowId}"]`) as HTMLElement;
		if (!windowEl) return;

		this.isDragging = true;
		const startX = e.clientX;
		const startY = e.clientY;
		const rect = windowEl.getBoundingClientRect();
		const startLeft = rect.left;
		const startTop = rect.top;

		const onMouseMove = (e: MouseEvent) => {
			const newLeft = startLeft + (e.clientX - startX);
			const newTop = startTop + (e.clientY - startY);
			const windowWidth = windowEl.offsetWidth;
			const windowHeight = windowEl.offsetHeight;

			const constrainedPosition = constrainWindowPosition(newLeft, newTop, windowWidth, windowHeight, minVisibleRatio);

			windowEl.style.translate = `${constrainedPosition.left}px ${constrainedPosition.top}px`;
		};

		const onMouseUp = () => {
			this.isDragging = false;
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			this.onPositionChange({
				translate: windowEl.style.translate,
				width: windowEl.style.width,
				height: windowEl.style.height,
			});
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	destroy() {
		windowManager.removeWindow(this.windowId);
		clearTimeout(this.activityTimeout);
	}
}
