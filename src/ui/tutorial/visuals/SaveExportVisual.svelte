<div class="se-visual">
	<div class="save-button">Save</div>
	<div class="file-chip">
		<span class="file-name">theme.NewTube.zip</span>
		<svg class="download-arrow" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 3 L12 14 M7 9 L12 14 L17 9 M5 20 L19 20" />
		</svg>
	</div>
</div>

<style lang="scss">
	.se-visual {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.save-button {
		padding: 9px 26px;
		border-radius: 10px;
		background: var(--theme-0);
		color: var(--fg-opacity-100);
		font-size: 13px;
		font-weight: 700;
		animation: save-press 3.4s ease-in-out infinite;
	}

	.file-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 10px;
		border: 1px solid var(--theme-0-30);
		background: var(--theme-0-12);
		animation: file-fly 3.4s ease-in-out infinite;
	}

	.file-name {
		font-family: monospace;
		font-size: 11px;
		color: var(--font-color);
	}

	.download-arrow {
		width: 16px;
		height: 16px;
		stroke: var(--theme-0-text);
		stroke-width: 2;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@keyframes save-press {
		0%,
		15% {
			transform: scale(1);
			filter: none;
		}
		25% {
			transform: scale(0.94);
			filter: brightness(1.15);
		}
		40%,
		100% {
			transform: scale(1);
			filter: none;
		}
	}

	@keyframes file-fly {
		0%,
		45% {
			opacity: 0;
			transform: translateY(-6px);
		}
		65%,
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
