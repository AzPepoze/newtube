export const uiCleanupCss = `
html:not(.style-scope)[system-icons]:not(.style-scope)
{
	background: black !important;
}

body {
	overflow: auto;
}

.ytp-contextmenu .ytp-menuitem {
	display: flex !important;
	align-items: center;
	flex-direction: row;
}

.ytSearchboxComponentInputBox::placeholder {
	color: var(--nt-text-secondary) !important;
}

.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--outline,
.ytSearchboxComponentSuggestionsContainer {
	background: var(--nt-topbar-bg);
}

ytd-text-inline-expander yt-attributed-string a{
	color: var(--nt-text-link) !important;
}

.ytp-ad-module {
	width: 0px !important;
}

.ytp-chapters-container{
	flex-wrap: nowrap;
	display: flex;
}

html[watch-color-update]
{
	--yt-spec-general-background-a: transparent !important;
	background: transparent !important;
}

ytd-thumbnail-overlay-time-status-renderer,
ytd-thumbnail-overlay-bottom-panel-renderer,
yt-thumbnail-bottom-overlay-view-model
{
	height: var(--nt-timestamp-height) !important;
}

#hearted-border.ytd-creator-heart-renderer
{
	opacity:0 !important;
}

.ytp-svg-shadow
{
	stroke: #0000 !important;
}

.gstl50.sbddA
{
	top:56px !important;
}

html:not(.style-scope)[watch-color-update] {
	--yt-live-chat-background-color: transparent;
	--yt-live-chat-header-background-color: var(--yt-spec-brand-background-primary);
}

ytd-tabbed-page-header,
yt-page-header-view-model{
	--yt-lightsource-section1-color: transparent !important;
}

.ytp-preview .ytp-tooltip-text-no-title,
.ytd-thumbnail-overlay-bottom-panel-renderer,
yt-thumbnail-bottom-overlay-view-model,
ytd-thumbnail-overlay-time-status-renderer *,
yt-thumbnail-bottom-overlay-view-model *{
	color: var(--nt-text-timestamp) !important;
}

tp-yt-paper-button.ytd-expander span,
.yt-spec-button-shape-next--outline,
tp-yt-paper-button.ytd-text-inline-expander,
.yt-spec-button-shape-next--filled,
#reply-button-end button,
.ytp-tooltip-text{
	color: var(--nt-text-primary) !important;
}

.ytd-comment-renderer:hover,
ytd-comment-view-model:hover{
	text-decoration: none !important;
}

[role="listbox"] > div:hover{
	background: var(--nt-theme-transparent) !important;
	border-color: transparent !important;
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
	border: 1px solid transparent !important;
}

tp-yt-paper-button.ytd-expander,
tp-yt-paper-button.ytd-text-inline-expander{
	padding-inline: 10px !important;
}

#text-container.yt-notification-action-renderer{
	border: 1px solid var(--nt-theme-transparent);
}

tp-yt-paper-button.ytd-expander:hover,
tp-yt-paper-button.ytd-text-inline-expander:hover,
.yt-spec-button-shape-next--outline:hover,
#reply-button-end button:hover,
#reply-button-end a:hover,
.yt-spec-button-shape-next--filled:hover,
.yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--text:hover{
	border-color: var(--nt-theme-color) !important;
}

.watch-skeleton .skeleton-bg-color,
ytd-author-comment-badge-renderer,
.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--filled,
.yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--filled,
.masthead-skeleton-icon,
tp-yt-paper-button.ytd-expander,
tp-yt-paper-button.ytd-text-inline-expander,
.yt-spec-button-shape-next--outline,
#reply-button-end button,
#reply-button-end a:hover,
.yt-spec-button-shape-next--filled,
.yt-spec-button-shape-next--call-to-action.yt-spec-button-shape-next--text:hover{
	background: var(--nt-theme-transparent) !important;
}

ytd-playlist-panel-video-renderer:hover {
	background-color: var(--nt-playlist-hover-bg) !important;
}

span.ytp-tooltip-text-no-title{
	color: var(--yt-spec-static-brand-white) !important;
	background: var(--nt-timestamp-bg) !important;
}

html
{
	background:black !important;
}

#NewtubeBlurBG{
	transition: opacity 2s , margin-top 0.1s , margin-left 0.1s;
}

#NewtubeVDOCanvas{
	transition: margin-top 0.1s , margin-left 0.1s;
}

html:has(div.html5-video-player.ytp-fullscreen) #NewtubeBlurBG,
ytmusic-app #background {
	display: none;
}

.ytp-preview:not(.ytp-text-detail) span.ytp-tooltip-text-no-title,
.ytd-thumbnail-overlay-loading-preview-renderer,
ytd-thumbnail-overlay-inline-unplayable-renderer
{
	background-color: var(--nt-timestamp-bg) !important;
}

.ytp-preview:not(.ytp-text-detail) span.ytp-tooltip-text-no-title
{
	display: block !important;
}

tp-yt-paper-button.ytd-subscribeButton-renderer[subscribed]{
	border-bottom: var(--nt-theme-transparent) !important;
}

.ytp-ce-expanding-overlay-background,
.ytp-ce-playlist-count
{
	background: var(--nt-endscreen-bg) !important;
}

#scrim,
tp-yt-iron-overlay-backdrop,
#tabs-container
{
	background: var(--nt-topbar-bg) !important;
}

ytd-thumbnail-overlay-hover-text-renderer
{
	background-color: var(--nt-topbar-bg) !important;
}

#video-preview-container
{
	box-shadow: 0px 0px 0px 0px !important;
}

.ytp-ce-channel-metadata,
.ytp-cards-teaser .ytp-cards-teaser-text,
.ytp-panel-menu,
.ytp-ce-website-title, .ytp-ce-merchandise-title,
#time.ytd-macro-markers-list-item-renderer,
.yt-core-attributed-string--link-inherit-color
{
	color: var(--nt-text-primary) !important;
}

ytd-engagement-panel-section-list-renderer
{
	overflow:hidden;
}

.ytp-popup.ytp-settings-menu,
.ytp-gradient-bottom,
.iv-drawer,
.ytp-cards-teaser-box,
.ytp-popup
{
	background-color: var(--nt-player-bg) !important;
}

.iv-branding{
	z-index: 60 !important;
}

.ytp-progress-list,
.YtProgressBarLineProgressBarBackground
{
	background: var(--nt-timeline-bg) !important;
}

.ytp-load-progress,
.YtProgressBarLineProgressBarLoaded
{
	background: var(--nt-timeline-load) !important;
}

#tooltip.tp-yt-paper-tooltip
{
	background-color: var(--nt-bg-main) !important;
	color: var(--nt-text-primary) !important;
}

.sbqsC:before {
	background: transparent !important;
	width: 0px !important;
}

yt-searchbox:has([class*="Focus"]) [role="listbox"]{
	left: 0px;
	opacity: 1;
	pointer-events: all;
}

.ytp-chapter-title-prefix {
	display: none;
}

.ytp-chapter-title-content {
	margin-left: 10px;
}

.sbsbI{
	background: black;
	padding: 5px 10px;
	outline: solid white 1px;
	color: white !important;
}

.sbsbI:hover{
	background: white !important;
	color: black !important;
}

.sbse:not(.sbpqsD) .sbpqsA{
	color: var(--nt-text-secondary) !important;
}
	
.sbpqsA:before{
	filter: invert(0.5);
}

ytd-thumbnail-overlay-time-status-renderer,
yt-thumbnail-bottom-overlay-view-model{
	display: flex !important;
}

.ytp-offline-slate > button{
	display:none;
}

ytd-app > #content{
	overflow-x: hidden;
}

#text.ytd-channel-name{
	background: transparent;
}

ytd-video-owner-renderer #text.ytd-channel-name:hover,
ytd-video-meta-block #text.ytd-channel-name:hover {
	background: var(--nt-theme-transparent);
}
	
ytd-video-meta-block #text.ytd-channel-name:not(.complex-string):hover,
ytd-video-owner-renderer #text.ytd-channel-name:not(.complex-string):hover {
		padding-inline: 10px;
}

.ytp-settings-menu .ytp-menuitem-content,
#thumbnail-container.ytd-playlist-panel-video-renderer{
	overflow: visible !important;
}

.html5-video-player .ytp-settings-menu:not(.ytpa-ambientlight-settings-menu){
	margin-bottom: 20px !important;
}

.html5-video-player:not(.ytp-settings-shown) .ytp-settings-menu:not(.ytpa-ambientlight-settings-menu){
	pointer-events: none !important;
	opacity:0 !important;
	transform: translateX(100px) !important;
}

#below {
	margin-top: var(--nt-video-bottom-space);
}

.playlist-items.ytd-playlist-panel-renderer{
	transform: translateZ(0);
}

html > body{
	display: initial;
	overflow-x: hidden;
}

body > ytd-player{
	opacity:0;
}

.left-items.ytmusic-player-queue-item{
	transform: scale(1.5);
}

ytmusic-player-queue-item img{
	object-fit: cover !important;
}

ytmusic-player-queue-item{
	padding-inline: 20px !important;
}

yt-dynamic-text-view-model{
	text-align: center;
}

tp-yt-iron-dropdown {
	display: flex !important;
}

tp-yt-iron-dropdown[aria-hidden="true"]{
	pointer-events: none;
	opacity: 0 !important;
	transform: scale(0.9) !important;
}

.no-scroll #page-manager{
	margin-top:0px !important;
}

#watch-while-engagement-panel.ytd-reel-video-renderer{
	width: 100%;
}

html.ytdl-is-fullscreen ytd-app{
	backface-visibility: hidden;
}

#text.ytd-channel-name{
	color: var(--nt-text-channel);
}

yt-chip-cloud-chip-renderer[aria-selected="true"] yt-formatted-string {
	color: var(--nt-bg-main);
	font-weight: 900;
}
`;
