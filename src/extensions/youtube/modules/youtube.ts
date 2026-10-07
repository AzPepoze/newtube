import { logger } from "@/shared/logger";
import { waitForElement } from "@core/shared/domHelpers";

export let ytdApp: HTMLElement | null = null;
export let videoElement: HTMLVideoElement | null = null;
export let playerElement: HTMLElement | null = null;
export let isYoutubeFullscreen = false;
export let isYoutubeSmallMode = false;
export let isYoutubeVideoPage = !!new URLSearchParams(window.location.search).get("v");

export type YoutubeVideoInfo = {
	element: HTMLVideoElement;
	width: number;
	height: number;
	aspectRatio: number | null;
	isSixteenByNine: boolean;
};

let playerObserver: MutationObserver | null = null;

const navigateListeners: (() => void)[] = [];
const fullscreenListeners: ((isFullscreen: boolean) => void)[] = [];
const smallModeListeners: ((isSmallMode: boolean) => void)[] = [];

export const playerWatchModeSelector =
	"#movie_player.html5-video-player:not(.ytp-fullscreen):not(.ytp-small-mode):not(.ytp-embed)";
export const ytVideoContainerWatchMode = playerWatchModeSelector;
export const ytPlayerWatchMode = `#player:has(${playerWatchModeSelector})`;
export const ytdPlayerWatchMode = `ytd-watch-flexy ytd-player:has(${playerWatchModeSelector})`;
export const ytTheaterModeContainer = `ytd-watch-flexy[theater] #full-bleed-container`;

/**
 * Retrieves the main YouTube app element (ytd-app).
 */
export async function getYtdApp() {
	if (!ytdApp) {
		ytdApp = await waitForElement("ytd-app");
		if (ytdApp) logger.info("youtube", "Found ytd-app");
	}

	return ytdApp;
}

function isMainVideo(video: HTMLVideoElement): boolean {
	if (!video.isConnected || !isYoutubeVideoPage) return false;

	const player = video.closest("ytd-player, .html5-video-player");
	if (!player || player.id !== "movie_player") return false;

	const context = player.getAttribute("context") || "";
	const className = player.className || "";

	if (context.includes("TRAILER") || context.includes("PREVIEW")) return false;
	if (className.includes("ytp-embed")) return false;

	// On watch pages, the main video must be in the primary section
	if (window.location.pathname === "/watch" && !video.closest("#primary")) return false;

	// Ensure the video is actually playable/loaded
	if (isNaN(video.duration) && video.readyState < 1) return false;

	return typeof video.requestPictureInPicture === "function";
}

/**
 * Retrieves the main YouTube video element.
 * Excludes mini-players, trailers, and previews to ensure only the main content is captured.
 */
export async function getVideoElement(): Promise<HTMLVideoElement | null> {
	if (videoElement?.isConnected) return videoElement;

	const allVideos = Array.from(document.querySelectorAll("video"));
	const candidates = allVideos.filter(isMainVideo);

	// Prefer the movie_player if available
	videoElement =
		(document.querySelector("#movie_player video") as HTMLVideoElement) ||
		candidates.find((v) => v.closest("#movie_player")) ||
		candidates[0] ||
		null;

	if (videoElement) {
		logger.info("youtube", "Found/Updated main video element");
	}

	return videoElement;
}

/**
 * Retrieves the main YouTube player element (#movie_player or .html5-video-player).
 */
export async function getPlayerElement(): Promise<HTMLElement | null> {
	if (!playerElement || !playerElement.isConnected) {
		playerElement = (document.getElementById("movie_player") ||
			document.querySelector(".html5-video-player")) as HTMLElement;
		if (playerElement) logger.info("youtube", "Found/Updated player element");
	}
	return playerElement;
}

/**
 * Retrieves the YouTube player container element.
 */
export function getPlayerContainer(): HTMLElement | null {
	return document.querySelector(".html5-video-container") as HTMLElement;
}

/**
 * Creates a reusable snapshot of the current video's intrinsic metadata.
 * Addons should use this instead of measuring the styled player box.
 */
export function getYoutubeVideoInfo(video: HTMLVideoElement | null = videoElement): YoutubeVideoInfo | null {
	if (!video?.isConnected) return null;

	const width = video.videoWidth;
	const height = video.videoHeight;
	const aspectRatio = width > 0 && height > 0 ? width / height : null;

	return {
		element: video,
		width,
		height,
		aspectRatio,
		isSixteenByNine: aspectRatio !== null && Math.abs(aspectRatio - 16 / 9) <= 0.02,
	};
}

/**
 * Observes the current video's element and intrinsic metadata. The callback
 * runs when YouTube swaps videos, metadata becomes available, or dimensions
 * change. Returns a cleanup function.
 */
export function onYoutubeVideo(callback: (info: YoutubeVideoInfo) => void): () => void {
	let observedVideo: HTMLVideoElement | null = null;
	let videoCleanup: (() => void) | null = null;
	let stopped = false;

	const bind = async () => {
		videoCleanup?.();
		videoCleanup = null;

		const video = await getVideoElement();
		if (stopped || !video) return;

		observedVideo = video;
		const notify = () => {
			const info = getYoutubeVideoInfo(video);
			if (info) callback(info);
		};
		const events = ["loadedmetadata", "durationchange", "resize"] as const;

		events.forEach((event) => video.addEventListener(event, notify));
		notify();

		videoCleanup = () => {
			events.forEach((event) => video.removeEventListener(event, notify));
			if (observedVideo === video) observedVideo = null;
		};
	};

	const navigateCleanup = onYoutubeNavigate(() => {
		void bind();
		setTimeout(() => void bind(), 500);
	});
	void bind();

	return () => {
		stopped = true;
		navigateCleanup();
		videoCleanup?.();
		videoCleanup = null;
		observedVideo = null;
	};
}

/**
 * Retrieves the current YouTube video ID from the URL.
 */
export function getYoutubeVideoId() {
	const url = new URL(window.location.href);
	const videoId = url.searchParams.get("v");
	if (videoId) return videoId;

	// Check for shorts
	if (url.pathname.startsWith("/shorts/")) {
		const parts = url.pathname.split("/");
		return parts[2] || null;
	}

	return null;
}

/**
 * Registers a callback to be executed when a YouTube navigation event finishes.
 * @param callback The function to execute.
 * @returns A cleanup function to unregister the callback.
 */
export function onYoutubeNavigate(callback: () => void) {
	navigateListeners.push(callback);
	return () => {
		const index = navigateListeners.indexOf(callback);
		if (index > -1) {
			navigateListeners.splice(index, 1);
		}
	};
}

/**
 * Registers a callback to be executed when the YouTube player enters or exits fullscreen.
 * @param callback The function to execute, receives a boolean indicating fullscreen state.
 * @returns A cleanup function to unregister the callback.
 */
export function onYoutubeFullscreen(callback: (isFullscreen: boolean) => void) {
	fullscreenListeners.push(callback);
	return () => {
		const index = fullscreenListeners.indexOf(callback);
		if (index > -1) {
			fullscreenListeners.splice(index, 1);
		}
	};
}

/**
 * Registers a callback to be executed when the YouTube player enters or exits small mode (mini-player).
 * @param callback The function to execute, receives a boolean indicating small mode state.
 * @returns A cleanup function to unregister the callback.
 */
export function onYoutubeSmallMode(callback: (isSmallMode: boolean) => void) {
	smallModeListeners.push(callback);
	return () => {
		const index = smallModeListeners.indexOf(callback);
		if (index > -1) {
			smallModeListeners.splice(index, 1);
		}
	};
}

// Global listener for YouTube navigation
window.addEventListener("yt-navigate-finish", () => {
	const videoId = getYoutubeVideoId();
	logger.info("youtube", `Navigation finished: ${videoId || "Not a video page"}`);

	isYoutubeVideoPage = !!videoId;
	videoElement = null;
	playerElement = null;

	notifyListeners(navigateListeners, undefined, "navigate");
	setupPlayerObserver();
});

function notifyListeners<T>(listeners: ((value: T) => void)[], value: T, label: string) {
	listeners.forEach((callback) => {
		try {
			callback(value);
		} catch (error) {
			logger.error("youtube", `Error in YouTube ${label} listener:`, error);
		}
	});
}

async function setupPlayerObserver() {
	if (playerObserver) {
		playerObserver.disconnect();
	}

	const player = await getPlayerElement();
	if (!player) {
		logger.warn("youtube", "Could not find player element for player observer");
		return;
	}

	logger.info("youtube", "Setting up player observer on:", player);

	const checkPlayerState = () => {
		const fullscreen = player.classList.contains("ytp-fullscreen");
		const smallMode =
			Array.from(player.classList).some((cls) => cls.includes("small")) ||
			player.classList.contains("ytp-player-minimized");

		if (fullscreen !== isYoutubeFullscreen) {
			isYoutubeFullscreen = fullscreen;
			logger.info("youtube", `Fullscreen state changed: ${isYoutubeFullscreen}`);
			notifyListeners(fullscreenListeners, isYoutubeFullscreen, "fullscreen");
		}

		if (smallMode !== isYoutubeSmallMode) {
			isYoutubeSmallMode = smallMode;
			logger.info("youtube", `Small mode state changed: ${isYoutubeSmallMode}`);
			notifyListeners(smallModeListeners, isYoutubeSmallMode, "small mode");
		}
	};

	playerObserver = new MutationObserver(checkPlayerState);
	playerObserver.observe(player, { attributes: true, attributeFilter: ["class"] });

	checkPlayerState();
}

// Initial setup
setupPlayerObserver();
