export const accentIntegrationCss = `
.ytp-menuitem-icon path:not([fill="none"]),
.ytd-thumbnail-overlay-hover-text-renderer path,
.ytd-thumbnail-overlay-bottom-panel-renderer path,
yt-thumbnail-bottom-overlay-view-model path,
.ytSearchboxComponentInnerSearchIcon path,
svg path[fill="#FF0000"],
svg [fill="#FF0000"],
svg [fill="#FF0033"],
svg [fill="red"],
svg [fill="#F00"],
path:not([fill="none"]),
[role="option"]:not(.yt-third-party-share-target-section-renderer) path,
.ytp-heat-map-graph,
.guide-icon svg,
#spinnerContainer *
{
	fill: var(--nt-theme-color) !important;
}

#items > #contents > * .yt-formatted-string,
paper-ripple,
ytd-channel-name a,
.style-scope.ytd-menu-renderer.force-icon-button.style-default-active,
.badge-style-type-live-now.ytd-badge-supported-renderer, .badge-style-type-starting-soon.ytd-badge-supported-renderer
{   
	border-color : var(--nt-theme-color) !important;
	color: var(--nt-theme-color) !important;
}

.badge-style-type-live-now-alternate.ytd-badge-supported-renderer,
.badge-style-type-verified svg,
ytd-toggle-button-renderer yt-icon,
.ytSearchboxComponentInput,
[role="listbox"] > div,
[role="search"],
yt-icon.ytd-compact-link-renderer,
.ytAttributedStringLinkCallToActionColor {
	color: var(--nt-theme-color) !important;
}

paper-ripple,
.ytp-swatch-color,
a.ytp-ce-link,
yt-multi-page-menu-section-renderer #items > * yt-icon-shape,
yt-icon.ytd-toggle-theme-compact-link-renderer,
.ytd-ticket-shelf-renderer a {
	color: var(--nt-theme-color) !important;
}

.ytp-swatch-background-color,
.YtProgressBarLineProgressBarPlayed,
.YtProgressBarPlayheadProgressBarPlayheadDot,
.ytp-chrome-controls .ytp-button[aria-pressed]:after,
.ytp-sb-subscribe, a.ytp-sb-subscribe,
yt-icon-button.yt-live-chat-item-list-renderer,
#progress.yt-page-navigation-progress,
.ytProgressBarPlayheadProgressBarPlayheadDot {
	background: var(--nt-theme-color) !important;
}

.ytp-settings-button:after {
	background-color: var(--nt-theme-color) !important;
}

*::selection,
.ytp-menuitem[aria-checked=true] .ytp-menuitem-toggle-checkbox
{
	background: var(--nt-theme-color) !important;
	color: var(--nt-text-primary) !important;
}

tp-yt-paper-slider{
	--paper-progress-active-color: var(--nt-theme-color) !important;
}

.ytp-spinner-circle{
	border-color: var(--nt-theme-color) var(--nt-theme-color) transparent !important;
}

path[stroke="rgb(255,255,255)"]
{
	stroke: var(--nt-theme-color) !important;
}

yt-list-item-view-model > div:hover,
.ytThumbnailHoverOverlayViewModelStyleCover,
.skeleton-bg-color.ytd-ghost-grid-renderer,
#content-wrapper.ytd-feed-nudge-renderer {
	background: var(--nt-theme-transparent) !important;
}

#progress.ytd-thumbnail-overlay-resume-playback-renderer,
#progress.yt-thumbnail-overlay-badge-view-model,
.ytProgressBarLineProgressBarPlayed {
	background: linear-gradient(-70deg, var(--nt-theme-color), var(--nt-theme-transparent) ) !important;
}

ytmusic-player-queue-item[play-button-state=playing],
ytmusic-player-queue-item[play-button-state=paused]{
	background: linear-gradient(70deg, var(--nt-theme-transparent) , transparent ) !important;
}

ytd-notification-topbar-button-renderer .yt-spec-icon-badge-shape__badge{
	background: var(--nt-theme-accent) !important;
	color: var(--nt-theme-color) !important;
}

yt-chip-cloud-chip-renderer[selected] #chip-container {
	background: var(--nt-theme-color) !important;
}

.sbpqsD .sbpqsA{
	color: var(--nt-theme-color) !important;
}

ytd-author-comment-badge-renderer,
yt-dynamic-text-view-model{
	background: var(--nt-theme-accent) !important;
}

.ytSpecButtonShapeNextCallToAction.ytSpecButtonShapeNextOutline{
	color: var(--nt-theme-color) !important;
}
`;
