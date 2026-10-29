<script lang="ts">
	import { EXPOSURE_GROUPS, EXPOSURE_SWITCHES } from "../exposureSwitches";
	import type { ExposureOptions } from "../types";

	interface Props {
		options: ExposureOptions;
		sizeLabel: string;
		notice: string;
		onChange: (key: keyof ExposureOptions, value: boolean) => void;
		onCancel: () => void;
		onSaveFile: () => void;
		onCopyJson: () => void;
	}

	let { options, sizeLabel, notice, onChange, onCancel, onSaveFile, onCopyJson }: Props = $props();

	const groups = EXPOSURE_GROUPS.map((group) => ({
		...group,
		switches: EXPOSURE_SWITCHES.filter((item) => item.group === group.id),
	}));
</script>

<aside class="panel">
	<h2 class="title">What to share</h2>

	<div class="scroll">
		{#each groups as group (group.id)}
			<section class="group">
				<h3 class="group-title">{group.label}</h3>
				{#each group.switches as item (item.key)}
					<label class="row">
						<span class="text">
							<span class="label">{item.label}</span>
							<span class="hint">{item.hint}</span>
						</span>
						<input
							class="toggle-input"
							type="checkbox"
							checked={options[item.key]}
							onchange={(event) => onChange(item.key, event.currentTarget.checked)}
						/>
						<span class="toggle" aria-hidden="true"></span>
					</label>
				{/each}
			</section>
		{/each}
	</div>

	<footer class="footer">
		{#if notice}
			<p class="notice">{notice}</p>
		{/if}
		<p class="size">Report size: {sizeLabel}</p>
		<div class="actions">
			<button class="button ghost" type="button" onclick={onCancel}>Cancel</button>
			<button class="button ghost" type="button" onclick={onSaveFile}>Save as file</button>
			<button class="button primary" type="button" onclick={onCopyJson}>Copy JSON</button>
		</div>
	</footer>
</aside>

<style>
	.panel {
		box-sizing: border-box;
		display: flex;
		flex: 0 0 340px;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		border-left: 1px solid var(--border-color);
		background: var(--bg-surface);
	}

	.title {
		margin: 0;
		padding: 16px;
		border-bottom: 1px solid var(--border-color);
		font-size: 18px;
	}

	.scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 8px 16px;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 0;
		border-bottom: 1px solid var(--border-color);
	}

	.group:last-child {
		border-bottom: 0;
	}

	.group-title {
		margin: 4px 0;
		color: var(--font-color-dim);
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.row {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px;
		border-radius: 8px;
		cursor: pointer;
	}

	.row:hover {
		background: var(--bg-surface-hover);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.label {
		font-size: 14px;
	}

	.hint {
		color: var(--font-color-dim);
		font-size: 12px;
	}

	.toggle-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.toggle {
		position: relative;
		flex: 0 0 38px;
		height: 22px;
		border-radius: 999px;
		background: var(--fg-opacity-20);
		transition: background 0.15s;
	}

	.toggle::after {
		content: "";
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--font-color);
		transition: transform 0.15s;
	}

	.toggle-input:checked + .toggle {
		background: var(--theme-0);
	}

	.toggle-input:checked + .toggle::after {
		transform: translateX(16px);
	}

	.toggle-input:focus-visible + .toggle {
		outline: 2px solid var(--theme-0-light);
		outline-offset: 2px;
	}

	.footer {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px;
		border-top: 1px solid var(--border-color);
	}

	.notice {
		margin: 0;
		color: var(--font-color-dim);
		font-size: 13px;
	}

	.size {
		margin: 0;
		font-size: 14px;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 8px;
	}

	.button {
		padding: 8px 14px;
		border: 1px solid var(--border-color);
		border-radius: 999px;
		background: var(--bg-main);
		color: var(--font-color);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.button.primary {
		border-color: var(--theme-0);
		background: var(--theme-0);
		color: #ffffff;
	}
</style>
