<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { fade, fly } from "svelte/transition";

	let {
		themeName,
		onCancel,
	}: {
		themeName: string;
		onCancel: () => void;
	} = $props();
</script>

<div class="styleshift-main live-preview-bar-wrapper" in:fly={{ y: 40, duration: 300 }} out:fade={{ duration: 200 }}>
	<div class="live-preview-pill">
		<div class="info-section">
			<span class="preview-label">Live Previewing:</span>
			<span class="theme-name">{themeName}</span>
		</div>

		<div class="actions-section">
			<button class="cancel-btn" onclick={onCancel} title="Exit live preview and restore previous settings">
				<Icon name="close" size={16} />
				<span>Cancel Preview</span>
			</button>
		</div>
	</div>
</div>

<style lang="scss">
	.live-preview-bar-wrapper {
		position: fixed;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100000;
		pointer-events: auto;
	}

	.live-preview-pill {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 10px 18px;
		background: var(--bg-overlay-90);
		backdrop-filter: blur(16px);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 30px;
		box-shadow: 0 12px 35px var(--shadow-color);
		color: var(--font-color);
		font-family: inherit;
	}

	.info-section {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13.5px;

		.preview-label {
			color: var(--font-color-dim);
			font-weight: 500;
		}

		.theme-name {
			font-weight: 700;
			color: var(--font-color);
			max-width: 200px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.actions-section {
		display: flex;
		align-items: center;
		gap: 10px;

		button {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 7px 14px;
			border-radius: 20px;
			font-size: 12.5px;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s ease;
			border: none;
			outline: none;
		}

		.cancel-btn {
			background: var(--theme-error-10);
			border: 1px solid var(--theme-error-30);
			color: var(--theme-error);

			&:hover {
				background: var(--theme-error-50);
				color: var(--font-color);
				transform: translateY(-1px);
			}
		}
	}
</style>
