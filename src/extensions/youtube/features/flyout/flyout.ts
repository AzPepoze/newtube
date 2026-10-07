import { sleep } from "@/core/shared/utilities";
import { logger } from "@/shared/logger";
import { localStorageUtil } from "@core/shared/localStorage";
import {
	getPlayerElement,
	getVideoElement,
	onYoutubeFullscreen,
	onYoutubeNavigate,
	onYoutubeSmallMode,
} from "@extensions/youtube/modules/youtube";
import { settingsUi } from "@ui/settings/settingsApi";
import { triggerWindowHideAnimation, triggerWindowShowAnimation } from "@ui/window/windowFactory";
import { unmount } from "svelte";
import FlyoutPlayer from "./views/FlyoutPlayer.svelte";

let isFlyoutEnabled = true;
let isFlyoutMounted = false;
let flyoutInstance: any = null;
let flyoutMountPoint: HTMLElement | null = null;
let globalObserver: IntersectionObserver | null = null;
let cleanups: (() => void)[] = [];
let targetMountedState: boolean = false;

export function enableFlyout() {
	if (globalObserver) return;

	globalObserver = new IntersectionObserver(
		async (entries) => {
			const moviePlayer = await getPlayerElement();
			if (!moviePlayer) return;

			for (const entry of entries) {
				if (entry.isIntersecting) {
					isFlyoutEnabled = true;
					if (targetMountedState === false) continue;

					targetMountedState = false;
					logger.debug("flyout", "Player is intersecting, hiding flyout");
					hideFlyout();
				} else if (entry.boundingClientRect.top < 0 && isFlyoutEnabled) {
					const videoId = new URLSearchParams(window.location.search).get("v");
					if (!videoId && !window.location.pathname.startsWith("/shorts/")) {
						return;
					}

					const video = await getVideoElement();
					const isRestricted =
						moviePlayer.classList.contains("ytp-fullscreen") || moviePlayer.classList.contains("ytp-player-minimized");

					if (!video || isRestricted) {
						if (targetMountedState) {
							targetMountedState = false;
							hideFlyout();
						}
						return;
					}

					if (targetMountedState === true) continue;

					targetMountedState = true;
					logger.debug("flyout", "Player scrolled out of view, showing flyout");
					showFlyout();
				}
			}
		},
		{ threshold: 0 },
	);

	const startObserving = () => {
		const playerContainer = document.querySelector("#player-container");
		if (playerContainer && globalObserver) {
			globalObserver.disconnect();
			globalObserver.observe(playerContainer);
		}
	};

	startObserving();

	const handleNavigate = () => {
		isFlyoutEnabled = true;
		targetMountedState = false;
		hideFlyout();
		setTimeout(startObserving, 1000);
	};

	const handleStateChange = () => {
		targetMountedState = false;
		hideFlyout();
	};

	cleanups = [
		onYoutubeNavigate(handleNavigate),
		onYoutubeFullscreen(handleStateChange),
		onYoutubeSmallMode(handleStateChange),
	];
}

async function showFlyout() {
	if (isFlyoutMounted) return;
	isFlyoutMounted = true;

	logger.info("flyout", "Mounting Flyout Player");
	const savedPos = localStorageUtil.get<any>("flyoutPosition");

	flyoutMountPoint = document.createElement("div");
	document.body.appendChild(flyoutMountPoint);

	flyoutInstance = settingsUi.mountComponent(
		FlyoutPlayer,
		{
			initialPos: savedPos,
			onClose: () => {
				logger.info("flyout", "Flyout closed by user");
				isFlyoutEnabled = false;
				targetMountedState = false;
				hideFlyout();
			},
		},
		flyoutMountPoint,
	);

	const windowContainer = flyoutMountPoint.querySelector(".styleshift-window-container") as HTMLElement;
	if (windowContainer) {
		triggerWindowShowAnimation(windowContainer);
	}
}

async function hideFlyout() {
	if (!isFlyoutMounted) return;
	isFlyoutMounted = false;

	logger.info("flyout", "Unmounting Flyout Player");
	const oldInstance = flyoutInstance;
	const oldMountPoint = flyoutMountPoint;
	flyoutInstance = null;
	flyoutMountPoint = null;

	if (oldInstance && oldMountPoint) {
		const windowContainer = oldMountPoint.querySelector(".styleshift-window-container") as HTMLElement;
		if (windowContainer) {
			await triggerWindowHideAnimation(windowContainer);
			await sleep(300);
		}
		unmount(oldInstance);
		oldMountPoint.remove();
	}
}

export function disableFlyout() {
	if (globalObserver) {
		globalObserver.disconnect();
		globalObserver = null;
	}

	cleanups.forEach((cleanup) => cleanup());
	cleanups = [];

	hideFlyout();
}
