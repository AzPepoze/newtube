<div class="qc-visual">
	<div class="mock-page">
		<span class="mock-bar"></span>
		<div class="mock-target"><span class="target-label">#masthead-container</span></div>
		<svg class="pointer" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 14 L19 14 Z" />
		</svg>
	</div>
	<div class="generated-row">
		<span class="gen-dot"></span>
		<span class="gen-text">New setting generated</span>
	</div>
</div>

<style lang="scss">
	.qc-visual {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
	}

	.mock-page {
		position: relative;
		width: 260px;
		height: 130px;
		border-radius: 12px;
		border: 1px solid var(--border-subtle);
		background: var(--fg-opacity-03);
		overflow: hidden;
	}

	.mock-bar {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 22px;
		background: var(--fg-opacity-08);
	}

	.mock-target {
		position: absolute;
		top: 40px;
		left: 40px;
		right: 40px;
		height: 56px;
		border-radius: 8px;
		border: 2px dashed var(--fg-opacity-20);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: target-glow 3.6s ease-in-out infinite;

		.target-label {
			font-family: monospace;
			font-size: 10px;
			color: var(--font-color-dim);
		}
	}

	.pointer {
		position: absolute;
		width: 20px;
		height: 20px;
		fill: var(--font-color);
		filter: drop-shadow(0 2px 3px var(--shadow-color));
		animation: pointer-move 3.6s ease-in-out infinite;
	}

	.generated-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 12px;
		border-radius: 999px;
		background: var(--theme-0-15);
		border: 1px solid var(--theme-0-30);
		animation: generated-in 3.6s ease-in-out infinite;
	}

	.gen-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--theme-0);
	}

	.gen-text {
		font-size: 11px;
		font-weight: 600;
		color: var(--theme-0-text);
	}

	@keyframes pointer-move {
		0% {
			top: 100px;
			left: 20px;
		}
		40%,
		100% {
			top: 42px;
			left: 150px;
		}
	}

	@keyframes target-glow {
		0%,
		35% {
			border-color: var(--fg-opacity-20);
			box-shadow: none;
		}
		55%,
		100% {
			border-color: var(--theme-0);
			box-shadow: 0 0 0 3px var(--theme-0-20);
		}
	}

	@keyframes generated-in {
		0%,
		55% {
			opacity: 0;
			transform: translateY(8px);
		}
		75%,
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
