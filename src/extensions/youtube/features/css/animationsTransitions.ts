export const animationsTransitionsCss = `
ytd-menu-renderer .ytd-menu-renderer[style-target=button] yt-icon{
	transition: background 0.2s, transform 0.1s;
}

ytd-menu-renderer .ytd-menu-renderer[style-target=button]:hover yt-icon{
	background: var(--nt-theme-accent);
	transform: scale(1.3);
}

[role="listbox"] > div:hover{
	transition: all 0.1s;
}

tp-yt-paper-button.ytd-expander,
tp-yt-paper-button.ytd-text-inline-expander,
.yt-spec-button-shape-next--outline,
#reply-button-end button,
#reply-button-end a,
.yt-spec-button-shape-next--filled,
.yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--text,
.ytSearchboxComponentSearchButton
{
	transition: all 0.1s;
}

ytd-live-chat-frame,
.yt-simple-endpoint.ytd-playlist-panel-video-renderer,
ytd-guide-entry-renderer,
ytd-playlist-thumbnail,
ytd-thumbnail,
yt-thumbnail-view-model,

ytd-compact-playlist-renderer,
ytd-compact-video-renderer,
ytd-compact-radio-renderer,

ytd-compact-playlist-renderer>div>div>div>a,
ytd-compact-video-renderer>div>div>div>a,
ytd-compact-radio-renderer>div>div>div>a,
ytd-thumbnail.ytd-rich-grid-media,
ytd-thumbnail.ytd-rich-grid-media>a,
yt-lockup-view-model yt-thumbnail-view-model,
#button.ytd-menu-renderer.yt-icon.ytd-menu-renderer,
ytd-playlist-video-renderer,
ytd-video-renderer,
yt-lockup-view-model,
yt-multi-page-menu-section-renderer #items > *,
ytd-notification-renderer,
ytd-macro-markers-list-item-renderer,
yt-list-item-view-model > div
{
	transition: all .2s;
}

.ytp-menuitem:not([aria-disabled=true]):hover,
#endpoint.yt-simple-endpoint.ytd-guide-entry-renderer {
	transition: all .2s cubic-bezier(0.1,0.7,1,1);
}

.ytp-chrome-top,
.ytp-chrome-bottom,
.ytp-gradient-bottom,
.ytp-button:not([aria-disabled=true]):not([disabled]):not([aria-hidden=true]) > svg > path,
ytd-playlist-panel-video-renderer,
ytd-menu-renderer,
ytd-menu-service-item-renderer tp-yt-paper-item,
yt-live-chat-text-message-renderer
{
	transition: all .2s;
}

.ytp-button,
.ytp-cards-button-icon
{
	transition: all .2s;
}

.ytp-tooltip-text-wrapper{
	transition: margin-block .5s;
}

#show-more-button
{
	transition: background .2s;
}

ytd-app{
	transition: background 1s;
}

.iv-branding .ytp-button:hover{
	transform: scale(1.1) !important;
}

ytd-compact-radio-renderer > #dismissible > ytd-thumbnail > a > yt-img-shadow > img,
ytd-playlist-thumbnail > a > #playlist-thumbnails > ytd-playlist-video-thumbnail-renderer > yt-img-shadow > img,
ytd-playlist-thumbnail > a > div > ytd-playlist-custom-thumbnail-renderer > yt-img-shadow > img,
.thumbnail-overlay.ytmusic-player-queue-item
{
	transition: all .2s ;
}

.sbsbI{
	transition:all 0.2s;
}

ytd-player:has(div.html5-video-player:not(.ytp-fullscreen)){
	transition: all 1s;
}

yt-button-shape button{
	transition: all 0.2s ease-out;
}

#text.ytd-channel-name{
	transition: all 0.2s;
}

.html5-video-player .ytp-settings-menu:not(.ytpa-ambientlight-settings-menu){
	transition: opacity 0.5s,transform 0.25s !important;
}

ytmusic-player-queue-item{
	transition: margin .2s ;
}

@keyframes show-box {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

tp-yt-iron-dropdown {
	transition:  transform .4s,opacity .4s;
}

tp-yt-iron-dropdown:not([aria-hidden="true"]) {
	animation: show-box .4s;
}
`;
