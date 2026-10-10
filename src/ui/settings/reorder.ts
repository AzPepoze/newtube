import { saveAndRefreshAll } from "@core/runtime/controller";
import { logger } from "@shared/logger";
import { findAddOnCategory, getAddOnItems, getSettingCategory } from "@settings/registry/items";
import { reorderCategory } from "@settings/registry/category";
import type { Category, Setting } from "@settings/types/styleshiftTypes";
import { type DropCandidate, type DropHit, startDragSession } from "./dragSort";
import { moveSetting } from "./settingMove";

interface DropInfo {
	data: Setting | Category;
	dataType: string;
}

const dropTargets = new Map<HTMLElement, DropInfo>();

export function clearDropTargets() {
	dropTargets.clear();
}

export async function addDropTarget(
	frame: HTMLElement,
	_parent: HTMLElement,
	thisData: Setting | Category,
	dataType: string,
) {
	dropTargets.set(frame, { data: thisData, dataType });
}

export function removeDropTarget(frame: HTMLElement) {
	dropTargets.delete(frame);
}

function isCategoryData(data: Setting | Category): data is Category {
	return (data as Category).category != null;
}

/** A setting can drop onto another setting, or onto a category's list (for empty categories). */
function isSettingDropZone(info: DropInfo) {
	return info.dataType === "setting" || info.dataType === "categoryList";
}

/** The stored category for a drop target. Sidebar and list copies are not the stored objects, so they are looked up by label. */
function targetCategoryOf(info: DropInfo): Category | null {
	if (info.dataType === "setting") return getSettingCategory(info.data as Setting);
	return findAddOnCategory(info.data as Category) ?? null;
}

function isEligibleTarget(info: DropInfo, dragging: Setting | Category) {
	if (info.data === dragging) return false;
	if (isCategoryData(dragging)) return info.dataType === "category" && (info.data as Category).editable;
	return isSettingDropZone(info) && Boolean(targetCategoryOf(info)?.editable);
}

function getDropCandidates(dragging: Setting | Category): DropCandidate<DropInfo>[] {
	const candidates: DropCandidate<DropInfo>[] = [];
	for (const [el, info] of dropTargets) {
		if (isEligibleTarget(info, dragging)) candidates.push({ el, value: info, preview: previewFor(el, info) });
	}
	return candidates;
}

/** A category list previews between its setting rows, never after its add button. */
function previewFor(el: HTMLElement, info: DropInfo): DropCandidate<DropInfo>["preview"] {
	if (info.dataType !== "categoryList") return undefined;
	return (isAfter) => {
		const rows = el.querySelectorAll<HTMLElement>(":scope > .styleshift-setting-frame");
		if (rows.length === 0) return { anchor: (el.firstElementChild as HTMLElement | null) ?? el, isAfter: false };
		return isAfter ? { anchor: rows[rows.length - 1], isAfter: true } : { anchor: rows[0], isAfter: false };
	};
}

function moveCategoryItem(source: Category, target: DropInfo, isAfter: boolean): boolean {
	return reorderCategory(getAddOnItems(), source, target.data as Category, isAfter);
}

function moveSettingItem(item: Setting, target: DropInfo, isAfter: boolean): boolean {
	const sourceCategory = getSettingCategory(item);
	const targetCategory = targetCategoryOf(target);
	if (!sourceCategory?.editable || !targetCategory?.editable) return false;

	const anchor = target.dataType === "setting" ? (target.data as Setting) : null;
	return moveSetting(sourceCategory.settings, targetCategory.settings, item, anchor, isAfter);
}

async function dropItem(dragging: Setting | Category, hit: DropHit<DropInfo>) {
	const moved = isCategoryData(dragging)
		? moveCategoryItem(dragging, hit.value, hit.isAfter)
		: moveSettingItem(dragging, hit.value, hit.isAfter);
	if (!moved) return;

	try {
		await saveAndRefreshAll();
	} catch (error) {
		logger.error("ui", "Could not apply the new order:", error);
	}
}

export async function addDrag(
	dragHandle: HTMLElement,
	frame: HTMLElement | null,
	_parent: HTMLElement | null,
	thisData: Setting | Category,
) {
	dragHandle.addEventListener("mousedown", (event) => {
		event.preventDefault();

		const targetFrame = frame || (dragHandle.closest(".styleshift-setting-frame") as HTMLElement);
		const scroller = targetFrame?.parentElement?.closest(".styleshift-scrollable") as HTMLElement | null;
		if (!targetFrame || !scroller) return;

		startDragSession<DropInfo>({
			event,
			frame: targetFrame,
			scroller,
			getCandidates: () => getDropCandidates(thisData),
			onDrop: (hit) => dropItem(thisData, hit),
		});
	});
}
