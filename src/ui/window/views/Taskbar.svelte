<script lang="ts">
	import { getAssetUrl } from "@ui/window/utils";
	import { windowManager } from "@ui/window/windowManager.svelte";
	import { fade, scale } from "svelte/transition";

	function handleRestore(id: string, restore: () => void) {
		restore();
		windowManager.removeWindow(id);
	}
</script>

{#if windowManager.minimizedWindows.length > 0}
	<div class="styleshift-taskbar" in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>
		{#each windowManager.minimizedWindows as window (window.id)}
			<button
				class="taskbar-item"
				onclick={() => handleRestore(window.id, window.restore)}
				in:scale={{ duration: 400, start: 0.8 }}
			>
				<img src={getAssetUrl("icon/32.png")} alt="" />
				<span>{window.title}</span>
			</button>
		{/each}
	</div>
{/if}

<style lang="scss">
	.styleshift-taskbar {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		height: 50px;
		background: var(--bg-overlay-60);
		backdrop-filter: blur(10px);
		border: 1px solid var(--fg-opacity-10);
		border-radius: 15px;
		padding: 5px;
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 10001;
		box-shadow: 0 10px 30px var(--shadow-color);
		pointer-events: auto;
	}

	.taskbar-item {
		height: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 15px;
		background: transparent;
		border: none;
		border-radius: 10px;
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.2s;
		pointer-events: auto;
		white-space: nowrap;

		&:hover {
			background: var(--fg-opacity-10);
		}

		img {
			width: 24px;
			height: 24px;
		}

		span {
			font-size: 13px;
			font-weight: 500;
		}
	}
</style>
