import { windowManager } from "@ui/window/windowManager.svelte";
import { getSnapRect, getSnapZone, type SnapZone, type WindowRect } from "./snap";
import { registerSnapped, snapSplit, unregisterSnapped } from "./snapLayout";
import { hideSnapPreview, showSnapPreview } from "./snapPreview";
import { constrainWindowPosition } from "./windowUtils";

const DETACH_THRESHOLD_PX = 4;
const SNAP_ANIMATION_MS = 220;

interface DragAnchor {
	x: number;
	y: number;
	left: number;
	top: number;
}

interface DragGrab {
	ratioX: number;
	offsetY: number;
}

function hasMovedPastThreshold(startX: number, startY: number, e: MouseEvent) {
	return Math.hypot(e.clientX - startX, e.clientY - startY) >= DETACH_THRESHOLD_PX;
}

export class WindowLogic {
	windowId: string;
	title = $state("");
	snapZone = $state<SnapZone | null>(null);
	isMinimized = $state(false);
	isDragging = $state(false);
	isResizing = $state(false);
	isHovering = $state(false);
	isSnapping = $state(false);
	activityTimeout: any;
	snapTimeout: any;

	/** Geometry before the window was snapped or maximized. Null while the window floats freely. */
	previousRect: WindowRect | null = null;
	previewZone: SnapZone | null = null;

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

	get isMaximized() {
		return this.snapZone === "maximize";
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
		const windowEl = this.getWindowElement();
		if (!windowEl) return;

		if (this.snapZone) {
			this.restoreSavedRect(windowEl);
		} else {
			this.snapTo(windowEl, "maximize");
		}
	};

	toggleMinimize = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		this.isMinimized = true;
		unregisterSnapped(this);
		windowManager.addWindow({
			id: this.windowId,
			title: this.title,
			restore: () => this.restoreFromTaskbar(),
		});
	};

	restoreFromTaskbar = (e?: MouseEvent) => {
		if (e) e.stopPropagation();
		this.isMinimized = false;
		if (this.snapZone) registerSnapped(this);
		windowManager.removeWindow(this.windowId);
	};

	/** Re-fits a snapped window after the viewport changes size. */
	refreshSnap() {
		const windowEl = this.getWindowElement();
		if (!windowEl || !this.snapZone) return;
		this.applyRect(windowEl, this.snapRectFor(this.snapZone), false);
	}

	handleDrag = (e: MouseEvent, minVisibleRatio: number) => {
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest(".control-btn")) return;

		const windowEl = this.getWindowElement();
		if (!windowEl) return;

		const startX = e.clientX;
		const startY = e.clientY;
		const rect = windowEl.getBoundingClientRect();
		const grab: DragGrab = {
			ratioX: (startX - rect.left) / rect.width,
			offsetY: startY - rect.top,
		};
		let anchor: DragAnchor = { x: startX, y: startY, left: rect.left, top: rect.top };

		const onMouseMove = (moveEvent: MouseEvent) => {
			if (!this.isDragging) {
				if (this.previousRect && !hasMovedPastThreshold(startX, startY, moveEvent)) return;
				this.isDragging = true;
				if (this.previousRect) {
					anchor = this.detachFromSnap(windowEl, this.previousRect, moveEvent, grab);
				}
			}

			const constrainedPosition = constrainWindowPosition(
				anchor.left + (moveEvent.clientX - anchor.x),
				anchor.top + (moveEvent.clientY - anchor.y),
				windowEl.offsetWidth,
				windowEl.offsetHeight,
				minVisibleRatio,
			);
			windowEl.style.translate = `${constrainedPosition.left}px ${constrainedPosition.top}px`;
			this.updateSnapPreview(this.zoneAt(moveEvent));
		};

		const onMouseUp = (upEvent: MouseEvent) => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			this.updateSnapPreview(null);
			if (!this.isDragging) return;

			this.isDragging = false;
			const zone = this.zoneAt(upEvent);
			if (zone) {
				this.snapTo(windowEl, zone);
				return;
			}

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
		clearTimeout(this.snapTimeout);
		hideSnapPreview();
		unregisterSnapped(this);
	}

	private getWindowElement() {
		return document.querySelector(`[data-window-id="${this.windowId}"]`) as HTMLElement | null;
	}

	private zoneAt(e: MouseEvent) {
		return getSnapZone(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
	}

	private snapRectFor(zone: SnapZone) {
		return getSnapRect(zone, window.innerWidth, window.innerHeight, snapSplit);
	}

	private updateSnapPreview(zone: SnapZone | null) {
		if (zone === this.previewZone) return;
		this.previewZone = zone;
		if (zone) {
			showSnapPreview(this.snapRectFor(zone));
		} else {
			hideSnapPreview();
		}
	}

	private saveRect(windowEl: HTMLElement) {
		if (this.previousRect) return;
		const rect = windowEl.getBoundingClientRect();
		this.previousRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
	}

	private snapTo(windowEl: HTMLElement, zone: SnapZone) {
		this.saveRect(windowEl);
		this.snapZone = zone;
		registerSnapped(this);
		this.applyRect(windowEl, this.snapRectFor(zone));
	}

	private restoreSavedRect(windowEl: HTMLElement, animate = true) {
		const saved = this.previousRect;
		this.snapZone = null;
		this.previousRect = null;
		unregisterSnapped(this);
		if (saved) this.applyRect(windowEl, saved, animate);
	}

	/** Puts the saved size back under the cursor so the grab point stays on the same spot of the title bar. */
	private detachFromSnap(windowEl: HTMLElement, saved: WindowRect, pointer: MouseEvent, grab: DragGrab): DragAnchor {
		this.restoreSavedRect(windowEl, false);
		return {
			x: pointer.clientX,
			y: pointer.clientY,
			left: pointer.clientX - grab.ratioX * saved.width,
			top: pointer.clientY - grab.offsetY,
		};
	}

	private applyRect(windowEl: HTMLElement, rect: WindowRect, animate = true) {
		windowEl.style.width = `${rect.width}px`;
		windowEl.style.height = `${rect.height}px`;
		windowEl.style.translate = `${rect.left}px ${rect.top}px`;
		if (animate) this.playSnapAnimation();

		this.onPositionChange({
			translate: windowEl.style.translate,
			width: windowEl.style.width,
			height: windowEl.style.height,
		});
	}

	private playSnapAnimation() {
		this.isSnapping = true;
		clearTimeout(this.snapTimeout);
		this.snapTimeout = setTimeout(() => {
			this.isSnapping = false;
		}, SNAP_ANIMATION_MS);
	}
}
