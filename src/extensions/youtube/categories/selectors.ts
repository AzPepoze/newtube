export function classAliasSelector(...aliases: string[]): string {
	return `:is(${aliases.map((alias) => `.${alias}`).join(", ")})`;
}

export const LOCKUP_VIEW_MODEL_HOST_SELECTOR = classAliasSelector("yt-lockup-view-model", "ytLockupViewModelHost");
export const LOCKUP_VIEW_MODEL_HORIZONTAL_SELECTOR = classAliasSelector(
	"yt-lockup-view-model--horizontal",
	"ytLockupViewModelHorizontal",
);
export const THUMBNAIL_DEFAULT_BADGE_SELECTOR = classAliasSelector(
	"yt-badge-shape--thumbnail-default",
	"ytBadgeShapeThumbnailDefault",
);
export const THUMBNAIL_LIVE_BADGE_SELECTOR = classAliasSelector(
	"yt-badge-shape--thumbnail-live",
	"ytBadgeShapeThumbnailLive",
);

export const PLAYER_SELECTOR = "#ytd-player";
export const WATCH_DETAILS_SELECTOR = "#below";
export const WATCH_SIDEBAR_SELECTOR = "#secondary";
export const TOP_LEFT_ICON_SELECTOR = "ytd-masthead ytd-topbar-logo-renderer";
export const COLOR_THEME_SELECTOR = "ytd-app";
export const FONT_SELECTOR = "ytd-watch-metadata #title h1 yt-formatted-string";
export const SCROLLBAR_SELECTOR = "ytd-app";
export const BACKGROUND_SELECTOR = "ytd-app";
export const SIDEBAR_SELECTOR = "#guide-content, ytd-mini-guide-renderer";
export const THUMBNAIL_SELECTOR = "ytd-playlist-thumbnail, yt-thumbnail-view-model";
export const SEARCH_SELECTOR = "ytd-masthead yt-searchbox, ytd-masthead ytd-searchbox";
