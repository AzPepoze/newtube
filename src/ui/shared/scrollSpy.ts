export type ScrollSpySection = {
	getAttribute: (name: string) => string | null;
	getBoundingClientRect: () => { top: number; bottom: number };
};

export type ScrollSpyContainer = {
	getBoundingClientRect: () => { top: number };
	querySelectorAll: (selector: string) => ArrayLike<ScrollSpySection>;
};

export type ScrollTarget = {
	scrollIntoView: (options: ScrollIntoViewOptions) => void;
};

export type ScrollTargetContainer = {
	querySelector: (selector: string) => ScrollTarget | null;
};

/** Value of the section crossing the line `offset` px below the container's top. */
export function activeSectionValue(container: ScrollSpyContainer, attribute: string, offset = 100): string | null {
	const containerTop = container.getBoundingClientRect().top;
	const sections = Array.from(container.querySelectorAll(`[${attribute}]`));
	const active = sections.find((section) => {
		const rect = section.getBoundingClientRect();
		return rect.top <= containerTop + offset && rect.bottom > containerTop + offset;
	});
	return active?.getAttribute(attribute) ?? null;
}

/** Scroll a section identified by `attribute="value"` into view. Returns whether it was found. */
export function scrollToSection(
	container: ScrollTargetContainer | null | undefined,
	attribute: string,
	value: string,
): boolean {
	const target = container?.querySelector(`[${attribute}="${value}"]`);
	if (!target) return false;
	target.scrollIntoView({ behavior: "smooth", block: "start" });
	return true;
}
