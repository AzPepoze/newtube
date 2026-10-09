import type { Category } from "@settings/types/styleshiftTypes";

export function getCategoryLabel(category: Category): string {
	return typeof category.category === "string" ? category.category : category.category.label;
}
