<div class="dev-visual">
	<div class="mock-window">
		<div class="mock-titlebar">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</div>
		<div class="mock-row">
			<span class="row-label">Developer Mode</span>
			<span class="toggle"><span class="knob"></span></span>
		</div>
		<div class="mock-card">
			<span class="code-line"></span>
			<span class="code-line short"></span>
			<span class="code-line"></span>
		</div>
	</div>
</div>

<style lang="scss">
	.dev-visual {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.mock-window {
		width: 260px;
		border-radius: 12px;
		border: 1px solid var(--border-subtle);
		background: var(--fg-opacity-05);
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mock-titlebar {
		display: flex;
		gap: 6px;

		.dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: var(--fg-opacity-20);
		}
	}

	.mock-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-radius: 8px;
		background: var(--fg-opacity-03);
		border: 1px solid var(--fg-opacity-10);
	}

	.row-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--font-color);
	}

	.toggle {
		position: relative;
		width: 34px;
		height: 18px;
		border-radius: 999px;
		background: var(--fg-opacity-20);
		animation: toggle-flip 3.2s ease-in-out infinite;
	}

	.knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--font-color);
		animation: knob-slide 3.2s ease-in-out infinite;
	}

	.mock-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		border-radius: 8px;
		background: var(--theme-0-12);
		border: 1px solid var(--theme-0-30);
		animation: card-in 3.2s ease-in-out infinite;
	}

	.code-line {
		height: 6px;
		border-radius: 3px;
		background: var(--theme-0-40);
		animation: code-pulse 2.4s ease-in-out infinite;

		&.short {
			width: 60%;
		}
	}

	@keyframes toggle-flip {
		0%,
		25% {
			background: var(--fg-opacity-20);
		}
		45%,
		100% {
			background: var(--theme-0-40);
		}
	}

	@keyframes knob-slide {
		0%,
		25% {
			transform: translateX(0);
		}
		45%,
		100% {
			transform: translateX(16px);
		}
	}

	@keyframes card-in {
		0%,
		30% {
			opacity: 0;
			transform: translateY(6px);
		}
		55%,
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes code-pulse {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
</style>
