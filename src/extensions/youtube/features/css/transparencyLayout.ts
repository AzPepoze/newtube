export const transparencyLayoutCss = `
.sbflB,.sbsbA,
#container.style-scope.ytd-masthead,
ytd-mini-guide-renderer,
ytd-mini-guide-entry-renderer,
ytd-page-manager>*.ytd-page-manager,
#channel-container,
#channel-header,
#tabs-inner-container,
.playlist-items,
#video-preview-container,
ytd-simple-menu-header-renderer,
.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--tonal,
#description,
#player,
ytd-thumbnail-overlay-resume-playback-renderer,
yt-thumbnail-overlay-badge-view-model,
.button-container.ytd-rich-shelf-renderer,
ytd-video-preview,
ytd-button-renderer.ytd-live-chat-frame,
#player-container,
.ytp-endscreen-content,
ytd-thumbnail-overlay-time-status-renderer badge-shape,
yt-thumbnail-bottom-overlay-view-model badge-shape,
.ytSearchboxComponentInputBox,
.ytGridShelfViewModelGridShelfBottomButtonContainer
{
	background: transparent !important;
}

yt-interaction{
	overflow: visible !important;
}

#guide-inner-content{
	transform: translateZ(0px); 
}

#chips-wrapper{
	background: var(--nt-chips-bg) !important;
}

ytd-app,
.background-gradient,
ytmusic-app-layout:has(ytmusic-nav-bar[is-search-page]){
	background: transparent !important;
}

#container.ytd-searchbox input.ytd-searchbox,
.yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--text,
#reply-button-end a{
	color: var(--nt-theme-color) !important;
}

#container.ytd-searchbox,.yt-ui-ellipsis,.ytp-tooltip.ytp-preview:not(.ytp-text-detail),
#contentContainer,
.ytp-videowall-still-info-duration
{
	background-color: transparent !important;
	border-color: transparent !important;
}

ytd-playlist-sidebar-renderer,
ytd-two-column-browse-results-renderer,
ytd-alert-with-button-renderer,
.caption-window.ytp-caption-window-bottom,
.ytp-tooltip.ytp-text-detail.ytp-preview .ytp-tooltip-text
{
	background: transparent !important;
}

#mini-guide-background,
yt-contextual-sheet-layout {
	background: var(--nt-bg-main) !important;
	border-color: transparent !important;
}

ytd-action-companion-ad-renderer,
#container,
ytd-live-chat-frame
{
	border:transparent !important;
}

div.html5-video-player:not(.ytp-fullscreen),
#time-status{
	background:transparent !important;
}
`;
