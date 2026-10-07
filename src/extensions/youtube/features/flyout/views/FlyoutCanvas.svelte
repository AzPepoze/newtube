<script lang="ts">
	import { logger } from "@/shared/logger";
	import { getVideoElement } from "@extensions/youtube/modules/youtube";
	import Slider from "@ui/window/views/Slider.svelte";
	import { onDestroy, onMount } from "svelte";

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);
	let isMuted = $state(false);
	let showControls = $state(false);
	let controlsTimeout: any;

	$effect(() => {
		if (videoEl) {
			if (videoEl.volume !== volume) videoEl.volume = volume;
			if (videoEl.muted !== isMuted) videoEl.muted = isMuted;
		}
	});

	let containerEl = $state<HTMLElement | null>(null);
	let resizeObserver: ResizeObserver | null = null;

	let rafId: number;
	let rvfcId: number;
	let lastShowControlsState = false;

	const eventHandlers = {
		play: () => {
			logger.debug("flyout", "Video play event caught");
			isPlaying = true;
		},
		pause: () => {
			logger.debug("flyout", "Video pause event caught");
			isPlaying = false;
		},
		timeupdate: () => {
			if (videoEl) {
				currentTime = videoEl.currentTime;
				if (videoEl.paused) updateCanvas(true);
			}
		},
		durationchange: () => {
			if (videoEl) duration = videoEl.duration;
		},
		loadedmetadata: () => {
			if (videoEl) duration = videoEl.duration;
		},
		volumechange: () => {
			if (videoEl) {
				logger.debug("flyout", "Video volume change event caught", videoEl.volume);
				volume = videoEl.volume;
				isMuted = videoEl.muted;
			}
		},
	} as const;

	function updateCanvas(force = false) {
		if (ctx && canvasEl && videoEl && (force || (!videoEl.paused && !videoEl.ended))) {
			const cw = canvasEl.width;
			const ch = canvasEl.height;
			const vw = videoEl.videoWidth;
			const vh = videoEl.videoHeight;

			if (vw > 0 && vh > 0) {
				const videoRatio = vw / vh;
				const canvasRatio = cw / ch;

				let dx = 0,
					dy = 0,
					dw = cw,
					dh = ch;

				if (videoRatio > canvasRatio) {
					dh = cw / videoRatio;
					dy = (ch - dh) / 2;
				} else {
					dw = ch * videoRatio;
					dx = (cw - dw) / 2;
				}

				ctx.clearRect(0, 0, cw, ch);
				ctx.drawImage(videoEl, dx, dy, dw, dh);
			}
		}

		if (!force) {
			if (videoEl && "requestVideoFrameCallback" in videoEl) {
				rvfcId = (videoEl as any).requestVideoFrameCallback(() => updateCanvas(false));
			} else {
				rafId = requestAnimationFrame(() => updateCanvas(false)) as any;
			}
		}
	}

	function togglePlay() {
		if (videoEl) {
			if (videoEl.paused) videoEl.play();
			else videoEl.pause();
		}
	}

	function toggleMute() {
		if (videoEl) {
			videoEl.muted = !videoEl.muted;
			isMuted = videoEl.muted;
		}
	}

	function formatTime(seconds: number) {
		if (isNaN(seconds)) return "0:00";
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
		return `${m}:${s.toString().padStart(2, "0")}`;
	}

	function handleMouseMove() {
		if (!lastShowControlsState) {
			showControls = true;
			lastShowControlsState = true;
		}
		clearTimeout(controlsTimeout);
		controlsTimeout = setTimeout(() => {
			showControls = false;
			lastShowControlsState = false;
		}, 2000);
	}

	function handleMouseLeave() {
		if (isPlaying) {
			showControls = false;
			lastShowControlsState = false;
		}
	}

	onMount(async () => {
		logger.debug("flyout", "FlyoutCanvas mounted, searching for video element");
		videoEl = await getVideoElement();
		if (videoEl) {
			logger.info("flyout", "Video element found for FlyoutCanvas");
			isPlaying = !videoEl.paused;
			currentTime = videoEl.currentTime;
			duration = videoEl.duration;
			volume = videoEl.volume;
			isMuted = videoEl.muted;

			logger.debug("flyout", "Adding event listeners to video element");
			Object.entries(eventHandlers).forEach(([event, handler]) => {
				videoEl!.addEventListener(event, handler);
			});

			if (containerEl) {
				resizeObserver = new ResizeObserver((entries) => {
					for (const entry of entries) {
						if (canvasEl) {
							canvasEl.width = entry.contentRect.width;
							canvasEl.height = entry.contentRect.height;
							updateCanvas(true);
						}
					}
				});
				resizeObserver.observe(containerEl);
			}

			if (canvasEl) {
				ctx = canvasEl.getContext("2d", { alpha: false });
				if (ctx) {
					ctx.imageSmoothingEnabled = true;
				}
			}

			updateCanvas(false);
		} else {
			logger.error("flyout", "Could not find video element for FlyoutCanvas");
		}
	});

	onDestroy(() => {
		logger.debug("flyout", "Destroying FlyoutCanvas, cleaning up");
		clearTimeout(controlsTimeout);
		if (resizeObserver) resizeObserver.disconnect();
		ctx = null;
		if (videoEl) {
			logger.debug("flyout", "Removing event listeners from video element");
			Object.entries(eventHandlers).forEach(([event, handler]) => {
				videoEl!.removeEventListener(event, handler);
			});
			if ("cancelVideoFrameCallback" in videoEl) {
				logger.debug("flyout", "Cancelling video frame callback");
				(videoEl as any).cancelVideoFrameCallback(rvfcId);
			}
		}
		if (rafId) {
			logger.debug("flyout", "Cancelling animation frame");
			cancelAnimationFrame(rafId);
		}
	});

	function handleContainerClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest("button") && !target.closest(".styleshift-slider")) {
			togglePlay();
		}
	}
</script>

<div
	class="flyout-canvas-container"
	bind:this={containerEl}
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	onclick={handleContainerClick}
	role="presentation"
>
	<canvas bind:this={canvasEl} width="640" height="360"></canvas>

	<div
		class="controls-overlay"
		class:visible={showControls || !isPlaying}
		onclick={(e) => e.stopPropagation()}
		role="presentation"
	>
		<div class="side-controls">
			<div class="volume-vertical">
				<Slider
					vertical={true}
					min={0}
					max={1}
					bind:value={volume}
					onInput={(val) => {
						if (videoEl) {
							videoEl.volume = val;
							if (val > 0) {
								videoEl.muted = false;
								isMuted = false;
							}
						}
					}}
				/>
				<button class="icon-btn" onclick={toggleMute}>
					<span class="material-icons notranslate" translate="no"
						>{isMuted || volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}</span
					>
				</button>
			</div>
		</div>

		<div class="bottom-controls">
			<div class="timeline-container">
				<button class="icon-btn play-pause-btn" onclick={togglePlay}>
					<span class="material-icons notranslate" translate="no">{isPlaying ? "pause" : "play_arrow"}</span>
				</button>
				<span class="time-label">{formatTime(currentTime)}</span>
				<div class="range-wrapper">
					<Slider
						min={0}
						max={duration || 0}
						bind:value={currentTime}
						onInput={(val) => {
							if (videoEl) videoEl.currentTime = val;
						}}
					/>
				</div>
				<span class="time-label">{formatTime(duration)}</span>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.flyout-canvas-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: black;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;

		canvas {
			width: 100%;
			height: 100%;
			object-fit: contain;
			cursor: pointer;
		}
	}

	.controls-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 40%);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding: 10px;
		opacity: 0;
		transition: opacity 0.2s;
		pointer-events: none;

		&.visible {
			opacity: 1;
			pointer-events: all;
		}

		* {
			pointer-events: all;
		}
	}

	.timeline-container {
		display: flex;
		align-items: center;
		gap: 5px;
		width: 100%;
	}

	.play-pause-btn {
		margin-right: 2px;
		.material-icons {
			font-size: 22px;
		}
	}

	.side-controls {
		position: absolute;
		right: 15px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		pointer-events: all;
	}

	.volume-vertical {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
		padding: 15px 5px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 20px;
		height: 120px;
	}

	.icon-btn {
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 5px;
		border-radius: 50%;
		transition: background 0.2s;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}

		.material-icons {
			font-size: 20px;
		}
	}

	.timeline-container {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 0 5px;
	}

	.range-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		height: 20px;
	}

	.time-label {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.9);
		min-width: 40px;
		text-align: center;
		font-family: "DM Mono", monospace;
		text-shadow: 0 1px 2px var(--shadow-color);
	}
</style>
