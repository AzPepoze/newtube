<script lang="ts">
	import { applyThemeToElement } from "@ui/themes/theme";
	import { onMount } from "svelte";
	import { quintOut } from "svelte/easing";
	import { scale } from "svelte/transition";
	import { blurIn, holdOpen } from "../modalTransition";

	let {
		children,
		onClose,
		width = "400px",
		isOpen = true,
	}: {
		children: any;
		onClose: () => void;
		width?: string;
		isOpen?: boolean;
	} = $props();

	let mounted = $state(false);
	let overlayEl = $state<HTMLElement | null>(null);

	// Rendering after mount lets Svelte play the intro transitions.
	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		if (overlayEl) applyThemeToElement(overlayEl);
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape" && isOpen) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen && mounted}
	<div
		bind:this={overlayEl}
		class="styleshift-modal-overlay styleshift-main"
		transition:holdOpen
		onclick={onClose}
		onkeydown={handleKeyDown}
		role="button"
		tabindex="-1"
	>
		<div class="styleshift-modal-backdrop" transition:blurIn={{ duration: 340 }}></div>
		<div
			class="styleshift-modal-content"
			style="width: {width};"
			transition:scale={{ duration: 340, start: 0.92, easing: quintOut }}
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			{@render children()}
		</div>
	</div>
{/if}

<style lang="scss">
	.styleshift-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000000;
	}

	.styleshift-modal-backdrop {
		position: absolute;
		inset: 0;
		background: var(--bg-overlay-20);
		backdrop-filter: blur(var(--modal-blur));
		will-change: backdrop-filter;
	}

	.styleshift-modal-content {
		position: relative;
		z-index: 1;
		background: var(--window-bg);
		backdrop-filter: var(--window-blur);
		-webkit-backdrop-filter: var(--window-blur);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 25px;
		padding: 30px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		box-shadow: 0 20px 50px var(--shadow-color);
		overflow: visible;
	}
</style>
