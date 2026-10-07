<script lang="ts">
	import { logger } from "@shared/logger";
	import { applyThemeToElement } from "@ui/themes/theme";
	import { showUserConfirmation } from "@ui/window/windowFactory";
	import { onDestroy, onMount } from "svelte";
	import { createEscapeHint } from "../escapeHint";
	import { setPickingMode } from "../pickingMode";
	import { generateSelectors } from "../selectorUtils";

	let { onSelect, onClose } = $props<{
		onSelect: (selector: string) => void;
		onClose: () => void;
	}>();

	let picking = $state(true);
	let hoveredElement = $state<HTMLElement | null>(null);
	let suggestedSelectors = $state<string[]>([]);
	let showSuggestions = $state(false);
	let menuPosition = $state({ x: 0, y: 0 });

	let overlay = $state<HTMLDivElement | null>(null);
	let hintHovered = $state(false);
	let exitHint: ReturnType<typeof createEscapeHint> | undefined;

	$effect(() => {
		exitHint?.setVisible(picking && !showSuggestions && !hintHovered);
	});

	function teleport(node: HTMLElement) {
		node.classList.add("styleshift-main");
		document.body.appendChild(node);
		applyThemeToElement(node);
		return {
			destroy() {
				node.remove();
			},
		};
	}

	function handleMouseMove(e: MouseEvent) {
		if (!picking || showSuggestions) return;

		const elements = document.elementsFromPoint(e.clientX, e.clientY);
		let target: HTMLElement | null = null;

		for (const el of elements) {
			const htmlEl = el as HTMLElement;
			const isInternal =
				htmlEl.closest(".styleshift-main") ||
				htmlEl.closest(".styleshift-window-container") ||
				htmlEl.classList.contains("selection-overlay") ||
				htmlEl.classList.contains("styleshift-highlight");

			if (!isInternal) {
				target = htmlEl;
				break;
			}
		}

		if (target !== hoveredElement) {
			hoveredElement = target;
			if (target) {
				setTimeout(() => updateOverlay(), 0);
			}
		}

		const isNearBottom = window.innerHeight - e.clientY < 70;
		const isNearCenter = Math.abs(e.clientX - window.innerWidth / 2) < 100;
		hintHovered = isNearBottom && isNearCenter;
	}

	function updateOverlay() {
		if (!hoveredElement || !overlay) return;
		const rect = hoveredElement.getBoundingClientRect();
		overlay.style.top = `${rect.top}px`;
		overlay.style.left = `${rect.left}px`;
		overlay.style.width = `${rect.width}px`;
		overlay.style.height = `${rect.height}px`;

		if (rect.top < 60) {
			logger.debug("Picker", "Tooltip flipped to bottom", { top: rect.top });
			overlay.classList.add("tooltip-bottom");
		} else {
			overlay.classList.remove("tooltip-bottom");
		}
	}

	function handleClick(e: MouseEvent) {
		if (!picking || !hoveredElement || showSuggestions) return;

		e.preventDefault();
		e.stopPropagation();

		let x = e.clientX;
		let y = e.clientY;
		const menuWidth = 280;
		const menuHeight = 350;

		if (x + menuWidth > window.innerWidth) {
			x = window.innerWidth - menuWidth - 20;
		}
		if (y + menuHeight > window.innerHeight) {
			y = window.innerHeight - menuHeight - 20;
		}

		menuPosition = { x, y };
		suggestedSelectors = generateSelectors(hoveredElement);
		showSuggestions = true;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			if (showSuggestions) {
				showSuggestions = false;
			} else {
				exit();
			}
		}
	}

	async function selectSelector(s: string) {
		showSuggestions = false;
		const wasPicking = picking;
		picking = false;

		const confirmed = await showUserConfirmation(`Do you want to use this selector?\n\n${s}`, "Confirm Selector", {
			confirmLabel: "Use Selector",
			confirmColor: "var(--theme-0)",
		});

		if (confirmed) {
			exit();
			onSelect(s);
		} else {
			picking = wasPicking;
			showSuggestions = false;
			previewElements = [];
		}
	}

	function exit() {
		picking = false;
		setPickingMode(false);
		onClose();
	}

	let previewElements = $state<HTMLElement[]>([]);

	function handleSuggestionHover(selector: string) {
		try {
			const elements = document.querySelectorAll(selector);
			previewElements = Array.from(elements).slice(0, 50) as HTMLElement[];
		} catch {
			previewElements = [];
		}
	}

	function handleSuggestionLeave() {
		previewElements = [];
	}

	function getRect(el: HTMLElement) {
		return el.getBoundingClientRect();
	}

	onMount(() => {
		logger.debug("Picker", "SelectorPicker mounted");
		exitHint = createEscapeHint("exit");
		setPickingMode(true);
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mousedown", handleClick, true);
		window.addEventListener("keydown", handleKeyDown);
	});

	onDestroy(() => {
		logger.debug("Picker", "SelectorPicker destroyed");
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mousedown", handleClick, true);
		window.removeEventListener("keydown", handleKeyDown);
		exitHint?.destroy();
		setPickingMode(false);
	});
</script>

{#if showSuggestions}
	<div use:teleport class="suggestions-list context-menu" style="top: {menuPosition.y}px; left: {menuPosition.x}px;">
		<div class="suggestions-header">
			Select Selector:
			<button class="close-suggestions" onclick={() => (showSuggestions = false)}>✕</button>
		</div>
		<div class="suggestions-content">
			{#each suggestedSelectors as s (s)}
				<button
					class="suggestion-item"
					onclick={() => selectSelector(s)}
					onmouseenter={() => handleSuggestionHover(s)}
					onmouseleave={handleSuggestionLeave}
				>
					{s}
				</button>
			{/each}
		</div>
	</div>
{/if}

{#each previewElements as el, i (i)}
	{@const rect = getRect(el)}
	<div
		use:teleport
		class="selection-overlay preview"
		style="top: {rect.top}px; left: {rect.left}px; width: {rect.width}px; height: {rect.height}px;"
	></div>
{/each}

{#if picking && hoveredElement && !showSuggestions}
	<div use:teleport bind:this={overlay} class="selection-overlay">
		<div class="selector-tooltip">
			{generateSelectors(hoveredElement)[0] || "No selector found"}
		</div>
	</div>
{/if}

<style lang="scss">
	.suggestions-list {
		background: var(--window-bg);
		backdrop-filter: var(--window-blur) var(--window-saturate);
		-webkit-backdrop-filter: var(--window-blur) var(--window-saturate);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 30px var(--shadow-color);
		z-index: 2147483647;

		&.context-menu {
			position: fixed;
			width: 280px;
			animation: menuFadeIn 0.15s ease-out;
		}
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.suggestions-header {
		padding: 10px 12px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: bold;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-surface);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-suggestions {
		background: transparent;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		padding: 2px 5px;
		opacity: 0.5;
		&:hover {
			opacity: 1;
		}
	}

	.suggestions-content {
		max-height: 300px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding: 4px;
	}

	.suggestion-item {
		background: transparent;
		color: var(--text-secondary);
		border: none;
		padding: 8px 12px;
		text-align: left;
		cursor: pointer;
		font-family: "Fira Code", monospace;
		font-size: 12px;
		border-radius: 4px;
		transition: all 0.1s;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&:hover {
			background: var(--theme-0, #7f5db7);
			color: white; // Theme color is dark enough for white text
			transform: translateX(5px);
		}
	}

	:global(.selection-overlay) {
		position: fixed;
		pointer-events: none;
		border: 2px solid var(--theme-0, #7f5db7);
		background: transparent;
		z-index: 2147483646;
		box-sizing: border-box;
		border-radius: 4px;
		transition: all 0.05s ease-out;
		box-shadow:
			0 0 15px rgba(127, 93, 183, 0.3),
			0 0 0 9999px rgba(0, 0, 0, 0.4);

		&.preview {
			border-style: dashed;
			background: rgba(127, 93, 183, 0.2);
			box-shadow: 0 0 15px rgba(127, 93, 183, 0.6);
			z-index: 2147483645;
		}
	}

	:global(.selection-overlay.tooltip-bottom .selector-tooltip) {
		bottom: auto !important;
		top: calc(100% + 10px) !important;
	}

	:global(.selection-overlay.tooltip-bottom .selector-tooltip::after) {
		top: auto !important;
		bottom: 100% !important;
		border-top-color: transparent !important;
		border-bottom-color: var(--theme-0, #7f5db7) !important;
	}

	:global(.selector-tooltip) {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		background: var(--theme-0, #7f5db7);
		color: white;
		padding: 6px 12px;
		font-size: 12px;
		border-radius: 6px;
		white-space: nowrap;
		font-family: "Fira Code", monospace;
		box-shadow: 0 4px 15px var(--shadow-color);
		font-weight: 600;
		animation: tooltipFadeIn 0.1s ease-out;

		&::after {
			content: "";
			position: absolute;
			top: 100%;
			left: 10px;
			border: 6px solid transparent;
			border-top-color: var(--theme-0, #7f5db7);
		}
	}
</style>
