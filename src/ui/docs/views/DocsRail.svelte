<script lang="ts">
	let {
		container,
		activeEntry,
	}: {
		/** Scroll area that holds the doc entries. */
		container: HTMLElement | null;
		activeEntry: string;
	} = $props();

	let railEl: HTMLElement | null = $state(null);
	let box = $state({ visible: false, top: 0, height: 0, left: 0 });

	function findHeader(area: HTMLElement, entry: string): HTMLElement | null {
		for (const section of area.querySelectorAll<HTMLElement>("[data-docs-entry]")) {
			if (section.dataset.docsEntry === entry) return section.querySelector<HTMLElement>(".doc-entry-header");
		}
		return null;
	}

	/** Places the rail over the active entry's title, clipped to the visible scroll area. */
	function measure() {
		const host = railEl?.parentElement;
		const header = container && findHeader(container, activeEntry);
		if (!container || !host || !header) {
			box.visible = false;
			return;
		}

		const hostRect = host.getBoundingClientRect();
		const areaRect = container.getBoundingClientRect();
		const headRect = header.getBoundingClientRect();
		const top = Math.max(headRect.top, areaRect.top);
		const bottom = Math.min(headRect.bottom, areaRect.bottom);

		box.visible = bottom > top;
		box.top = top - hostRect.top;
		box.height = bottom - top;
		box.left = areaRect.left - hostRect.left;
	}

	$effect(() => {
		if (!container) return;
		const area = container;
		const observer = new ResizeObserver(measure);
		observer.observe(area);
		area.addEventListener("scroll", measure, { passive: true });
		return () => {
			observer.disconnect();
			area.removeEventListener("scroll", measure);
		};
	});

	$effect(() => {
		void activeEntry;
		void container;
		measure();
	});
</script>

<div
	bind:this={railEl}
	class="docs-rail"
	class:hidden={!box.visible}
	style:top="{box.top}px"
	style:height="{box.height}px"
	style:left="{box.left}px"
></div>

<style lang="scss">
	.docs-rail {
		position: absolute;
		width: 3px;
		border-radius: 3px;
		background: var(--accent);
		pointer-events: none;
		transition:
			top 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.2s ease;

		&.hidden {
			opacity: 0;
		}
	}
</style>
