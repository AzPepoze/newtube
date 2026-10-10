const SHRINK_MS = 300;

export interface Placeholder {
	element: () => HTMLElement | null;
	rect: () => DOMRect | null;
	snapTo: (anchor: HTMLElement, isAfter?: boolean) => void;
	showAt: (anchor: HTMLElement, isAfter: boolean) => void;
	settle: () => void;
	remove: () => void;
}

/** The drop slot. `showAt` animates between slots, `snapTo` moves it instantly. */
export function createPlaceholder(height: number): Placeholder {
	let current: HTMLElement | null = null;
	const fading = new Set<HTMLElement>();

	function create(): HTMLElement {
		const el = document.createElement("div");
		el.className = "styleshift-drag-hint";
		el.style.height = "0px";
		return el;
	}

	function insert(el: HTMLElement, anchor: HTMLElement, isAfter: boolean) {
		anchor.parentElement?.insertBefore(el, isAfter ? anchor.nextSibling : anchor);
	}

	function growIn(el: HTMLElement) {
		requestAnimationFrame(() => {
			el.style.transition = "";
			el.classList.add("show");
			el.style.height = `${height}px`;
		});
	}

	function fadeOut(el: HTMLElement) {
		el.style.transition = "";
		el.classList.remove("show");
		el.style.height = "0px";
		fading.add(el);
		setTimeout(() => {
			fading.delete(el);
			el.remove();
		}, SHRINK_MS);
	}

	function removeFading() {
		for (const el of fading) el.remove();
		fading.clear();
	}

	return {
		element: () => current,
		rect: () => current?.getBoundingClientRect() ?? null,

		snapTo(anchor, isAfter = false) {
			removeFading();
			if (!current) current = create();
			current.style.transition = "none";
			current.style.height = `${height}px`;
			current.classList.add("show");
			insert(current, anchor, isAfter);
		},

		showAt(anchor, isAfter) {
			const previous = current;
			current = create();
			insert(current, anchor, isAfter);
			growIn(current);
			if (previous) fadeOut(previous);
		},

		settle() {
			removeFading();
			if (!current) return;
			current.style.transition = "none";
			current.style.height = `${height}px`;
			current.classList.add("show");
		},

		remove() {
			removeFading();
			current?.remove();
			current = null;
		},
	};
}
