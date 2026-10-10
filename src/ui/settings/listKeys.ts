import { getCategoryLabel } from "@settings/registry/category";
import type { Category, SeparateCategory, Setting } from "@settings/types/styleshiftTypes";

export function categoryKey(item: Category | SeparateCategory): string {
	return "isHeader" in item ? `header:${item.label}` : `category:${getCategoryLabel(item)}`;
}

/** Keys that follow each setting, not its position, so a reorder moves elements instead of reusing them. */
export function settingKeys(settings: Setting[]): string[] {
	const seen = new Map<string, number>();
	return settings.map((setting) => {
		const base = `${setting.type}:${(setting as any).id ?? ""}:${(setting as any).name ?? ""}`;
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		return count === 0 ? base : `${base}#${count}`;
	});
}
