import type { Category } from "@settings/types/styleshiftTypes";

export function getCategoryLabel(category: Category): string {
	return typeof category.category === "string" ? category.category : category.category.label;
}

/** Finds a category by label, since sidebar copies are not the same objects as the stored ones. */
export function findCategoryIndex(categories: Category[], target: Category): number {
	const label = getCategoryLabel(target);
	return categories.findIndex((category) => getCategoryLabel(category) === label);
}

/** Moves the stored category next to `target`. Returns false when the order did not change. */
export function reorderCategory(categories: Category[], source: Category, target: Category, isAfter: boolean): boolean {
	const fromIndex = findCategoryIndex(categories, source);
	if (fromIndex === -1) return false;

	const [moved] = categories.splice(fromIndex, 1);
	const targetIndex = findCategoryIndex(categories, target);
	if (targetIndex === -1) {
		categories.splice(fromIndex, 0, moved);
		return false;
	}

	const insertAt = targetIndex + (isAfter ? 1 : 0);
	categories.splice(insertAt, 0, moved);
	return insertAt !== fromIndex;
}

/** Swaps the stored category with its neighbour. Returns false at the edges or when not found. */
export function shiftCategory(categories: Category[], category: Category, direction: "up" | "down"): boolean {
	const index = findCategoryIndex(categories, category);
	const newIndex = direction === "up" ? index - 1 : index + 1;
	if (index === -1 || newIndex < 0 || newIndex >= categories.length) return false;

	[categories[index], categories[newIndex]] = [categories[newIndex], categories[index]];
	return true;
}
