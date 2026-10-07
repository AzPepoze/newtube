<script lang="ts">
	import type { Setting } from "@settings/types/styleshiftTypes";
	import Button from "@controls/Button.svelte";
	import Checkbox from "@controls/Checkbox.svelte";
	import Description from "@base/Description.svelte";
	import IconButton from "@base/IconButton.svelte";
	import TextEditor from "@base/TextEditor.svelte";
	import { showUserConfirmation } from "@ui/window/windowFactory";
	import {
		detectPageFonts,
		extractFontsFromText,
		loadFonts,
		moveFont,
		saveFonts,
		type FontEntry,
	} from "../fontService";

	let { setting }: { setting: Extract<Setting, { type: "custom" }> } = $props();

	let fonts = $state<FontEntry[]>([]);
	let pasteText = $state("");

	async function handleAdd() {
		const newFonts = extractFontsFromText(pasteText);
		if (newFonts.length > 0) {
			fonts = [...fonts, ...newFonts];
			pasteText = "";
			await saveFonts(setting, fonts);
		}
	}

	async function handleDetectPageFonts() {
		const newDetected = detectPageFonts(fonts);
		if (newDetected.length > 0) {
			fonts = [...fonts, ...newDetected];
			await saveFonts(setting, fonts);
		}
	}

	async function handleToggle(_id: string) {
		await saveFonts(setting, fonts);
	}

	async function handleRemove(id: string, name: string) {
		const target = fonts.find((f) => f.id === id);
		if (target?.isDefault) return;

		if (await showUserConfirmation(`Are you sure you want to remove the font "${name}"?`, "Remove Font")) {
			fonts = fonts.filter((f) => f.id !== id);
			await saveFonts(setting, fonts);
		}
	}

	async function handleMove(index: number, direction: "up" | "down") {
		fonts = moveFont(fonts, index, direction);
		await saveFonts(setting, fonts);
	}

	async function init() {
		fonts = await loadFonts(setting.id);
		await handleDetectPageFonts();
	}
	init();
</script>

<div class="NEWTUBE-FontManager">
	<!-- 1. Paste Section -->
	<div class="section paste-section">
		<Description name="Paste Section" description="Paste Google Fonts style or URL here." showHoverPreview={false} />
		<TextEditor
			bind:value={pasteText}
			placeholder="@import url(https://fonts.googleapis.com/css2?family=Roboto&display=swap);"
		/>
		<div class="action-buttons-container">
			<Button
				setting={{
					type: "button",
					name: "Add Font",
					color: "#7f5db7",
					align: "center",
					clickFunction: handleAdd,
				}}
			/>
			<Button
				setting={{
					type: "button",
					name: "Detect Page Fonts",
					color: "#4a6fa5",
					align: "center",
					clickFunction: handleDetectPageFonts,
				}}
			/>
		</div>
	</div>

	<!-- 2. Manage Section -->
	<div class="section manage-section">
		<Description
			name="Manage Section"
			description="Enable, reorder, or delete fonts from your library."
			showHoverPreview={false}
		/>
		{#if fonts.length > 0}
			<div class="font-list">
				{#each fonts as font, i (font.id)}
					<div class="font-item" class:is-default={font.isDefault}>
						<div class="sort-buttons">
							<IconButton icon="arrowUp" onClick={() => handleMove(i, "up")} className="sort-btn" size={14} />
							<IconButton icon="arrowDown" onClick={() => handleMove(i, "down")} className="sort-btn" size={14} />
						</div>
						<div class="font-info">
							<span class="name">{font.fontName}</span>
							{#if font.isDefault}
								<span class="default-badge">Built-in</span>
							{/if}
						</div>
						<div class="actions">
							<Checkbox
								setting={{
									type: "checkbox",
									id: "", // Empty ID to use bind:value and avoid global storage
									name: "",
									value: font.enabled,
									updateFunction: () => handleToggle(font.id),
								}}
								bind:value={font.enabled}
							/>
							{#if !font.isDefault}
								<IconButton
									icon="delete"
									onClick={() => handleRemove(font.id, font.fontName)}
									className="delete-btn"
									size={20}
								/>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">No fonts added yet.</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.NEWTUBE-FontManager {
		display: flex;
		flex-direction: column;
		gap: 30px;
		padding: 5px;
		width: 100%;
		box-sizing: border-box;

		:global(.styleshift-input-wrapper) {
			max-width: none !important;
		}
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.action-buttons-container {
		display: flex;
		gap: 10px;
		margin-top: 5px;
		:global(.styleshift-button) {
			padding: 12px !important;
		}
	}

	.font-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.font-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		background: var(--fg-opacity-05);
		border-radius: 15px;
		border: 1px solid var(--fg-opacity-10);
		transition: all 0.2s;
		gap: 15px;

		&.is-default {
			background: var(--fg-opacity-03);
			border-color: var(--fg-opacity-08);
		}
	}

	.font-info {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;

		.name {
			font-size: 16px;
			font-weight: 600;
			color: white;
		}

		.default-badge {
			font-size: 11px;
			font-weight: 500;
			padding: 2px 8px;
			background: var(--fg-opacity-10);
			border: 1px solid var(--fg-opacity-15);
			border-radius: 10px;
			color: var(--fg-opacity-70);
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.sort-buttons {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-right: 5px;

		:global(.sort-btn) {
			padding: 4px !important;
			height: 24px !important;
			width: 32px !important;
			background: var(--fg-opacity-05);
			border: 1px solid var(--fg-opacity-10);
			border-radius: 6px;
			opacity: 0.8;

			&:hover {
				opacity: 1;
				background: var(--fg-opacity-10);
				border-color: var(--fg-opacity-20);
			}
		}
	}

	:global(.delete-btn) {
		padding: 6px !important;
		height: 36px !important;
		width: 36px !important;
		background: rgba(255, 0, 0, 0.1);
		border-radius: 10px;
		border: 1px solid rgba(255, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			background: rgba(255, 0, 0, 0.2);
			border-color: rgba(255, 0, 0, 0.4);
			transform: scale(1.1);
		}
	}

	.empty-state {
		padding: 20px;
		text-align: center;
		color: var(--fg-opacity-20);
		background: var(--fg-opacity-02);
		border: 1px dashed var(--fg-opacity-10);
		border-radius: 15px;
		font-style: italic;
	}

	:global(.styleshift-text-editor) {
		min-height: 100px !important;
	}
</style>
