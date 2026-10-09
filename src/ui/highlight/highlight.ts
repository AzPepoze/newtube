import { createUniqueId } from "@/core/shared/utilities";
import { waitDocumentLoaded } from "@core/shared/domHelpers";
import { getStyleShiftItems } from "@settings/registry/items";
import { getCategoryLabel } from "@settings/registry/category";
import { type Category } from "@settings/types/styleshiftTypes";
import { createEditorUi, editorUi } from "@ui/window/editor";
import { showUserConfirmation } from "@ui/window/windowFactory";
import { createEscapeHint } from "./escapeHint";
import { setPickingMode } from "./pickingMode";

type HighlightObj = {
	highlighter: HTMLDivElement;
	targetElement: HTMLElement;
	getBoundsElement: () => HTMLElement;
	categories: Category[];
	stop: () => void;
	updateBounds: () => void;
};

let highlightElements: Record<string, HighlightObj> = {};
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
const debounceDelay = 150;
const labelCursorGap = 8;
const labelViewportPadding = 4;
const highlightZIndexBase = 1;
let highlightLayer: HTMLDivElement | undefined;
let highlightLabel: HTMLDivElement | undefined;
let activeHighlighter: HTMLDivElement | undefined;
let labelFrame: number | undefined;
let labelResizeAnimation: Animation | undefined;
let pointerX = 0;
let pointerY = 0;

function categorySelector(category: Category) {
	return category.selector ?? "";
}

function renderHighlightLabel(label: HTMLDivElement, categories: Category[]) {
	const beforeRender = label.getBoundingClientRect();
	let chips = label.querySelector<HTMLDivElement>(".styleshift-highlight-categories");
	if (!chips) {
		chips = document.createElement("div");
		chips.className = "styleshift-highlight-categories";
		label.append(chips);
	}

	const existingChips = new Map(
		Array.from(chips.children, (chip) => [(chip as HTMLElement).dataset.categoryKey, chip as HTMLElement]),
	);
	const nextKeys = new Set<string>();
	for (const category of categories) {
		const key = `${getCategoryLabel(category)}\u0000${categorySelector(category)}\u0000${category.highlightColor}`;
		nextKeys.add(key);
		const existingChip = existingChips.get(key);
		if (existingChip) {
			existingChip.classList.remove("styleshift-highlight-category-removing");
			continue;
		}
		const chip = document.createElement("span");
		chip.className = "styleshift-highlight-category styleshift-highlight-category-adding";
		chip.dataset.categoryKey = key;
		chip.textContent = getCategoryLabel(category);
		chip.style.backgroundColor = `rgb(${category.highlightColor})`;
		chips.append(chip);
		chip.addEventListener("animationend", () => chip.classList.remove("styleshift-highlight-category-adding"), {
			once: true,
		});
	}

	for (const [key, chip] of existingChips) {
		if (key && nextKeys.has(key)) continue;
		chip.classList.add("styleshift-highlight-category-removing");
		chip.addEventListener(
			"animationend",
			() => {
				const beforeRemoval = label.getBoundingClientRect();
				chip.remove();
				animateHighlightLabelSize(label, beforeRemoval);
			},
			{ once: true },
		);
	}
	animateHighlightLabelSize(label, beforeRender);
}

function animateHighlightLabelSize(label: HTMLDivElement, before: DOMRect) {
	labelResizeAnimation?.cancel();
	const after = label.getBoundingClientRect();
	scheduleHighlightLabelPosition();
	if (before.width === after.width && before.height === after.height) return;

	const animation = label.animate(
		[
			{ width: `${before.width}px`, height: `${before.height}px` },
			{ width: `${after.width}px`, height: `${after.height}px` },
		],
		{ duration: 150, easing: "ease-out" },
	);
	labelResizeAnimation = animation;
	animation.addEventListener(
		"finish",
		() => {
			if (labelResizeAnimation === animation) labelResizeAnimation = undefined;
			scheduleHighlightLabelPosition();
		},
		{ once: true },
	);
}

function positionHighlightLabel() {
	if (!highlightLabel) return;
	const labelRect = highlightLabel.getBoundingClientRect();
	const maxLeft = Math.max(labelViewportPadding, window.innerWidth - labelRect.width - labelViewportPadding);
	const maxTop = Math.max(labelViewportPadding, window.innerHeight - labelRect.height - labelViewportPadding);
	const rightLeft = pointerX + labelCursorGap;
	const preferredLeft =
		rightLeft + labelRect.width <= window.innerWidth - labelViewportPadding
			? rightLeft
			: pointerX - labelCursorGap - labelRect.width;

	highlightLabel.style.left = `${Math.min(Math.max(labelViewportPadding, preferredLeft), maxLeft)}px`;
	highlightLabel.style.top = `${Math.min(Math.max(labelViewportPadding, pointerY - labelRect.height / 2), maxTop)}px`;
}

function updateHighlightLabelPosition(event: PointerEvent) {
	pointerX = event.clientX;
	pointerY = event.clientY;
	scheduleHighlightLabelPosition();
}

function scheduleHighlightLabelPosition() {
	if (labelFrame !== undefined) return;
	labelFrame = requestAnimationFrame(() => {
		positionHighlightLabel();
		labelFrame = undefined;
	});
}

function showHighlightLabel(highlighter: HTMLDivElement, categories: Category[], event: PointerEvent) {
	if (!highlightLabel) return;
	activeHighlighter = highlighter;
	renderHighlightLabel(highlightLabel, categories);
	highlightLabel.classList.add("styleshift-highlight-label-visible");
	updateHighlightLabelPosition(event);
}

function hideHighlightLabel(highlighter?: HTMLDivElement) {
	if (highlighter && activeHighlighter !== highlighter) return;
	activeHighlighter = undefined;
	highlightLabel?.classList.remove("styleshift-highlight-label-visible");
}

function debounce(callback: () => void) {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		callback();
		debounceTimer = undefined;
	}, debounceDelay);
}

function addHighlight(targetElement: HTMLElement, selectorValue: Category) {
	const existUniqueId = targetElement.getAttribute("StyleShift-uniqueId");
	if (existUniqueId) {
		const obj = highlightElements[existUniqueId];
		if (obj && !obj.categories.includes(selectorValue)) {
			obj.categories.push(selectorValue);
			if (activeHighlighter === obj.highlighter && highlightLabel) {
				renderHighlightLabel(highlightLabel, obj.categories);
				scheduleHighlightLabelPosition();
			}
		}
		return obj;
	}

	const uniqueId = createUniqueId(10);
	const categories = [selectorValue];
	targetElement.setAttribute("StyleShift-uniqueId", uniqueId);

	const color = `rgba(${selectorValue.highlightColor}`;
	const highlighter = document.createElement("div");
	highlighter.className = "styleshift-highlight";
	highlighter.dataset.styleshiftSelector = categorySelector(selectorValue);
	highlighter.style.background = `${color},0.3)`;
	highlighter.style.borderColor = `${color},0.8)`;

	const isBodyBackground = targetElement === document.body && categorySelector(selectorValue) === "body";
	const getBoundsElement = () =>
		isBodyBackground ? (document.querySelector<HTMLElement>("ytd-app") ?? targetElement) : targetElement;

	function updateBounds() {
		const rect = getBoundsElement().getBoundingClientRect();
		highlighter.style.position = "fixed";
		highlighter.style.left = `${rect.left}px`;
		highlighter.style.top = `${rect.top}px`;
		highlighter.style.width = `${rect.width}px`;
		highlighter.style.height = `${rect.height}px`;
	}

	function handlePointerPosition(event: PointerEvent) {
		if (activeHighlighter === highlighter) updateHighlightLabelPosition(event);
	}

	function handlePointerEnter(event: PointerEvent) {
		showHighlightLabel(highlighter, categories, event);
	}

	function handlePointerLeave() {
		hideHighlightLabel(highlighter);
	}

	updateBounds();

	(highlightLayer ?? document.body).append(highlighter);
	highlighter.addEventListener("pointerenter", handlePointerEnter);
	highlighter.addEventListener("pointermove", handlePointerPosition);
	highlighter.addEventListener("pointerleave", handlePointerLeave);
	highlighter.onclick = () => {
		hideExitHint();
		createEditorUi(targetElement, categories);
		stopHighlighter();
	};

	function stop() {
		hideHighlightLabel(highlighter);
		highlighter.removeEventListener("pointerenter", handlePointerEnter);
		highlighter.removeEventListener("pointermove", handlePointerPosition);
		highlighter.removeEventListener("pointerleave", handlePointerLeave);
		highlighter.remove();
		targetElement.removeAttribute("StyleShift-uniqueId");
		delete highlightElements[uniqueId];
	}

	const result = { highlighter, targetElement, getBoundsElement, categories, stop, updateBounds };
	highlightElements[uniqueId] = result;
	return result;
}

function hasMatchingAncestor(element: HTMLElement, selector: string) {
	return Boolean(element.parentElement?.closest(selector));
}

function addMatches(root: HTMLElement, category: Category, ignoredSelectors: Set<string>) {
	const selector = categorySelector(category);
	if (!selector || ignoredSelectors.has(selector)) return;

	const matches: HTMLElement[] = [];
	if (root.matches(selector)) matches.push(root);
	matches.push(...Array.from(root.querySelectorAll<HTMLElement>(selector)));

	for (const element of matches) {
		if (!hasMatchingAncestor(element, selector)) addHighlight(element, category);
	}
}

let watchBody: MutationObserver | undefined;
let updateFrame: number | undefined;
let exitHint: ReturnType<typeof createEscapeHint> | undefined;

function showExitHint() {
	if (exitHint) return;
	exitHint = createEscapeHint("cancel");
}

function hideExitHint() {
	exitHint?.destroy();
	exitHint = undefined;
}

function handleCustomizeKeydown(event: KeyboardEvent) {
	if (event.key !== "Escape" || !runningCustomize) return;
	event.preventDefault();
	event.stopPropagation();
	editorUi?.removeUi(true);
	stopCustomize();
}

function updateHighlightStacking() {
	const highlights = Object.values(highlightElements).map((highlight, order) => {
		const rect = highlight.highlighter.getBoundingClientRect();
		const boundsElement = highlight.getBoundsElement();
		const targetStyle = getComputedStyle(boundsElement);
		const isHidden = boundsElement.hidden || targetStyle.display === "none" || targetStyle.visibility !== "visible";
		const visibleLeft = Math.max(0, rect.left);
		const visibleRight = Math.min(window.innerWidth, rect.right);
		const visibleTop = Math.max(0, rect.top);
		const visibleBottom = Math.min(window.innerHeight, rect.bottom);
		const visibleWidth = Math.max(0, visibleRight - visibleLeft);
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		return {
			highlight,
			order,
			area: isHidden ? 0 : visibleWidth * visibleHeight,
			verticalCenter: rect.top + rect.height / 2,
		};
	});

	highlights.sort((a, b) => {
		if (a.area === 0 && b.area !== 0) return -1;
		if (a.area !== 0 && b.area === 0) return 1;
		if (a.area !== b.area) return b.area - a.area;
		if (a.verticalCenter !== b.verticalCenter) return a.verticalCenter - b.verticalCenter;
		return a.order - b.order;
	});

	for (const [index, { highlight }] of highlights.entries()) {
		highlight.highlighter.style.zIndex = `${highlightZIndexBase + index}`;
	}
}

function updateHighlightBounds() {
	if (updateFrame !== undefined) return;
	updateFrame = requestAnimationFrame(() => {
		for (const highlight of Object.values(highlightElements)) {
			if (highlight.targetElement.isConnected) highlight.updateBounds();
			else highlight.stop();
		}
		updateHighlightStacking();
		updateFrame = undefined;
	});
}

export async function startHighlighter() {
	await waitDocumentLoaded();
	if (runningCustomize) showExitHint();
	highlightLayer = document.createElement("div");
	highlightLayer.className = "styleshift-highlight-layer styleshift-main";
	highlightLabel = document.createElement("div");
	highlightLabel.className = "styleshift-highlight-label";
	highlightLayer.append(highlightLabel);
	document.body.append(highlightLayer);
	const editableItems = await getStyleShiftItems();
	const categories = [...editableItems.Default, ...editableItems.AddOn] as Category[];
	const ignoredSelectors = new Set<string>();
	const pendingRoots = new Set<HTMLElement>();

	for (const category of categories) {
		const selector = categorySelector(category);
		if (!category.category || !selector) continue;
		const selectorFound = document.querySelectorAll<HTMLElement>(selector);
		if (
			selectorFound.length >= 1000 &&
			!(await showUserConfirmation(
				`StyleShift : I found ${selectorFound.length} elements on selector "${selector}"\n\nAre you wish to continue??`,
			))
		) {
			ignoredSelectors.add(selector);
			continue;
		}
		addMatches(document.documentElement, category, ignoredSelectors);
	}
	updateHighlightStacking();

	watchBody = new MutationObserver((mutations) => {
		let shouldUpdate = false;
		for (const mutation of mutations) {
			const mutationElement = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
			if (mutationElement?.closest(".styleshift-highlight-layer")) continue;
			if (mutation.type === "attributes") {
				if (mutation.attributeName?.toLowerCase() === "styleshift-uniqueid") continue;
			}
			shouldUpdate = true;
			if (mutation.type !== "childList") continue;
			for (const node of Array.from(mutation.addedNodes)) {
				if (node instanceof HTMLElement) {
					pendingRoots.add(node);
				}
			}
		}
		if (!shouldUpdate) return;
		updateHighlightBounds();
		if (pendingRoots.size === 0) return;
		debounce(() => {
			for (const root of pendingRoots) {
				for (const category of categories) addMatches(root, category, ignoredSelectors);
			}
			pendingRoots.clear();
			updateHighlightBounds();
		});
	});
	watchBody.observe(document.body, {
		attributes: true,
		characterData: true,
		childList: true,
		subtree: true,
	});
	window.addEventListener("resize", updateHighlightBounds);
	document.addEventListener("scroll", updateHighlightBounds, true);
}

function stopHighlighter() {
	watchBody?.disconnect();
	watchBody = undefined;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = undefined;
	if (updateFrame !== undefined) cancelAnimationFrame(updateFrame);
	updateFrame = undefined;
	if (labelFrame !== undefined) cancelAnimationFrame(labelFrame);
	labelFrame = undefined;
	labelResizeAnimation?.cancel();
	labelResizeAnimation = undefined;
	hideHighlightLabel();
	highlightLayer?.remove();
	highlightLayer = undefined;
	highlightLabel = undefined;
	window.removeEventListener("resize", updateHighlightBounds);
	document.removeEventListener("scroll", updateHighlightBounds, true);
	for (const highlight of Object.values(highlightElements)) highlight.stop();
	highlightElements = {};
}

let runningCustomize = false;

export async function startCustomize() {
	if (runningCustomize) return;
	runningCustomize = true;
	setPickingMode(true);
	window.addEventListener("keydown", handleCustomizeKeydown, true);
	await startHighlighter();
}

export function stopCustomize() {
	if (!runningCustomize) return;
	runningCustomize = false;
	hideExitHint();
	window.removeEventListener("keydown", handleCustomizeKeydown, true);
	stopHighlighter();
	setPickingMode(false);
}

export async function toggleCustomize() {
	if (runningCustomize) {
		stopCustomize();
		editorUi.removeUi(false);
	} else {
		await startCustomize();
	}
}
