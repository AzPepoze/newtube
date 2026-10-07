import { getUserSetting } from "@core/storage/manager";
import { getYoutubeVideoId, onYoutubeNavigate } from "@extensions/youtube/modules/youtube";
import { registerSettingListener } from "@settings/engine/functions";
import { createElement, ELEMENTS, getElement, hideElement, removeElement, showElement } from "./helpers";
import { type IModeHandler } from "./types";

// Shorts thumbnails are 16:9 letterboxes with baked-in black bars; use the vertical frame instead.
function getThumbnailUrl(videoId: string): string {
	const frame = window.location.pathname.startsWith("/shorts/") ? "oar2" : "maxresdefault";
	return `https://i.ytimg.com/vi/${videoId}/${frame}.jpg`;
}

class ImageBackgroundMode implements IModeHandler {
	private tintElement: HTMLElement | null = null;
	private imageElement: HTMLElement | null = null;
	private bgImage = new Image();
	private navigateCleanup: (() => void) | null = null;
	private onResize = () => this.updateSize();

	async enable(): Promise<void> {
		this.tintElement = await createElement(ELEMENTS.TINT);
		this.imageElement = await createElement(ELEMENTS.IMAGE);

		window.addEventListener("resize", this.onResize);
		this.navigateCleanup = onYoutubeNavigate(() => this.updateImage());
		this.updateImage();

		await this.show();
	}

	async disable(): Promise<void> {
		window.removeEventListener("resize", this.onResize);
		this.navigateCleanup?.();
		this.navigateCleanup = null;

		await this.hide();

		removeElement(this.tintElement);
		removeElement(this.imageElement);
		this.tintElement = null;
		this.imageElement = null;
	}

	async show(): Promise<void> {
		this.tintElement = getElement(ELEMENTS.TINT);
		this.imageElement = getElement(ELEMENTS.IMAGE);
		showElement(this.tintElement);
		showElement(this.imageElement);
	}

	async hide(): Promise<void> {
		hideElement(this.tintElement);
		hideElement(this.imageElement);
	}

	private async updateImage(): Promise<void> {
		const backgroundMode = await getUserSetting("BackgroundMode");
		if (backgroundMode === "Thumbnail") {
			const videoId = getYoutubeVideoId();
			if (videoId) {
				this.bgImage.src = getThumbnailUrl(videoId);
				return;
			}
		}
		const url = await getUserSetting("BackgroundImageUrl");
		if (url) this.bgImage.src = url;
	}

	private async updateSize(): Promise<void> {
		const el = this.imageElement || getElement(ELEMENTS.IMAGE);
		if (!el || !this.bgImage.width) return;

		const bgBound = el.getBoundingClientRect();
		if (!bgBound.width || !bgBound.height) return;

		const imageBackgroundHeight = (this.bgImage.height / this.bgImage.width) * bgBound.width;
		const zoomValue = (await getUserSetting("BackgroundImageSize")) || 100;

		el.style.backgroundSize =
			imageBackgroundHeight < bgBound.height
				? `${(bgBound.height / imageBackgroundHeight) * zoomValue}%`
				: `${zoomValue}%`;
	}

	private async updatePosition(): Promise<void> {
		const el = this.imageElement || getElement(ELEMENTS.IMAGE);
		if (!el) return;
		const x = await getUserSetting("BackgroundImagePositionX");
		const y = await getUserSetting("BackgroundImagePositionY");
		el.style.backgroundPositionX = `${x}%`;
		el.style.backgroundPositionY = `${y}%`;
	}

	registerListeners(): void {
		this.bgImage.onload = () => {
			const el = this.imageElement || getElement(ELEMENTS.IMAGE);
			if (el) el.style.backgroundImage = `url("${this.bgImage.src}")`;
			this.updateSize();
		};

		const updateImage = () => this.updateImage();
		const updateSize = () => this.updateSize();
		const updatePos = () => this.updatePosition();

		registerSettingListener("BackgroundImageUrl", updateImage, true);
		registerSettingListener("BackgroundMode", updateImage, true);
		registerSettingListener("BackgroundImageSize", updateSize, true);
		registerSettingListener("BackgroundImagePositionX", updatePos, true);
		registerSettingListener("BackgroundImagePositionY", updatePos, true);
	}
}

export const imageBackgroundMode = new ImageBackgroundMode();
imageBackgroundMode.registerListeners();
