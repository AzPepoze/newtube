<script lang="ts">
	import { onMount } from "svelte";

	let {
		innerContentFunction,
		onClose: _onClose = () => {},
	}: {
		innerContentFunction: (parent: HTMLElement) => void | Promise<void>;
		onClose?: () => void;
	} = $props();

	let container = $state<HTMLElement | null>(null);

	onMount(async () => {
		if (container && innerContentFunction) {
			await innerContentFunction(container);
		}
	});
</script>

<div class="styleshift-config-window-wrapper">
	<div class="styleshift-config-window-content styleshift-scrollable">
		<div bind:this={container} class="styleshift-config-container-inner"></div>
	</div>
</div>

<style lang="scss">
	.styleshift-config-window-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.styleshift-config-window-content {
		flex: 1;
		width: 100%;
		box-sizing: border-box;
		overflow-y: auto;

		&::-webkit-scrollbar {
			width: 8px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--fg-opacity-10);
			border-radius: 10px;
			&:hover {
				background: var(--fg-opacity-20);
			}
		}
	}

	.styleshift-config-container-inner {
		height: 100%;
	}
</style>
