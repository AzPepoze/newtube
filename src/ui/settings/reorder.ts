import { saveAndRefreshAll } from "@core/runtime/controller";
import { logger } from "@shared/logger";
import { getAddOnItems, getSettingCategory } from "@settings/registry/items";
import { reorderCategory } from "@settings/registry/category";
import type { Category, Setting } from "@settings/types/styleshiftTypes";
import { type DropCandidate, type DropHit, startDragSession } from "./dragSort";

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

function isEligibleTarget(info: DropInfo, dragging: Setting | Category) {
	if (info.data === dragging) return false;
	if (isCategoryData(dragging)) return info.dataType === "category" && (info.data as Category).editable;
	return info.dataType === "setting" && Boolean(getSettingCategory(info.data as Setting)?.editable);
}

function getDropCandidates(dragging: Setting | Category): DropCandidate<DropInfo>[] {
	const candidates: DropCandidate<DropInfo>[] = [];
	for (const [el, info] of dropTargets) {
		if (isEligibleTarget(info, dragging)) candidates.push({ el, value: info });
	}
	return candidates;
}

/** Takes a setting out of `settings`. A group also takes the settings below it, up to the next group or sub-title. */
function takeSettingBlock(settings: Setting[], item: Setting): Setting[] {
	const startIdx = settings.indexOf(item);
	if (startIdx === -1) return [];
	if (item.type !== "group") return settings.splice(startIdx, 1);

	let endIdx = settings.length;
	for (let i = startIdx + 1; i < settings.length; i++) {
		if (["group", "subTitle"].includes(settings[i].type)) {
			endIdx = i;
			break;
		}
	}
	return settings.splice(startIdx, endIdx - startIdx);
}

function moveCategoryItem(source: Category, target: DropInfo, isAfter: boolean): boolean {
	return reorderCategory(getAddOnItems(), source, target.data as Category, isAfter);
}

function moveSettingItem(item: Setting, target: DropInfo, isAfter: boolean): boolean {
	const sourceCategory = getSettingCategory(item);
	const targetCategory =
		target.dataType === "category" ? (target.data as Category) : getSettingCategory(target.data as Setting);
	if (!sourceCategory?.editable || !targetCategory?.editable) return false;

	const targetIsSetting = target.dataType !== "category";
	if (targetIsSetting && !targetCategory.settings.includes(target.data as Setting)) return false;

	const itemsToInsert = takeSettingBlock(sourceCategory.settings, item);
	if (itemsToInsert.length === 0) return false;

	const dropIndex = targetIsSetting ? targetCategory.settings.indexOf(target.data as Setting) + (isAfter ? 1 : 0) : 0;
	targetCategory.settings.splice(dropIndex, 0, ...itemsToInsert);
	return true;
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
