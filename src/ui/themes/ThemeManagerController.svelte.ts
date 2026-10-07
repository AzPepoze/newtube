import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { enterPrompt } from "@core/shared/dialogs";
import { createNotification } from "@core/shared/notifications";
import { getRootValue, persistCachedDataToStorage } from "@core/storage/manager";
import { exportThemeWithSelection } from "@core/theme/exporter";
import { exportCurrentSettingsObject, importPresetToSettings, importThemeWorkflow } from "@core/theme/importer";
import {
	applyTheme as applyThemeManager,
	deleteTheme as deleteThemeManager,
	recordThemeDownload,
	saveTheme as saveThemeManager,
	type Theme,
} from "@core/theme/manager";
import { STYLESHIFT_STORE_API_URL, STYLESHIFT_STORE_ORIGINS, STYLESHIFT_STORE_URL } from "@core/theme/config";
import {
	extractListFromResponse,
	extractPaginationFromResponse,
	groupTagsByCategory,
	normalizeStoreThemePayload,
	type Tag,
} from "@core/theme/parser";

export type CreatorProfile = {
	id: string;
	displayName: string;
	avatarUrl: string;
	profileUrl: string;
};

const CREATOR_PROFILE_CACHE_TTL = 5 * 60 * 1000;
const creatorProfileCache = new SvelteMap<string, { profile: CreatorProfile; expiresAt: number }>();
const creatorProfileRequests = new SvelteMap<string, Promise<CreatorProfile | null>>();

function asNonEmptyString(value: unknown): string {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	return trimmed ? trimmed : "";
}

function isHttpUrl(value: unknown): value is string {
	if (!asNonEmptyString(value)) return false;
	try {
		const url = new URL(value as string);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function unwrapStoreUser(data: unknown): Record<string, unknown> | null {
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const root = data as Record<string, unknown>;
	if (root.user && typeof root.user === "object" && !Array.isArray(root.user)) {
		return root.user as Record<string, unknown>;
	}
	return root;
}

function resolveStoreOrigin(): string {
	const configured = asNonEmptyString(STYLESHIFT_STORE_ORIGINS?.[0]).replace(/\/$/, "");
	if (configured) return configured;
	try {
		return new URL(STYLESHIFT_STORE_URL).origin;
	} catch {
		return "";
	}
}

function parseCreatorProfile(data: unknown, ownerId: string): CreatorProfile | null {
	const user = unwrapStoreUser(data);
	if (!user || user.id !== ownerId) return null;

	const origin = resolveStoreOrigin();
	if (!origin) return null;

	return {
		id: ownerId,
		displayName: asNonEmptyString(user.name) || asNonEmptyString(user.displayName) || `@${ownerId.slice(0, 8)}`,
		avatarUrl: isHttpUrl(user.avatarUrl) ? user.avatarUrl : "",
		profileUrl: `${origin}/profile?userId=${encodeURIComponent(ownerId)}`,
	};
}

async function fetchCreatorProfile(ownerId: string): Promise<CreatorProfile | null> {
	const res = await fetch(`${STYLESHIFT_STORE_API_URL}/users/profile?userId=${encodeURIComponent(ownerId)}`);
	if (!res.ok) return null;
	return parseCreatorProfile(await res.json(), ownerId);
}

async function getCreatorProfile(ownerId: string): Promise<CreatorProfile | null> {
	const cached = creatorProfileCache.get(ownerId);
	if (cached && cached.expiresAt > Date.now()) return cached.profile;

	const inFlight = creatorProfileRequests.get(ownerId);
	if (inFlight) return inFlight;

	const request = fetchCreatorProfile(ownerId)
		.then((profile) => {
			if (profile) creatorProfileCache.set(ownerId, { profile, expiresAt: Date.now() + CREATOR_PROFILE_CACHE_TTL });
			return profile;
		})
		.catch(() => null)
		.finally(() => {
			creatorProfileRequests.delete(ownerId);
		});
	creatorProfileRequests.set(ownerId, request);
	return request;
}

function collectOwnerIds(themes: Theme[]): string[] {
	const ownerIds = themes.map((theme) => theme.ownerId).filter((ownerId): ownerId is string => Boolean(ownerId));
	return [...new SvelteSet(ownerIds)];
}

async function parseResponseError(res: Response): Promise<string> {
	try {
		const data = await res.json();
		if (data && typeof data === "object") {
			const msg = data.message || data.error || data.detail || data.msg;
			if (typeof msg === "string" && msg.trim()) return msg;
		}
	} catch {
		// Response was not JSON
	}
	if (res.statusText) {
		return `Server error (${res.status}): ${res.statusText}`;
	}
	return `Server error (${res.status})`;
}

export class ThemeManagerController {
	themes = $state<Theme[]>([]);
	storeThemes = $state<Theme[]>([]);
	activeThemeId = $state<string | null>(null);
	loadingThemeId = $state<string | null>(null);
	isLoadingStore = $state(false);
	isLoadingMoreStore = $state(false);
	storeError = $state<string | null>(null);
	storeOffset = $state(0);
	storeLimit = $state(24);
	storeTotal = $state(0);
	hasMoreStore = $state(false);
	wasThemeModified = $state(false);

	availableTags = $state<Tag[]>([]);
	selectedTag = $state<string>("");
	creatorProfiles = $state<Record<string, CreatorProfile>>({});

	private backupSettings: any = null;
	private originalActiveTheme: string | null = null;
	private closeWindow?: () => void;

	constructor(options: { closeWindow?: () => void }) {
		this.closeWindow = options.closeWindow;
	}

	installedThemeIds = $derived(new SvelteSet(this.themes.map((t) => t.themeId)));
	currentPage = $derived(Math.floor(this.storeOffset / this.storeLimit) + 1);
	totalPages = $derived(Math.max(1, Math.ceil(this.storeTotal / this.storeLimit)));
	groupedTags = $derived(groupTagsByCategory(this.availableTags));

	async loadThemes() {
		this.themes = (await getRootValue("themes")) || [];
		void this.loadCreatorProfiles(this.themes);
		this.backupSettings = JSON.parse(JSON.stringify(await getRootValue("currentSettings")));
		this.originalActiveTheme = await getRootValue("activeTheme");
		await this.refreshActiveTheme();
	}

	private async loadCreatorProfiles(themes: Theme[]) {
		const ownerIds = collectOwnerIds(themes);
		const profiles = await Promise.all(ownerIds.map((ownerId) => getCreatorProfile(ownerId)));
		const next = { ...this.creatorProfiles };
		for (const [index, ownerId] of ownerIds.entries()) {
			const profile = profiles[index];
			if (profile) next[ownerId] = profile;
		}
		this.creatorProfiles = next;
	}

	async refreshActiveTheme() {
		this.activeThemeId = await getRootValue("activeTheme");
	}

	async fetchTags() {
		if (this.availableTags.length > 0) return;
		try {
			const res = await fetch(`${STYLESHIFT_STORE_API_URL}/tags`);
			if (res.ok) {
				this.availableTags = await res.json();
			}
		} catch (e) {
			console.error("Failed to fetch store tags", e);
		}
	}

	async setSelectedTag(tag: string, query = "") {
		this.selectedTag = tag;
		await this.fetchStoreThemes(query, true);
	}

	async fetchStoreThemes(query = "", reset = true) {
		if (reset) {
			this.storeOffset = 0;
			this.isLoadingStore = true;
			this.storeError = null;
		} else {
			this.isLoadingMoreStore = true;
		}

		try {
			const tagParam = this.selectedTag ? `&tag=${encodeURIComponent(this.selectedTag)}` : "";
			const res = await fetch(
				`${STYLESHIFT_STORE_API_URL}/themes?q=${encodeURIComponent(query)}&sort=popular${tagParam}&limit=${this.storeLimit}&offset=${this.storeOffset}`,
			);
			if (res.ok) {
				const data = await res.json();
				if (data && typeof data === "object" && !Array.isArray(data) && (data.error || data.success === false)) {
					this.storeError = (data.message || data.error || "Failed to load store themes") as string;
				} else {
					const items = extractListFromResponse(data);
					const pagination = extractPaginationFromResponse(data, items.length);
					const mappedItems = items.map((t) => normalizeStoreThemePayload(t));

					if (reset) {
						this.storeThemes = mappedItems;
					} else {
						this.storeThemes = [...this.storeThemes, ...mappedItems];
					}

					this.storeTotal = pagination.total;
					void this.loadCreatorProfiles(mappedItems);
					this.hasMoreStore = pagination.hasMore;
					this.storeError = null;
				}
			} else {
				this.storeError = await parseResponseError(res);
			}
		} catch (e) {
			console.error("Store fetch failed", e);
			this.storeError = e instanceof Error && e.message ? e.message : "Check your connection and try again.";
		} finally {
			this.isLoadingStore = false;
			this.isLoadingMoreStore = false;
		}
	}

	async goToPage(page: number, query = "") {
		const targetPage = Math.min(Math.max(1, page), this.totalPages);
		const targetOffset = (targetPage - 1) * this.storeLimit;
		this.storeOffset = targetOffset;
		this.isLoadingStore = true;
		this.storeError = null;
		try {
			const tagParam = this.selectedTag ? `&tag=${encodeURIComponent(this.selectedTag)}` : "";
			const res = await fetch(
				`${STYLESHIFT_STORE_API_URL}/themes?q=${encodeURIComponent(query)}&sort=popular${tagParam}&limit=${this.storeLimit}&offset=${targetOffset}`,
			);
			if (res.ok) {
				const data = await res.json();
				if (data && typeof data === "object" && !Array.isArray(data) && (data.error || data.success === false)) {
					this.storeError = (data.message || data.error || "Failed to load store themes") as string;
				} else {
					const items = extractListFromResponse(data);
					const pagination = extractPaginationFromResponse(data, items.length);
					this.storeThemes = items.map((t) => normalizeStoreThemePayload(t));
					void this.loadCreatorProfiles(this.storeThemes);
					this.storeTotal = pagination.total;
					this.hasMoreStore = pagination.hasMore;
					this.storeError = null;
				}
			} else {
				this.storeError = await parseResponseError(res);
			}
		} catch (e) {
			console.error("Store page fetch failed", e);
			this.storeError = e instanceof Error && e.message ? e.message : "Check your connection and try again.";
		} finally {
			this.isLoadingStore = false;
		}
	}

	async nextPage(query = "") {
		if (this.currentPage < this.totalPages) {
			await this.goToPage(this.currentPage + 1, query);
		}
	}

	async prevPage(query = "") {
		if (this.currentPage > 1) {
			await this.goToPage(this.currentPage - 1, query);
		}
	}

	async loadMoreStoreThemes(query = "") {
		if (this.isLoadingStore || this.isLoadingMoreStore || !this.hasMoreStore) return;
		this.storeOffset = this.storeThemes.length;
		await this.fetchStoreThemes(query, false);
	}

	async saveCurrentAsTheme() {
		const name = await enterPrompt({ title: "Save Current Theme", placeholder: "Enter theme name..." });
		if (!name?.trim()) return;

		const currentSettings = await exportCurrentSettingsObject();
		if (await saveThemeManager(name, { currentSettings } as Theme, "EXTENSION")) {
			await this.loadThemes();
			this.wasThemeModified = true;
		}
	}

	async applyTheme(id: string, currentView: "installed" | "store") {
		const source = currentView === "installed" ? this.themes : this.storeThemes;
		const theme = source.find((t) => t.themeId === id);
		if (!theme) return;

		const displayName = theme.themeName || id;
		this.loadingThemeId = id;

		if (currentView === "store") {
			const saved = await saveThemeManager(displayName, $state.snapshot(theme), "EXTENSION", id);
			if (!saved) {
				this.loadingThemeId = null;
				return false;
			}
			await this.loadThemes();
			createNotification({
				icon: "download_done",
				title: "Theme Installed",
				content: `"${displayName}" added to collection.`,
			});
			await recordThemeDownload(id);
		}

		if (await applyThemeManager(id, displayName, "EXTENSION")) {
			this.activeThemeId = id;
			this.wasThemeModified = true;
		}
		this.loadingThemeId = null;
		return true;
	}

	async saveStoreTheme(id: string) {
		const theme = this.storeThemes.find((t) => t.themeId === id);
		if (!theme) return;

		this.loadingThemeId = id;
		if (await saveThemeManager(theme.themeName || id, $state.snapshot(theme), "EXTENSION", id)) {
			await this.loadThemes();
			createNotification({ icon: "save", title: "Theme Saved", content: `"${theme.themeName}" added to collection.` });
		}
		this.loadingThemeId = null;
	}

	async deleteTheme(id: string) {
		const theme = this.themes.find((t) => t.themeId === id);
		if (!theme) return;

		if (await deleteThemeManager(id, theme.themeName || id, "EXTENSION")) {
			this.themes = this.themes.filter((t) => t.themeId !== id);
			createNotification({ icon: "delete", title: "Theme Deleted", content: `"${theme.themeName}" removed.` });
		}
	}

	async exportTheme(id: string) {
		const theme = this.themes.find((t) => t.themeId === id);
		if (theme) {
			await exportThemeWithSelection(id, theme.themeName, $state.snapshot(theme));
		}
	}

	async openStore() {
		const { openThemeStore } = await import("@core/theme/storeIntegration");
		openThemeStore();
	}

	async importTheme() {
		await importThemeWorkflow();
		await this.loadThemes();
	}

	async handleOk() {
		await persistCachedDataToStorage();
		this.closeWindow?.();
	}

	async handleCancel() {
		if (this.wasThemeModified && this.backupSettings) {
			await importPresetToSettings(
				$state.snapshot(this.backupSettings),
				false,
				this.originalActiveTheme || "Previous Settings",
			);
		}
		this.closeWindow?.();
	}

	async startLivePreview(theme: Theme) {
		const targetSettings = theme.currentSettings || (theme as any).settings || {};
		const displayName = theme.themeName || "Preview Theme";

		if (!this.backupSettings) {
			this.backupSettings = JSON.parse(JSON.stringify(await getRootValue("currentSettings")));
			this.originalActiveTheme = await getRootValue("activeTheme");
		}

		await importPresetToSettings(targetSettings, false, displayName);
		this.closeWindow?.();
	}

	async cancelLivePreview() {
		if (this.backupSettings) {
			await importPresetToSettings(
				$state.snapshot(this.backupSettings),
				false,
				this.originalActiveTheme || "Previous Settings",
			);
		}
	}

	getThemePreview(theme: Theme) {
		const settings = theme.currentSettings || {};
		let bgColor = settings["MainThemeColor"] || settings["MainThemeColorC"] || "var(--theme-0)";
		if (bgColor.startsWith("#") && bgColor.length > 7) bgColor = bgColor.slice(0, 7);
		return { bgColor, bgImg: settings["BackgroundImageUrl"] || "", themeId: theme.themeId };
	}
}
