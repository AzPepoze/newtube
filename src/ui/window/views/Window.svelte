<script lang="ts">
	import { applyThemeToElement } from "@ui/themes/theme";
	import { onDestroy, onMount, untrack } from "svelte";
	import { WindowLogic } from "../windowLogic.svelte";
	import WindowResizer from "./WindowResizer.svelte";
	import WindowTitlebar from "./WindowTitlebar.svelte";
	import { constrainWindowPosition, parseDimension } from "../windowUtils";

	let {
		title = "StyleShift",
		onClose = () => {},
		width = "600px",
		height = "400px",
		fullscreen = false,
		center = false,
		mini = false,
		aspectRatio = 0,
		autoHideTopbar = false,
		noPadding = false,
		minVisibleRatio = 0.1,
		disableBackdropFilter = false,
		blurToggle = false,
		topbarChildren = null,
		children,
		el = $bindable(null),
		onPositionChange = () => {},
		translate = "",
	}: {
		title?: string;
		onClose?: () => void;
		width?: string;
		height?: string;
		fullscreen?: boolean;
		center?: boolean;
		mini?: boolean;
		aspectRatio?: number;
		autoHideTopbar?: boolean;
		noPadding?: boolean;
		minVisibleRatio?: number;
		disableBackdropFilter?: boolean;
		blurToggle?: boolean;
		topbarChildren?: any;
		children: any;
		el?: HTMLElement | null;
		onPositionChange?: (pos: { translate: string; width: string; height: string }) => void;
		translate?: string;
	} = $props();

	const windowId = Math.random().toString(36).substring(2, 9);
	let windowEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);
	let blurOff = $state(false);

	const vw =
		typeof window !== "undefined" ? Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) : 0;
	const vh =
		typeof window !== "undefined" ? Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) : 0;

	let currentWidth = $state(untrack(() => width));
	let currentHeight = $state(untrack(() => height));
	let currentTranslate = $state("");

	const getInitialPosition = () => {
		const f = untrack(() => fullscreen);
		const t = untrack(() => translate);
		const w = untrack(() => width);
		const h = untrack(() => height);
		const c = untrack(() => center);
		const m = untrack(() => minVisibleRatio);

		if (f) return "0px 0px";
		if (t) return t;

		const elWidth = parseDimension(w, vw);
		const elHeight = parseDimension(h, vh);

		let left = 0;
		let top = 0;

		if (c) {
			left = vw / 2 - elWidth / 2;
			top = vh / 2 - elHeight / 2;
		} else {
			left = vw * 0.25;
			top = vh * 0.1;
		}

		const constrained = constrainWindowPosition(left, top, elWidth, elHeight, m);
		return `${constrained.left}px ${constrained.top}px`;
	};

	if (typeof window !== "undefined") {
		currentTranslate = getInitialPosition();
	}

	const logic = new WindowLogic({
		windowId,
		onClose: () => onClose(),
		onPositionChange: (pos) => {
			currentTranslate = pos.translate;
			currentWidth = pos.width;
			currentHeight = pos.height;
			onPositionChange(pos);
		},
	});

	let isPicking = $state(false);

	onMount(() => {
		if (windowEl) {
			applyThemeToElement(windowEl);
			window.addEventListener("resize", handleViewportResize);
		}

		const handlePickerState = (e: any) => {
			isPicking = e.detail.picking;
		};
		window.addEventListener("styleshift-picker-state", handlePickerState);

		return () => {
			window.removeEventListener("styleshift-picker-state", handlePickerState);
		};
	});

	function handleViewportResize() {
		if (!windowEl || logic.isDragging || logic.isResizing || fullscreen) return;
		if (logic.snapZone) {
			logic.refreshSnap();
			return;
		}

		const [x, y] = currentTranslate.split(" ");
		const currentLeft = parseInt(x) || 0;
		const currentTop = parseInt(y) || 0;

		const constrained = constrainWindowPosition(
			currentLeft,
			currentTop,
			windowEl.offsetWidth,
			windowEl.offsetHeight,
			minVisibleRatio,
		);

		if (currentLeft !== constrained.left || currentTop !== constrained.top) {
			const finalTranslate = `${constrained.left}px ${constrained.top}px`;
			currentTranslate = finalTranslate;
			onPositionChange({
				translate: finalTranslate,
				width: currentWidth,
				height: currentHeight,
			});
		}
	}

	onDestroy(() => {
		window.removeEventListener("resize", handleViewportResize);
		logic.destroy();
	});

	$effect(() => {
		logic.title = title;
		logic.autoHideTopbar = autoHideTopbar;
	});

	$effect(() => {
		if (!logic.isMinimized && contentEl && contentEl.childElementCount === 0 && typeof children === "function") {
			try {
				children(contentEl);
			} catch (_e) {}
		}
	});
</script>

<div
	class="styleshift-window-container styleshift-window styleshift-main"
	class:maximized={logic.isMaximized || fullscreen}
	class:fullscreen
	class:dragging={logic.isDragging}
	class:resizing={logic.isResizing}
	class:snapping={logic.isSnapping}
	class:minimized={logic.isMinimized}
	class:picking-mode={isPicking}
	class:mini
	class:auto-hide-topbar={autoHideTopbar}
	class:disable-backdrop-filter={disableBackdropFilter || blurOff}
	class:hide-topbar={autoHideTopbar && !logic.isHovering && !logic.isDragging && !logic.isResizing}
	style:width={fullscreen ? "100vw" : currentWidth}
	style:height={fullscreen ? "100vh" : currentHeight}
	style:translate={currentTranslate}
	onmousemove={logic.handleActivity}
	bind:this={windowEl}
	bind:this={el}
	data-window-id={windowId}
	role="presentation"
>
	{#if windowEl && !logic.snapZone && !fullscreen}
		<WindowResizer
			target={windowEl}
			{aspectRatio}
			onResizeStart={() => (logic.isResizing = true)}
			onResizeEnd={() => {
				logic.isResizing = false;
				if (windowEl) {
					onPositionChange({
						translate: windowEl.style.translate,
						width: windowEl.style.width,
						height: windowEl.style.height,
					});
				}
			}}
		/>
	{/if}

	<div class="styleshift-window-clipper">
		{#if !fullscreen}
			<WindowTitlebar
				{title}
				isMaximized={logic.isMaximized}
				onDragStart={(e) => logic.handleDrag(e, minVisibleRatio)}
				onMaximize={logic.toggleMaximize}
				onMinimize={logic.toggleMinimize}
				onClose={logic.handleClose}
				{topbarChildren}
				showBlurToggle={blurToggle}
				{blurOff}
				onToggleBlur={() => (blurOff = !blurOff)}
			/>
		{/if}

		<div class="styleshift-window-content" class:no-padding={noPadding} bind:this={contentEl}>
			{#if children}
				{@render children()}
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.styleshift-window-container {
		position: fixed;
		background: var(--window-bg);
		backdrop-filter: var(--window-blur) var(--window-saturate);
		-webkit-backdrop-filter: var(--window-blur) var(--window-saturate);

		&.disable-backdrop-filter {
			backdrop-filter: none !important;
			-webkit-backdrop-filter: none !important;
		}

		border: 1px solid var(--fg-opacity-10);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 50px var(--shadow-color);
		z-index: 10000;
		overflow: visible;
		top: 0;
		left: 0;
		pointer-events: all;
		opacity: 0;
		transform: scale(0.95);
		transition:
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			translate 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			opacity 0.3s,
			width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			border-radius 0.3s;

		&.maximized {
			border-radius: 0;
			border: none;
		}

		&.fullscreen {
			border-radius: 0;
			border: none;
			box-shadow: none;
			opacity: 1;
			transform: scale(1);
		}

		&.dragging,
		&.resizing {
			transition: none !important;
		}

		/* Ease-out quart: fast start, long soft landing, no overshoot */
		&.snapping {
			transition:
				translate 0.22s cubic-bezier(0.25, 1, 0.5, 1),
				width 0.22s cubic-bezier(0.25, 1, 0.5, 1),
				height 0.22s cubic-bezier(0.25, 1, 0.5, 1),
				border-radius 0.3s,
				opacity 0.3s;

			@media (prefers-reduced-motion: reduce) {
				transition: opacity 0.2s;
			}
		}

		&.minimized {
			transform: translateY(100px) scale(0.8) !important;
			opacity: 0 !important;
			pointer-events: none !important;
		}

		&.picking-mode {
			opacity: 0 !important;
			pointer-events: none !important;
			transform: scale(0.98) !important;
		}

		&.hide-topbar {
			:global(.styleshift-window-topbar) {
				transform: translateY(-100%);
				opacity: 0;
				pointer-events: none;
			}
		}

		&.auto-hide-topbar {
			.styleshift-window-content {
				height: 100%;
				padding-top: 0;
			}
		}

		&.mini {
			border-radius: 8px;
			.styleshift-window-clipper {
				box-shadow: 0 10px 30px var(--shadow-color);

				.styleshift-window-content {
					padding: 0;
					border-bottom-left-radius: 8px;
					border-bottom-right-radius: 8px;
				}
			}
		}
	}

	.styleshift-window-clipper {
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: inherit;
		display: flex;
		flex-direction: column;
		position: relative;
		box-shadow: 0 20px 50px var(--shadow-color);
	}

	.styleshift-window-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		padding: 10px;
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;

		&.no-padding {
			padding: 0 !important;
		}

		:global(.fullscreen) & {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
			padding: 0;
		}
	}
</style>
