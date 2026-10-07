import { IS_IN_EXTENSION_SETTINGS_PAGE } from "@core/shared/context";
import type { Category, Setting } from "@settings/types/styleshiftTypes";

const PREVIEW_DELAY_MS = 180;
const PREVIEW_EXIT_MS = 160;
const MAX_VISIBLE_TARGETS = 24;
const EXCLUDED_UI_SELECTOR =
	".styleshift-window, .styleshift-hover-preview-layer, .styleshift-highlight-layer, .styleshift-quick-customize-container";

export type HoverPreviewConfig = {
	selectors: string[];
	onStatus: (status: string) => void;
};

export type HoverPreviewContext = {
	resolve: () => HoverPreviewConfig | null;
};

export const HOVER_PREVIEW_CONTEXT = Symbol("hover-preview");

type HoverPreviewSession = {
	owner: HTMLElement;
	stop: () => void;
};

let pendingTimer: ReturnType<typeof setTimeout> | undefined;
let pendingOwner: HTMLElement | undefined;
let activeSession: HoverPreviewSession | undefined;

function categorySelector(category: Category) {
	return category.selector ?? "";
}

export function resolveHoverPreviewSelectors(setting: Setting, category?: Category): string[] | null {
	if (setting.hoverPreview === false) return null;
	if (setting.hoverPreview) return setting.hoverPreview.selectors;
	const fallback = category ? categorySelector(category) : "";
	return fallback ? [fallback] : null;
}

export function createHoverPreviewConfig(
	setting: Setting,
	category: Category | undefined,
	onStatus: (status: string) => void,
): HoverPreviewConfig | null {
	if (IS_IN_EXTENSION_SETTINGS_PAGE) return null;
	const selectors = resolveHoverPreviewSelectors(setting, category);
	return selectors?.length ? { selectors, onStatus } : null;
}

function isVisible(element: HTMLElement, rect: DOMRect) {
	if (element.hidden || rect.width <= 0 || rect.height <= 0) return false;
	const style = getComputedStyle(element);
	if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
	return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function startPreview(selectors: string[], onStatus: (status: string) => void) {
	const validSelectors = selectors.filter(Boolean);
	if (validSelectors.length === 0) return () => {};

	const matches = new Set<HTMLElement>();
	try {
		for (const selector of validSelectors) {
			for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
				if (!element.closest(EXCLUDED_UI_SELECTOR)) matches.add(element);
			}
		}
	} catch {
		onStatus("Preview unavailable");
		return () => onStatus("");
	}

	const targets = [...matches];
	const layer = document.createElement("div");
	layer.className = "styleshift-hover-preview-layer";
	layer.setAttribute("aria-hidden", "true");
	document.body.append(layer);
	let frame: number | undefined;
	const resizeObserver = new ResizeObserver(() => scheduleRender());
	for (const target of targets) resizeObserver.observe(target);

	function render() {
		frame = undefined;
		layer.replaceChildren();
		const connectedTargets = targets.filter((target) => target.isConnected);
		const visible = connectedTargets
			.map((target, order) => ({ target, order, rect: target.getBoundingClientRect() }))
			.filter(({ target, rect }) => isVisible(target, rect))
			.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left || a.order - b.order);

		for (const { rect } of visible.slice(0, MAX_VISIBLE_TARGETS)) {
			const outline = document.createElement("div");
			outline.className = "styleshift-hover-preview-outline";
			outline.style.left = `${rect.left}px`;
			outline.style.top = `${rect.top}px`;
			outline.style.width = `${rect.width}px`;
			outline.style.height = `${rect.height}px`;
			layer.append(outline);
		}

		if (connectedTargets.length === 0 || visible.length === 0) onStatus("Not visible on this page");
		else onStatus(`${visible.length} visible · ${connectedTargets.length} total`);
	}

	function scheduleRender() {
		if (frame !== undefined) return;
		frame = requestAnimationFrame(render);
	}

	render();
	window.addEventListener("resize", scheduleRender);
	document.addEventListener("scroll", scheduleRender, true);

	return () => {
		if (frame !== undefined) cancelAnimationFrame(frame);
		window.removeEventListener("resize", scheduleRender);
		document.removeEventListener("scroll", scheduleRender, true);
		resizeObserver.disconnect();
		layer.classList.add("is-hiding");
		setTimeout(() => layer.remove(), PREVIEW_EXIT_MS);
		onStatus("");
	};
}

function cancelPending(owner?: HTMLElement) {
	if (owner && pendingOwner !== owner) return;
	if (pendingTimer) clearTimeout(pendingTimer);
	pendingTimer = undefined;
	pendingOwner = undefined;
}

function stopActive(owner?: HTMLElement) {
	if (owner && activeSession?.owner !== owner) return;
	activeSession?.stop();
	activeSession = undefined;
}

function queuePreview(owner: HTMLElement, selectors: string[], onStatus: (status: string) => void) {
	if (activeSession?.owner === owner || pendingOwner === owner) return;
	cancelPending();
	stopActive();
	pendingOwner = owner;
	pendingTimer = setTimeout(() => {
		pendingTimer = undefined;
		pendingOwner = undefined;
		const stop = startPreview(selectors, onStatus);
		activeSession = { owner, stop };
	}, PREVIEW_DELAY_MS);
}

export function hoverPreview(node: HTMLElement, config: HoverPreviewConfig) {
	let hovered = false;
	let focused = false;
	const activate = () => queuePreview(node, config.selectors, config.onStatus);
	const deactivate = () => {
		if (hovered || focused) return;
		cancelPending(node);
		stopActive(node);
	};
	const pointerEnter = () => {
		hovered = true;
		activate();
	};
	const pointerLeave = () => {
		hovered = false;
		deactivate();
	};
	const focusIn = () => {
		focused = true;
		activate();
	};
	const focusOut = (event: FocusEvent) => {
		if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
		focused = false;
		deactivate();
	};

	node.addEventListener("pointerenter", pointerEnter);
	node.addEventListener("pointerleave", pointerLeave);
	node.addEventListener("focusin", focusIn);
	node.addEventListener("focusout", focusOut);

	return {
		destroy() {
			hovered = false;
			focused = false;
			deactivate();
			node.removeEventListener("pointerenter", pointerEnter);
			node.removeEventListener("pointerleave", pointerLeave);
			node.removeEventListener("focusin", focusIn);
			node.removeEventListener("focusout", focusOut);
		},
	};
}
