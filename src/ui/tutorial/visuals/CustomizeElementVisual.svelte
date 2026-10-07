<div class="ce-visual">
	<div class="target-list">
		<div class="target-chip">Masthead</div>
		<div class="target-chip scan">Player</div>
		<div class="target-chip">Guide</div>
	</div>
	<div class="settings-panel">
		<span class="panel-title">Player settings</span>
		<span class="panel-row"></span>
		<span class="panel-row short"></span>
	</div>
</div>

<style lang="scss">
	.ce-visual {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 16px;
	}

	.target-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.target-chip {
		padding: 7px 14px;
		border-radius: 8px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-03);
		font-size: 12px;
		color: var(--font-color-dim);

		&.scan {
			animation: chip-scan 3s ease-in-out infinite;
		}
	}

	.settings-panel {
		width: 120px;
		display: flex;
		flex-direction: column;
		gap: 7px;
		padding: 10px;
		border-radius: 10px;
		border: 1px solid var(--theme-0-30);
		background: var(--theme-0-10);
		animation: panel-in 3s ease-in-out infinite;
	}

	.panel-title {
		font-size: 11px;
		font-weight: 700;
		color: var(--theme-0-text);
	}

	.panel-row {
		height: 5px;
		border-radius: 3px;
		background: var(--theme-0-30);

		&.short {
			width: 55%;
		}
	}

	@keyframes chip-scan {
		0%,
		20% {
			border-color: var(--fg-opacity-10);
			background: var(--fg-opacity-03);
			color: var(--font-color-dim);
			transform: translateX(0);
		}
		45%,
		100% {
			border-color: var(--theme-0);
			background: var(--theme-0-15);
			color: var(--font-color);
			transform: translateX(6px);
		}
	}

	@keyframes panel-in {
		0%,
		35% {
			opacity: 0;
			transform: translateX(8px);
		}
		60%,
		100% {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
