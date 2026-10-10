import type { Setting } from "@settings/types/styleshiftTypes";

/** The setting, plus the settings below it when it is a group (up to the next group or sub-title). */
export function settingBlockAt(settings: Setting[], item: Setting): Setting[] {
	const startIdx = settings.indexOf(item);
	if (startIdx === -1) return [];
	if (item.type !== "group") return [item];

	let endIdx = settings.length;
	for (let i = startIdx + 1; i < settings.length; i++) {
		if (["group", "subTitle"].includes(settings[i].type)) {
			endIdx = i;
			break;
		}
	}
	return settings.slice(startIdx, endIdx);
}

/**
 * Moves `item` (and its group block) from `source` into `target`.
 * With an `anchor`, the block goes before or after it. Without one, it goes to the top, or the bottom when `isAfter`.
 * Returns false and changes nothing when the move is not possible.
 */
export function moveSetting(
	source: Setting[],
	target: Setting[],
	item: Setting,
	anchor: Setting | null,
	isAfter: boolean,
): boolean {
	const block = settingBlockAt(source, item);
	if (block.length === 0) return false;
	if (anchor && (!target.includes(anchor) || block.includes(anchor))) return false;

	source.splice(source.indexOf(item), block.length);

	const dropIndex = anchor ? target.indexOf(anchor) + (isAfter ? 1 : 0) : bottomOrTop(target, isAfter);
	target.splice(dropIndex, 0, ...block);
	return true;
}

function bottomOrTop(settings: Setting[], isAfter: boolean) {
	return isAfter ? settings.length : 0;
}
