export interface Confetto {
	x: number;
	y: number;
	vx: number;
	vy: number;
	w: number;
	h: number;
	rot: number;
	vr: number;
	color: string;
	circle: boolean;
	life: number;
	decay: number;
	sway: number;
	swaySpeed: number;
	swayPhase: number;
	gravity: number;
	/** Caps the fall speed so snow and feathers drift instead of accelerating. */
	maxFall?: number;
}

export const CONFETTI_COLORS = ["#8b7cf6", "#4caf50", "#38bdf8", "#f472b6", "#ffb020", "#a3e635", "#e45eff"];

export type ConfettiMode = "cannons" | "rain";

export const CONFETTI_GRAVITY = 0.14;
export const CONFETTI_DRAG = 0.992;

/** Creates one confetti piece fired from a bottom-corner cannon, arcing up and inward. */
export function createConfetto(
	originX: number,
	originY: number,
	direction: 1 | -1,
	random: () => number = Math.random,
	colors: string[] = CONFETTI_COLORS,
): Confetto {
	const tilt = 0.35 + random() * 0.45;
	const angle = -Math.PI / 2 + direction * tilt;
	const speed = 9 + random() * 7;
	return {
		x: originX,
		y: originY,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		w: 6 + random() * 6,
		h: 8 + random() * 8,
		rot: random() * Math.PI * 2,
		vr: (random() - 0.5) * 0.3,
		color: colors[Math.floor(random() * colors.length)],
		circle: random() < 0.3,
		life: 1,
		decay: 0.004 + random() * 0.006,
		sway: 1 + random() * 2,
		swaySpeed: 0.05 + random() * 0.08,
		swayPhase: random() * Math.PI * 2,
		gravity: CONFETTI_GRAVITY,
	};
}

/** Creates one snow-like feather piece: slow fall, wide wind drift, capped speed. */
export function createRainPiece(
	spanWidth: number,
	random: () => number = Math.random,
	colors: string[] = CONFETTI_COLORS,
): Confetto {
	return {
		x: random() * spanWidth,
		y: -20 - random() * 40,
		vx: (random() - 0.5) * 2,
		vy: 0.6 + random() * 0.8,
		w: 3 + random() * 4,
		h: 4 + random() * 6,
		rot: random() * Math.PI * 2,
		vr: (random() - 0.5) * 0.12,
		color: colors[Math.floor(random() * colors.length)],
		circle: random() < 0.5,
		life: 1,
		decay: 0.001 + random() * 0.002,
		sway: 2 + random() * 2,
		swaySpeed: 0.03 + random() * 0.05,
		swayPhase: random() * Math.PI * 2,
		gravity: 0.008,
		maxFall: 1.6,
	};
}

/** Advances one confetti piece by a single frame. */
export function stepConfetto(particle: Confetto): void {
	particle.vy += particle.gravity;
	if (particle.maxFall !== undefined) particle.vy = Math.min(particle.vy, particle.maxFall);
	particle.vx *= CONFETTI_DRAG;
	particle.swayPhase += particle.swaySpeed;
	particle.x += particle.vx + Math.sin(particle.swayPhase) * particle.sway * 0.3;
	particle.y += particle.vy;
	particle.rot += particle.vr;
	particle.life -= particle.decay;
}

export function isConfettoAlive(particle: Confetto, floorY: number): boolean {
	return particle.life > 0 && particle.y <= floorY;
}
