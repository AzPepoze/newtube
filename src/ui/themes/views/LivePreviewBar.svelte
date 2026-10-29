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
			<span class="preview-label">Previewing</span>
			<span class="theme-name">{themeName}</span>
		</div>

		<div class="actions-section">
			<button class="cancel-btn" onclick={onCancel} title="Cancel preview" aria-label="Cancel preview">
				<Icon name="close" size={16} />
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
		gap: 12px;
		padding: 8px 10px 8px 14px;
		background: var(--bg-main);
		border: 1px solid var(--fg-opacity-15);
		border-radius: 30px;
		color: var(--font-color);
		font-family: inherit;
	}

	.info-section {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;

		.preview-label {
			color: var(--font-color-dim);
			font-weight: 500;
		}

		.theme-name {
			font-weight: 600;
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
			justify-content: center;
			width: 30px;
			height: 30px;
			padding: 0;
			border-radius: 50%;
			cursor: pointer;
			transition: all 0.2s ease;
			border: none;
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
