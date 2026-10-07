<script lang="ts">
	import type { Snippet } from "svelte";
	import { activeSectionValue, scrollToSection } from "./scrollSpy";

	let {
		attribute,
		activeValue = $bindable(""),
		offset = 100,
		sidebarWidth = 150,
		showSidebar = true,
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
		sidebarClass?: string;
		contentClass?: string;
		sidebarEl?: HTMLElement | null;
		contentEl?: HTMLElement | null;
		sidebar?: Snippet<[{ scrollTo: (value: string) => void; activeValue: string }]>;
		header?: Snippet;
		resizer?: Snippet;
		children: Snippet;
	} = $props();

	function handleScroll() {
		if (!contentEl) return;
		const value = activeSectionValue(contentEl, attribute, offset);
		if (value) activeValue = value;
	}

	function scrollTo(value: string) {
		if (scrollToSection(contentEl, attribute, value)) activeValue = value;
	}
</script>

<div class="sidebar-scroll-layout">
	{#if showSidebar && sidebar}
		<aside bind:this={sidebarEl} class="sidebar-scroll-sidebar {sidebarClass}" style:width={`${sidebarWidth}px`}>
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
		min-width: 150px;
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 10px 8px;
		overflow-y: auto;
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
