import type { ConfettiMode } from "./confetti";

export interface CelebrationOptions {
	accent?: string;
	title?: string;
	message?: string;
	yayLabel?: string;
	mode?: ConfettiMode;
}

export interface ResolvedCelebrationOptions {
	accent: string;
	title: string;
	message: string;
	yayLabel: string;
	mode: ConfettiMode;
}

const DEFAULT_CELEBRATION_OPTIONS: ResolvedCelebrationOptions = {
	accent: "#8b7cf6",
	title: "You're all set!",
	message: "Have fun making YouTube yours.",
	yayLabel: "Yay!",
	mode: "cannons",
};

export function resolveCelebrationOptions(options: CelebrationOptions = {}): ResolvedCelebrationOptions {
	return { ...DEFAULT_CELEBRATION_OPTIONS, ...options };
}
