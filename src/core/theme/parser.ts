import type { Theme } from "./manager";

export type Tag = {
	id: string;
	name: string;
	slug: string;
	groupName: string;
};

export type PaginationMeta = {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
};

/**
 * Groups a flat array of tags by their groupName category.
 */
export function groupTagsByCategory(tags: Tag[]): Record<string, Tag[]> {
	const groups: Record<string, Tag[]> = {};
	for (const tag of tags) {
		const group = tag.groupName || "Other";
		if (!groups[group]) {
			groups[group] = [];
		}
		groups[group].push(tag);
	}
	return groups;
}

/**
 * Safely extracts an array from API responses that might be wrapped in paginated or structured objects.
 */
export function extractListFromResponse<T = unknown>(data: unknown): T[] {
	if (Array.isArray(data)) return data;
	if (!data || typeof data !== "object") return [];
	const obj = data as Record<string, unknown>;
	if (Array.isArray(obj.items)) return obj.items as T[];
	if (Array.isArray(obj.themes)) return obj.themes as T[];
	if (Array.isArray(obj.data)) return obj.data as T[];
	return [];
}

/**
 * Extracts pagination metadata from store API response objects.
 */
export function extractPaginationFromResponse(data: unknown, itemCount = 0): PaginationMeta {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return { total: itemCount, limit: 24, offset: 0, hasMore: false };
	}
	const obj = data as Record<string, unknown>;
	const total = typeof obj.total === "number" ? obj.total : itemCount;
	const limit = typeof obj.limit === "number" ? obj.limit : 24;
	const offset = typeof obj.offset === "number" ? obj.offset : 0;
	const hasMore = offset + itemCount < total;
	return { total, limit, offset, hasMore };
}

/**
 * Normalizes raw store API theme objects into a structured Theme model.
 */
export function normalizeStoreThemePayload(data: any, fallbackId = ""): Theme {
	const themeId = (data?.themeId as string | undefined) ?? (data?.id as string | undefined) ?? fallbackId;
	const themeName = (data?.themeName as string | undefined) ?? (data?.name as string | undefined) ?? themeId;

	const rawSettings = data?.settings;
	let currentSettings: Record<string, unknown> | undefined;
	let addOnStyleShiftItems: Theme["addOnStyleShiftItems"] = Array.isArray(data?.addOnStyleShiftItems)
		? data.addOnStyleShiftItems
		: undefined;

	if (rawSettings && typeof rawSettings === "object" && !Array.isArray(rawSettings)) {
		if (
			"currentSettings" in rawSettings &&
			rawSettings.currentSettings &&
			typeof rawSettings.currentSettings === "object" &&
			!Array.isArray(rawSettings.currentSettings)
		) {
			currentSettings = rawSettings.currentSettings as Record<string, unknown>;
			if (Array.isArray(rawSettings.addOnStyleShiftItems)) {
				addOnStyleShiftItems = rawSettings.addOnStyleShiftItems;
			}
		} else {
			currentSettings = rawSettings as Record<string, unknown>;
		}
	}

	const images = Array.isArray(data?.images)
		? data.images
		: Array.isArray(data?.screenshots)
			? data.screenshots
			: undefined;
	const coverImage =
		typeof data?.coverImage === "string"
			? data.coverImage
			: typeof data?.previewImage === "string"
				? data.previewImage
				: undefined;

	const downloads = typeof data?.downloads === "number" ? data.downloads : undefined;
	const rating = typeof data?.rating === "number" || data?.rating === null ? data.rating : undefined;
	const ratingCount = typeof data?.ratingCount === "number" ? data.ratingCount : undefined;
	const ownerId = typeof data?.ownerId === "string" && data.ownerId.trim() ? data.ownerId : undefined;

	return {
		themeId,
		themeName,
		currentSettings: currentSettings as Theme["currentSettings"],
		addOnStyleShiftItems,
		images,
		coverImage,
		ownerId,
		downloads,
		rating,
		ratingCount,
	};
}
