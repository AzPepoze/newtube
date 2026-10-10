<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import {
		createConfetto,
		createRainPiece,
		isConfettoAlive,
		stepConfetto,
		type ConfettiMode,
		type Confetto,
	} from "./confetti";

	let { mode = "cannons", onDone }: { mode?: ConfettiMode; onDone?: () => void } = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let frameId: number | null = null;
	let resizeHandler: (() => void) | null = null;
	let stopped = false;

	const SPAWN_MS = 1600;
	const BURST = 70;
	const PER_FRAME = 3;
	const RAIN_BURST = 45;
	const RAIN_EVERY_N_FRAMES = 4;
	const MAX_RAIN_PIECES = 240;

	// Read the live size on every spawn so pieces cover the window after a resize.
	function spawnCannonPair(confetti: Confetto[]): void {
		const width = window.innerWidth;
		const height = window.innerHeight;
		confetti.push(createConfetto(width * 0.04, height + 8, 1));
		confetti.push(createConfetto(width * 0.96, height + 8, -1));
	}

	function spawnInitial(confetti: Confetto[]): void {
		if (mode === "rain") {
			for (let i = 0; i < RAIN_BURST; i++) confetti.push(createRainPiece(window.innerWidth));
			return;
		}
		for (let i = 0; i < BURST; i++) spawnCannonPair(confetti);
	}

	function spawnTick(confetti: Confetto[]): void {
		for (let i = 0; i < PER_FRAME; i++) spawnCannonPair(confetti);
	}

	function paintFrame(ctx: CanvasRenderingContext2D): void {
		const confetti: Confetto[] = [];
		spawnInitial(confetti);
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			if (stopped) return;
			frame += 1;
			if (mode === "rain") {
				// Snow never stops on its own: drizzle steadily until unmounted.
				if (frame % RAIN_EVERY_N_FRAMES === 0 && confetti.length < MAX_RAIN_PIECES) {
					confetti.push(createRainPiece(window.innerWidth));
				}
			} else if (now - start < SPAWN_MS) {
				spawnTick(confetti);
			}
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
			for (let i = confetti.length - 1; i >= 0; i--) {
				const piece = confetti[i];
				stepConfetto(piece);
				if (!isConfettoAlive(piece, window.innerHeight + 40)) {
					confetti.splice(i, 1);
					continue;
				}
				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(1, piece.life * 1.5));
				ctx.translate(piece.x, piece.y);
				ctx.rotate(piece.rot);
				ctx.fillStyle = piece.color;
				if (piece.circle) {
					ctx.beginPath();
					ctx.arc(0, 0, piece.w / 2, 0, Math.PI * 2);
					ctx.fill();
				} else {
					ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
				}
				ctx.restore();
			}
			if (mode === "rain" || confetti.length > 0 || now - start < SPAWN_MS + 400) {
				frameId = requestAnimationFrame(tick);
			} else {
				frameId = null;
				ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
				onDone?.();
			}
		};
		frameId = requestAnimationFrame(tick);
	}

	onMount(() => {
		const canvas = canvasEl;
		if (!canvas) return;
		const setup = () => {
			const ctx = canvas.getContext("2d");
			if (!ctx) return null;
			const ratio = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.floor(window.innerWidth * ratio);
			canvas.height = Math.floor(window.innerHeight * ratio);
			ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
			return ctx;
		};
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			onDone?.();
			return;
		}
		const ctx = setup();
		if (!ctx) return;
		resizeHandler = () => setup();
		window.addEventListener("resize", resizeHandler);
		paintFrame(ctx);
	});

	onDestroy(() => {
		stopped = true;
		if (frameId !== null) cancelAnimationFrame(frameId);
		if (resizeHandler) window.removeEventListener("resize", resizeHandler);
	});
</script>

<div class="confetti-overlay" aria-hidden="true">
	<canvas bind:this={canvasEl} class="confetti-canvas"></canvas>
</div>

<style lang="scss">
	.confetti-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000001;
		pointer-events: none;
	}

	.confetti-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
