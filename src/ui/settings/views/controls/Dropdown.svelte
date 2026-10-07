<script lang="ts">
	import { logger } from "@/shared/logger";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { quintOut } from "svelte/easing";
	import { scale } from "svelte/transition";
	import Description from "../base/Description.svelte";

	import { getFromStorage } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import { setAndSave } from "@ui/settings/settingsApi";
	import { applyThemeToElement } from "@ui/themes/theme";

	let {
		setting,
		isOpen = $bindable(false),
		triggerEl = $bindable<HTMLElement | null>(null),
		justMenu = false,
		inline = false,
		onClose = () => {},
	}: {
		setting: Extract<Setting, { type: "dropdown" }>;
		isOpen?: boolean;
		triggerEl?: HTMLElement | null;
		justMenu?: boolean;
		inline?: boolean;
		onClose?: () => void;
	} = $props();

	let value = $state("");

	async function init() {
		value = setting.value ?? "";
		logger.debug("ui", `[Dropdown] Initializing for setting: ${setting.id || "no-id"}`, {
			initialValue: setting.value,
			optionsCount: setting.options?.length,
		});
		if (setting.id) {
			const storedValue = await getFromStorage(setting.id);
			if (storedValue !== undefined && storedValue !== null) {
				logger.debug("ui", `[Dropdown] Loaded stored value: ${storedValue} for ${setting.id}`);
				value = storedValue;
			}
		}
	}
	init();

	$effect(() => {
		if (!setting.id && setting.value !== undefined) {
			value = setting.value as string;
		}
	});

	const name = $derived(setting.name);
	const description = $derived(setting.description);

	const optionsList = $derived(Array.isArray(setting.options) ? setting.options : []);
	const currentLabel = $derived(optionsList.find((opt: any) => opt.value === value)?.label || value);

	$effect(() => {
		logger.debug("ui", `[Dropdown] State change for ${setting.id || "no-id"}:`, {
			value,
			label: currentLabel,
			optionsAvailable: optionsList.length,
		});
	});

	let menuEl = $state<HTMLElement | null>(null);

	function toggleDropdown(e: MouseEvent) {
		logger.info("ui", `[Dropdown] Toggling dropdown for ${setting.id || "no-id"}. Current state: ${isOpen}`);
		e.stopPropagation();
		isOpen = !isOpen;
		if (!isOpen) onClose();
	}

	async function handleSelect(e: MouseEvent, optionValue: string) {
		logger.debug("ui", `[Dropdown] Option selected: "${optionValue}" for setting: ${setting.id || "no-id"}`);
		e.stopPropagation();
		value = optionValue;

		if (setting.id) {
			await setAndSave(setting, value);
			triggerSettingUpdate(setting.id);
		} else if (typeof setting.updateFunction === "function") {
			logger.debug("ui", `[Dropdown] Executing updateFunction for non-id setting`);
			(setting.updateFunction as Function)(value);
		}

		isOpen = false;
		if (onClose) onClose();
	}

	// Close on click outside
	$effect(() => {
		if (isOpen) {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					menuEl &&
					!menuEl.contains(event.target as Node) &&
					triggerEl &&
					!triggerEl.contains(event.target as Node)
				) {
					logger.info("ui", "Closing dropdown");
					isOpen = false;
					onClose();
				}
			};
			window.addEventListener("click", handleClickOutside);
			return () => window.removeEventListener("click", handleClickOutside);
		}
	});

	// Handle menu positioning and clipping
	let isMenuAbove = $state(false);
	let menuTop = $state(0);
	let menuLeft = $state(0);
	let menuWidth = $state(0);
	let isReady = $state(false);
	let scrollParent = $state<HTMLElement | null>(null);

	function updatePosition() {
		if (!triggerEl || !menuEl) return;

		if (!scrollParent) {
			scrollParent = triggerEl.closest(".styleshift-scrollable") as HTMLElement;
		}

		const triggerRect = triggerEl.getBoundingClientRect();

		if (scrollParent) {
			const parentRect = scrollParent.getBoundingClientRect();
			if (
				triggerRect.bottom < parentRect.top ||
				triggerRect.top > parentRect.bottom ||
				triggerRect.right < parentRect.left ||
				triggerRect.left > parentRect.right
			) {
				isOpen = false;
				return;
			}
		}

		menuWidth = triggerEl.offsetWidth;

		// Since we're teleporting to document.body, coordinates are relative to the viewport
		// plus current scroll position
		const scrollX = window.scrollX;
		const scrollY = window.scrollY;

		menuLeft = triggerRect.left + scrollX;

		const spaceBelow = window.innerHeight - triggerRect.bottom;
		const menuHeight = menuEl.offsetHeight;

		if (spaceBelow < menuHeight && triggerRect.top > menuHeight) {
			isMenuAbove = true;
			menuTop = triggerRect.top + scrollY - menuHeight - 8;
		} else {
			isMenuAbove = false;
			menuTop = triggerRect.bottom + scrollY + 8;
		}
		isReady = true;
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			},
		};
	}

	function menuAction(node: HTMLElement) {
		menuEl = node;
		requestAnimationFrame(() => {
			updatePosition();
			applyThemeToElement(node);
		});

		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);

		return {
			destroy() {
				window.removeEventListener("scroll", updatePosition, true);
				window.removeEventListener("resize", updatePosition);
			},
		};
	}

	$effect(() => {
		if (!isOpen) {
			isReady = false;
			scrollParent = null;
		}
	});
</script>

{#if !justMenu}
	<div class="styleshift-dropdown-row" class:inline>
		<Description {name} {description} />
		<div class="styleshift-dropdown-wrapper">
			<button bind:this={triggerEl} class="styleshift-dropdown-trigger" class:open={isOpen} onclick={toggleDropdown}>
				<div class="styleshift-dropdown-display">
					{#each optionsList as option (option.value)}
						<span class="tester-item" aria-hidden="true">
							{option.label}
						</span>
					{/each}
					<span class="current-value">
						{currentLabel}
					</span>
				</div>
				<span class="arrow">▼</span>
			</button>

			{#if isOpen}
				{@render menu()}
			{/if}
		</div>
	</div>
{:else if isOpen}
	{@render menu()}
{/if}

{#snippet menu()}
	<div
		use:portal
		use:menuAction
		class="styleshift-dropdown-menu styleshift-main"
		style:top="{menuTop}px"
		style:left="{menuLeft}px"
		style:width="{menuWidth}px"
		style:visibility={isReady ? "visible" : "hidden"}
		style:pointer-events={isReady ? "all" : "none"}
		class:above={isMenuAbove}
		transition:scale={{
			duration: 300,
			start: 0.9,
			opacity: 0,
			easing: quintOut,
		}}
	>
		{#each optionsList as option, i (option.value)}
			<button
				class="styleshift-dropdown-item"
				class:selected={option.value === value}
				onclick={(e) => handleSelect(e, option.value)}
				style="animation-delay: {i * 50}ms"
			>
				{option.label}
			</button>
		{/each}
	</div>
{/snippet}

<style lang="scss">
	.styleshift-dropdown-wrapper {
		position: relative;
		min-width: 120px;
	}

	.styleshift-dropdown-row {
		&.inline {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			min-width: 0;

			:global(.styleshift-main-description) {
				min-width: 0;
			}

			.styleshift-dropdown-wrapper {
				flex: 1 1 0;
				min-width: 0;
				max-width: 60%;
			}
		}
	}

	.styleshift-dropdown-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		background: var(--bg-overlay-30);
		border: 1px gray solid;
		color: var(--fg-opacity-100);
		border-radius: 20px;
		padding: 8px 15px;
		width: 100%;
		font-family: inherit;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		outline: none;

		&:hover {
			border-color: var(--theme-0);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px var(--bg-overlay-20);
			filter: brightness(1.5);
		}

		&.open {
			border-color: var(--theme-0);
			filter: brightness(1.5);

			.arrow {
				transform: rotate(180deg);
			}
		}

		.arrow {
			font-size: 10px;
			transition: transform 0.3s ease;
			opacity: 0.7;
		}
	}

	.styleshift-dropdown-display {
		display: grid;
		grid-template-areas: "stack";
		flex: 1;
		min-width: 0;
		justify-items: center;
		align-items: center;
	}

	.tester-item {
		grid-area: stack;
		visibility: hidden;
		white-space: nowrap;
		pointer-events: none;
		overflow: hidden;
	}

	.current-value {
		grid-area: stack;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
		width: 100%;
	}

	.styleshift-dropdown-menu {
		position: absolute;
		z-index: 10000;
		background: var(--bg-main);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 15px;
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		box-shadow: 0 10px 30px var(--bg-overlay-50);
		overflow: hidden;
		transform-origin: top center;
		box-sizing: border-box;
		margin-left: -1px;

		&.above {
			transform-origin: bottom center;
		}
	}

	.styleshift-dropdown-item {
		background: transparent;
		border: none;
		color: var(--fg-opacity-80);
		padding: 10px 14px;
		text-align: left;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		border-radius: 10px;
		transition: all 0.2s ease;
		opacity: 0;
		transform: translateX(-10px);
		animation: itemSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--text-primary);
			transform: translateX(5px);
		}

		&.selected {
			background: var(--theme-0);
			color: #ffffff;
			font-weight: bold;
		}
	}

	@keyframes itemSlideIn {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
