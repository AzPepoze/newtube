export const borderRadiusCss = `
ytd-playlist-panel-video-renderer,
ytd-menu-renderer yt-icon {
	border-radius: var(--nt-border-radius);
}

ytd-video-preview .html5-video-container,
yt-list-item-view-model > div
{
	border-radius: var(--nt-border-radius) !important;
}

ytd-multi-page-menu-renderer,
ytd-player:not(.ytd-video-preview):not(.ytp-player-minimized) .html5-video-player:not(.ytp-fullscreen) .html5-video-container,
.ytp-offline-slate-background,
.ytp-storyboard-framepreview,
.ytp-storyboard-framepreview-img,
.videowall-endscreen {
	border-radius: var(--nt-player-radius) !important;
}

ytcp-thumbnail-with-title,
ytd-playlist-thumbnail,
ytd-thumbnail,
yt-thumbnail-view-model,
.thumbnail-container.ytd-notification-renderer,
[role="listbox"],
.ytp-ce-video,
.ytp-ce-playlist,
[aria-live="polite"],
.ytp-tooltip-bg,
.ytp-tooltip-text.ytp-tooltip-text-no-title,
.branding-img.iv-click-target,
.branding-context-container-inner,
ytd-thumbnail-overlay-bottom-panel-renderer,
yt-thumbnail-bottom-overlay-view-model,
.ytp-progress-list,
.ytp-play-progress.ytp-swatch-background-color,
.ytp-load-progress,
.ytp-hover-progress.ytp-hover-progress-light,
.style-scope.ytd-subscribeButton-renderer,
#container.ytd-playlist-panel-renderer,
.header.ytd-playlist-panel-renderer,
ytd-live-chat-frame,
.ytp-ce-playlist-count,
.ytp-ce-expanding-overlay-background,
.ytp-popup.ytp-settings-menu,
.ytp-sb-subscribe, .ytp-sb-unsubscribe,
.iv-drawer,
.iv-card,
.iv-card a.iv-click-target,
.ytp-cards-teaser-box,
.miniplayer.ytd-miniplayer,
.ytp-popup,
.badge.ytd-badge-supported-renderer,
.ytp-ce-website .ytp-ce-expanding-image,
.ytp-ce-merchandise .ytp-ce-expanding-image
{
	border-radius: var(--nt-border-radius) !important;
}

.ytp-gradient-bottom
{
	border-radius: var(--nt-border-radius) var(--nt-border-radius) 0px 0px !important;
}

#background.ytd-masthead
{
	border-radius: 0px 0px var(--nt-border-radius) var(--nt-border-radius) !important;
}

.ytp-swatch-color,
a.ytp-ce-link,
yt-multi-page-menu-section-renderer #items > * yt-icon-shape,
yt-icon.ytd-toggle-theme-compact-link-renderer {
	border-radius: var(--nt-border-radius) !important;
}

ytd-thumbnail-overlay-time-status-renderer,
ytd-thumbnail-overlay-bottom-panel-renderer,
yt-thumbnail-bottom-overlay-view-model,
ytd-thumbnail-overlay-side-panel-renderer,
ytd-thumbnail-overlay-toggle-button-renderer,
.iv-branding-active .branding-context-container-inner,
.ytp-ce-video-duration
{
	border-radius: var(--nt-timestamp-radius) !important;
	background-color: var(--nt-timestamp-bg) !important;
}

.sbsbI{
	border-radius: var(--nt-border-radius);
}

.ytp-gradient-bottom
{
	border-radius: var(--nt-player-radius) !important;
}

#NewtubeVDOCanvas,
.song-media-controls{
	border-radius: var(--nt-player-radius) !important;
}

div.html5-video-player.ytp-fullscreen .ytp-gradient-bottom{
	border-radius: var(--nt-player-radius) var(--nt-player-radius) 0px 0px !important;
}

div.ytp-cued-thumbnail-overlay{
	border-radius: 10px !important;
}

yt-live-chat-message-input-renderer{
	border-radius: 10px;
}
`;
