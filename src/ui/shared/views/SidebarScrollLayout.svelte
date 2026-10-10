<script lang="ts">
	import type { Snippet } from "svelte";
	import { activeSectionValue, scrollToSection } from "../scrollSpy";

	let {
		attribute,
		activeValue = $bindable(""),
		offset = 100,
		sidebarWidth = 150,
		showSidebar = true,
		indicator = false,
		sidebarClass = "",
		contentClass = "",
		sidebarEl = $bindable(null),
		contentEl = $bindable(null),
		sidebar,
		header,
		resizer,
		children,
	}: {
		attribute: string;
		activeValue?: string;
		offset?: number;
		sidebarWidth?: number;
		showSidebar?: boolean;
		/** Draws one accent bar that slides to the selected sidebar row. */
		indicator?: boolean;
		sidebarClass?: string;
		contentClass?: string;
		sidebarEl?: HTMLElement | null;
		contentEl?: HTMLElement | null;
		sidebar?: Snippet<[{ scrollTo: (value: string) => void; activeValue: string }]>;
		header?: Snippet;
		resizer?: Snippet;
		children: Snippet;
	} = $props();

	let indicatorBox = $state({ visible: false, top: 0, left: 0, height: 0 });
	let indicatorAnimated = $state(false);

	function handleScroll() {
		if (!contentEl) return;
		const value = activeSectionValue(contentEl, attribute, offset);
		if (value) activeValue = value;
	}

	function scrollTo(value: string) {
		if (scrollToSection(contentEl, attribute, value)) activeValue = value;
	}

	/** Places the indicator beside the selected row. The aside is its offset parent, so it scrolls with the list. */
	function measureIndicator() {
		const selected = sidebarEl?.querySelector<HTMLElement>(".styleshift-left-category-title.selected");
		indicatorBox.visible = Boolean(selected);
		if (!selected) return;

		indicatorBox.top = selected.offsetTop + 6;
		indicatorBox.left = selected.offsetLeft;
		indicatorBox.height = selected.offsetHeight - 12;
	}

	$effect(() => {
		if (!indicator || !sidebarEl) return;
		const aside = sidebarEl;
		const observer = new ResizeObserver(measureIndicator);
		observer.observe(aside);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!indicator) return;
		void activeValue;
		void sidebarEl;
		measureIndicator();
		// Skip the first placement so the bar appears in place instead of sliding in from the top.
		requestAnimationFrame(() => (indicatorAnimated = true));
	});
</script>

<div class="sidebar-scroll-layout">
	{#if showSidebar && sidebar}
		<aside bind:this={sidebarEl} class="sidebar-scroll-sidebar {sidebarClass}" style:width={`${sidebarWidth}px`}>
			{#if indicator}
				<span
					class="sidebar-indicator"
					class:animated={indicatorAnimated}
					class:visible={indicatorBox.visible}
					style:transform="translate({indicatorBox.left}px, {indicatorBox.top}px)"
					style:height="{indicatorBox.height}px"
				></span>
			{/if}
			{@render sidebar({ scrollTo, activeValue })}
		</aside>
		{#if resizer}{@render resizer()}{/if}
	{/if}

	<div class="sidebar-scroll-content">
		{#if header}{@render header()}{/if}
		<div bind:this={contentEl} class="sidebar-scroll-area {contentClass}" onscroll={handleScroll}>
			{@render children()}
		</div>
	</div>
</div>

<style lang="scss">
	.sidebar-scroll-layout {
		display: flex;
		flex-direction: row;
		gap: 5px;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.sidebar-scroll-sidebar {
		position: relative;
		min-width: 150px;
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 10px 8px;
		overflow-y: auto;
	}

	.sidebar-indicator {
		position: absolute;
		top: 0;
		left: 0;
		width: 3px;
		border-radius: 3px;
		background: var(--theme-0);
		opacity: 0;
		pointer-events: none;

		&.visible {
			opacity: 1;
		}

		&.animated {
			transition:
				transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
				height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
				opacity 0.2s ease;
		}
	}

	.sidebar-scroll-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.sidebar-scroll-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow-x: hidden;
		overflow-y: auto;
	}
</style>
