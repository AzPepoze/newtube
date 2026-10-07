import type { PageMode } from "./types";

/**
 * Curated layout targets that layout-specific bug reports tend to depend on.
 * Counts are enough to tell which containers exist without collecting page content.
 */
export const YOUTUBE_DIAGNOSTIC_SELECTORS = [
	"ytd-app",
	"ytd-watch-flexy",
	"ytd-watch-flexy[theater]",
	"ytd-watch-flexy[fullscreen]",
	"ytd-watch-flexy[full-bleed-player]",
	"ytd-watch-flexy[flexy]",
	"ytd-watch-flexy[is-two-columns_]",
	"#movie_player",
	"#movie_player.ytp-fullscreen",
	"#player-container",
	"#player-controls",
	"ytd-player",
	"#below",
	"#primary",
	"#secondary",
	"#columns",
	"#full-bleed-container",
	"#masthead-container",
	"ytd-mini-guide-renderer",
	"ytd-guide-renderer",
	"#guide",
	"#chips-wrapper",
	"ytd-comments",
	"#related",
	"#owner",
	"#title.ytd-watch-metadata",
	"ytd-reel-video-renderer",
	"ytd-shorts",
	"#shorts-container",
	"ytd-video-renderer",
	"ytd-rich-grid-renderer",
	"ytd-two-column-browse-results-renderer",
] as const;

export function detectPageMode(pathname: string, host = ""): PageMode {
	if (host.startsWith("music.")) return "music";
	if (pathname.startsWith("/watch")) return "watch";
	if (pathname.startsWith("/shorts")) return "shorts";
	if (pathname.startsWith("/playlist")) return "playlist";
	if (pathname.startsWith("/results")) return "search";
	if (
		pathname.startsWith("/channel") ||
		pathname.startsWith("/c/") ||
		pathname.startsWith("/user/") ||
		pathname.startsWith("/@")
	) {
		return "channel";
	}
	if (pathname === "/" || pathname.startsWith("/feed")) return "browse";
	return "other";
}

export function countSelectors(root: ParentNode, selectors: readonly string[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const selector of selectors) {
		try {
			counts[selector] = root.querySelectorAll(selector).length;
		} catch {
			counts[selector] = -1;
		}
	}
	return counts;
}
