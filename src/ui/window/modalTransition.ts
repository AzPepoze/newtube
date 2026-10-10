import type { TransitionConfig } from "svelte/transition";

const BLUR_VAR = "--modal-blur";

function prefersReducedMotion() {
	return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readBlurAmount(node: HTMLElement) {
	return parseFloat(getComputedStyle(node).getPropertyValue(BLUR_VAR)) || 0;
}

/**
 * Animates the backdrop blur in and out. The amount is read every frame, because the theme
 * attribute can be set after the dialog mounts. The inline style is cleared at the end so the CSS variable applies.
 */
export function blurIn(node: HTMLElement, { duration = 340 }: { duration?: number } = {}): TransitionConfig {
	return {
		duration: prefersReducedMotion() ? 0 : duration,
		tick: (t) => {
			node.style.backdropFilter = t === 1 ? "" : `blur(${readBlurAmount(node) * t}px)`;
		},
	};
}

/** Keeps an element mounted for its outro without animating its own styles. */
export function holdOpen(_node: HTMLElement, { duration = 340 }: { duration?: number } = {}): TransitionConfig {
	return { duration: prefersReducedMotion() ? 0 : duration, tick: () => {} };
}
