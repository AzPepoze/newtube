import { getFromStorage } from "@core/storage/manager";
import { registerSettingListener } from "@settings/engine/functions";
import { getVideoElement, onYoutubeNavigate } from "../../modules/youtube";
import {
	calculateChapterProgress,
	calculateProgressRatio,
	formatElapsedTime,
	type BufferedRange,
	type ChapterSegment,
} from "./calculations";

const VIDEO_EVENTS = [
	"timeupdate",
	"seeking",
	"seeked",
	"loadedmetadata",
	"durationchange",
	"progress",
	"waiting",
	"canplay",
	"emptied",
] as const;

let initialized = false;
let active = false;
let boundVideo: HTMLVideoElement | null = null;
let playerObserver: MutationObserver | null = null;
let observedPlayer: Element | null = null;
let reconcileVersion = 0;
let rebindQueued = false;

function readBufferedRanges(video: HTMLVideoElement): BufferedRange[] {
	const ranges: BufferedRange[] = [];

	try {
		for (let index = 0; index < video.buffered.length; index++) {
			ranges.push({ start: video.buffered.start(index), end: video.buffered.end(index) });
		}
	} catch {
		return [];
	}

	return ranges;
}

function isLiveVideo(video: HTMLVideoElement): boolean {
	return !Number.isFinite(video.duration);
}

function updateControls(): void {
	const video = boundVideo;
	if (!active || !video?.isConnected) return;

	const player = video.closest("#movie_player");
	if (!player || isLiveVideo(video)) return;

	const timeElement = player.querySelector<HTMLElement>(".ytp-time-current");
	if (timeElement) timeElement.textContent = formatElapsedTime(video.currentTime);

	const chapterContainer = player.querySelector<HTMLElement>(".ytp-chapters-container");
	if (!chapterContainer) return;

	const containerRect = chapterContainer.getBoundingClientRect();
	const scrubber = player.querySelector<HTMLElement>(".ytp-scrubber-container");
	if (scrubber) {
		const playedPosition = calculateProgressRatio(video.currentTime, video.duration) * containerRect.width;
		scrubber.style.transform = `translateX(${playedPosition}px)`;
	}

	const chapterElements = Array.from(chapterContainer.children).filter(
		(element): element is HTMLElement => element instanceof HTMLElement,
	);
	const chapters: ChapterSegment[] = chapterElements.map((chapter) => {
		const rect = chapter.getBoundingClientRect();
		return { start: rect.left - containerRect.left, width: rect.width };
	});
	const progress = calculateChapterProgress({
		currentTime: video.currentTime,
		duration: video.duration,
		trackWidth: containerRect.width,
		chapters,
		bufferedRanges: readBufferedRanges(video),
	});

	chapterElements.forEach((chapter, index) => {
		const played = chapter.querySelector<HTMLElement>(".ytp-play-progress");
		const buffered = chapter.querySelector<HTMLElement>(".ytp-load-progress");
		if (played) played.style.transform = `scaleX(${progress.played[index]})`;
		if (buffered) buffered.style.transform = `scaleX(${progress.buffered[index]})`;
	});
}

function unbindVideo(): void {
	if (!boundVideo) return;
	VIDEO_EVENTS.forEach((eventName) => boundVideo?.removeEventListener(eventName, updateControls));
	boundVideo = null;
}

function bindVideo(video: HTMLVideoElement | null): void {
	if (video === boundVideo) {
		updateControls();
		return;
	}

	unbindVideo();
	if (!video || !active) return;

	boundVideo = video;
	VIDEO_EVENTS.forEach((eventName) => video.addEventListener(eventName, updateControls));
	updateControls();
}

function queueRebind(): void {
	if (!active || rebindQueued) return;
	rebindQueued = true;
	queueMicrotask(async () => {
		rebindQueued = false;
		if (active) bindVideo(await getVideoElement());
	});
}

function mutationContainsVideo(mutation: MutationRecord): boolean {
	return [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)].some((node) => {
		return node instanceof HTMLVideoElement || (node instanceof Element && node.querySelector("video"));
	});
}

function observePlayer(video: HTMLVideoElement | null): void {
	const player = video?.closest("#movie_player") ?? document.getElementById("movie_player");
	if (player === observedPlayer) return;

	playerObserver?.disconnect();
	playerObserver = null;
	observedPlayer = player;
	if (!player || !active) return;

	playerObserver = new MutationObserver((mutations) => {
		if (mutations.some(mutationContainsVideo)) queueRebind();
	});
	playerObserver.observe(player, { childList: true, subtree: true });
}

function disable(): void {
	active = false;
	reconcileVersion++;
	unbindVideo();
	playerObserver?.disconnect();
	playerObserver = null;
	observedPlayer = null;
}

async function reconcile(): Promise<void> {
	const version = ++reconcileVersion;
	const [extensionEnabled, autohideEnabled] = await Promise.all([
		getFromStorage("enableExtension"),
		getFromStorage("EnableControlPanelAutohide"),
	]);

	if (version !== reconcileVersion) return;
	if (extensionEnabled !== true || autohideEnabled !== false) {
		disable();
		return;
	}

	active = true;
	const video = await getVideoElement();
	if (version !== reconcileVersion || !active) return;
	bindVideo(video);
	observePlayer(video);
}

export function initControlPanelSync(): void {
	if (initialized) return;
	initialized = true;

	registerSettingListener("EnableControlPanelAutohide", reconcile);
	registerSettingListener("enableExtension", reconcile);
	onYoutubeNavigate(() => {
		unbindVideo();
		observedPlayer = null;
		void reconcile();
	});
	void reconcile();
}
