import { expect, test } from "bun:test";
import {
	CONFETTI_COLORS,
	createConfetto,
	createRainPiece,
	isConfettoAlive,
	stepConfetto,
} from "../../../src/ui/tutorial/tour/confetti";

function fixed(values: number[]) {
	let index = 0;
	return () => values[index++ % values.length];
}

test("cannons fire upward and inward", () => {
	const left = createConfetto(50, 800, 1, fixed([0.5]));
	expect(left.vy).toBeLessThan(0);
	expect(left.vx).toBeGreaterThan(0);
	const right = createConfetto(1230, 800, -1, fixed([0.5]));
	expect(right.vy).toBeLessThan(0);
	expect(right.vx).toBeLessThan(0);
});

test("step applies gravity and decay", () => {
	const piece = createConfetto(50, 800, 1, fixed([0.5]));
	const vy = piece.vy;
	stepConfetto(piece);
	expect(piece.vy).toBeGreaterThan(vy);
	expect(piece.life).toBeLessThan(1);
	expect(Number.isFinite(piece.x) && Number.isFinite(piece.y)).toBe(true);
});

test("dead confetti is culled", () => {
	const piece = createConfetto(50, 800, 1, fixed([0.5]));
	expect(isConfettoAlive(piece, 900)).toBe(true);
	piece.life = 0;
	expect(isConfettoAlive(piece, 900)).toBe(false);
	piece.life = 1;
	piece.y = 950;
	expect(isConfettoAlive(piece, 900)).toBe(false);
});

test("colors come from the palette", () => {
	for (let i = 0; i < 20; i++) {
		expect(CONFETTI_COLORS.includes(createConfetto(0, 0, 1).color)).toBe(true);
	}
});

test("rain falls from above the viewport and drifts down", () => {
	const drop = createRainPiece(1280, fixed([0.5]));
	expect(drop.x).toBe(640);
	expect(drop.y).toBeLessThan(0);
	expect(drop.vy).toBeGreaterThan(0);
	expect(isConfettoAlive(drop, 840)).toBe(true);
});

test("rain stays inside the horizontal span", () => {
	for (let i = 0; i < 20; i++) {
		const drop = createRainPiece(1280);
		expect(drop.x).toBeGreaterThanOrEqual(0);
		expect(drop.x).toBeLessThanOrEqual(1280);
		expect(Number.isFinite(drop.x) && Number.isFinite(drop.y)).toBe(true);
	}
});

test("cannon pieces keep full gravity with no fall cap", () => {
	const piece = createConfetto(50, 800, 1, fixed([0.5]));
	expect(piece.gravity).toBe(0.14);
	expect(piece.maxFall).toBeUndefined();
});

test("snow never accelerates past its feather cap", () => {
	const flake = createRainPiece(1280, fixed([0.5]));
	expect(flake.gravity).toBeLessThan(0.14);
	expect(flake.sway).toBeGreaterThanOrEqual(2);
	for (let i = 0; i < 500; i++) stepConfetto(flake);
	expect(flake.vy).toBeLessThanOrEqual(1.6);
	expect(flake.y).toBeGreaterThan(0);
});

test("snow drifts down slowly like a feather", () => {
	const flake = createRainPiece(1280, fixed([0.5]));
	for (let i = 0; i < 60; i++) stepConfetto(flake);
	expect(flake.vy).toBeLessThan(3);
	expect(flake.y).toBeLessThan(200);
});
