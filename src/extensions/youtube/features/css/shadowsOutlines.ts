export const shadowsOutlinesCss = `
a.thumbnail > .ytcd-basic-item-large-image,
ytcp-thumbnail-with-title,
ytd-playlist-thumbnail,
ytd-thumbnail:not(.player-container-background-image),
yt-thumbnail-view-model,
.thumbnail-container.ytd-notification-renderer,
yt-img-shadow.ytd-channel-renderer,
#author-thumbnail.ytd-commesimplebox-renderer,
.style-scope.ytd-commerenderer.no-transition,
div.html5-video-player:not(.ytp-fullscreen) .html5-video-container,
.ytp-preview:not(.ytp-text-detail) span.ytp-tooltip-text-no-title,
ytd-thumbnail-overlay-side-panel-renderer,
ytd-thumbnail-overlay-bottom-panel-renderer,
yt-thumbnail-bottom-overlay-view-model,
.ytp-popup.ytp-settings-menu,
.iv-drawer,
.ytp-cards-teaser-box,
.miniplayer.ytd-miniplayer,
.ytp-flyout-cta .ytp-flyout-cta-body,
#ytp-ad-image,
.ytp-ad-preview-container,
.ytp-ad-message-container,
.ytp-ad-skip-button.ytp-button,
#banner > img,
#icon > img,
#action,
.ytp-show-tiles .ytp-videowall-still,
#tabs-container,
yt-confirm-dialog-renderer[dialog],
.ytp-ce-element.ytp-ce-elemeshow,
#contentWrapper.tp-yt-iron-dropdown > *,
.ytp-tooltip-bg,
.skeleton-bg-color.ytd-ghost-grid-renderer
{
	border-collapse: separate;
	box-shadow: var(--nt-global-shadow);
	border: var(--nt-global-outline);
}

#container {
	position: relative !important;
}

.ytp-popup.ytp-settings-menu,
#NEWTUBEBG,
.NEWTUBEMAIN
{
	border-collapse: separate;
	box-shadow: var(--nt-global-shadow);
	border: var(--nt-global-outline);
}

ytd-compact-playlist-renderer:hover>div>ytd-playlist-thumbnail,
ytd-compact-video-renderer:hover>div>ytd-thumbnail,
ytd-compact-radio-renderer:hover>div>ytd-thumbnail,
ytd-thumbnail.ytd-rich-grid-media:hover,
yt-lockup-view-model:hover yt-thumbnail-view-model
{   
	outline: solid;
	outline-color: var(--nt-hover-color) !important;
	outline-width: var(--nt-hover-border-width) !important;
}

ytd-thumbnail.ytd-rich-grid-media:active
{   
	box-shadow: var(--nt-border-minus) 0 var(--nt-click-color), 0 var(--nt-border-width) var(--nt-click-color), var(--nt-border-width) 0 var(--nt-click-color), 0 var(--nt-border-minus) var(--nt-click-color) !important;
}

ytd-compact-playlist-renderer:active>div>ytd-playlist-thumbnail,
ytd-compact-video-renderer:active>div>ytd-thumbnail,
ytd-compact-radio-renderer:active>div>ytd-thumbnail
{
	outline: var(--nt-border-width) solid var(--nt-click-color) !important;
}
`;
