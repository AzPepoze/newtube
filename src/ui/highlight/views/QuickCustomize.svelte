<script lang="ts">
	import TextInput from "@controls/TextInput.svelte";
	import CodeEditor from "@editor/CodeEditor.svelte";
	import Icon from "@base/Icon.svelte";
	import IconButton from "@base/IconButton.svelte";
	import SettingsGroup from "@base/SettingsGroup.svelte";
	import SidebarNavItem from "@base/SidebarNavItem.svelte";
	import { hoverPreview, type HoverPreviewConfig } from "@ui/settings/hoverPreview";
	import SidebarScrollLayout from "@ui/shared/views/SidebarScrollLayout.svelte";
	import { openTutorialOverlay } from "@ui/tutorial/tutorialService";
	import { logger } from "@shared/logger";
	import type { QuickCustomizeMetadata, QuickCustomizeMode } from "@settings/types/styleshiftTypes";
	import { onDestroy, onMount } from "svelte";
	import CapsuleTabs from "../../window/views/CapsuleTabs.svelte";
	import QuickControlRow from "./QuickControlRow.svelte";
	import { QuickCustomizeController } from "../QuickCustomizeController.svelte";

	type QuickCustomizeSaveData = {
		selector: string;
		css: string;
		mode: QuickCustomizeMode;
		name: string;
		metadata: QuickCustomizeMetadata;
	};
	type QuickCustomizeInitialData = {
		name: string;
		mode: QuickCustomizeMode;
		basicStyles: Record<string, string>;
		enabledStyles: Record<string, boolean>;
		rawCss?: string;
	};

	let {
		selector = "",
		onClose = () => {},
		onSave = (_data: QuickCustomizeSaveData) => {},
		initialData = null as QuickCustomizeInitialData | null,
	}: {
		selector: string;
		onClose: () => void;
		onSave: (data: QuickCustomizeSaveData) => void;
		initialData?: QuickCustomizeInitialData | null;
	} = $props();

	const controller = new QuickCustomizeController({
		get selector() {
			return selector;
		},
		get initialData() {
			return initialData;
		},
		get onSave() {
			return onSave;
		},
	});

	let copied = $state(false);
	let previewStatus = $state("");

	const previewConfig: HoverPreviewConfig = {
		get selectors() {
			return selector ? [selector] : [];
		},
		onStatus: (status) => (previewStatus = status),
	};

	$effect(() => {
		controller.selector = selector;
	});

	$effect(() => {
		controller.applyPreview();
	});

	$effect(() => {
		controller.handleTabChange(controller.activeTab);
	});

	async function copySelector() {
		try {
			await navigator.clipboard.writeText(selector);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch (error) {
			logger.warn("QuickCustomize", "Failed to copy selector", error);
		}
	}

	onMount(() => {
		logger.debug("QuickCustomize", "Mounted for selector", selector);
	});
	onDestroy(() => {
		controller.destroy();
	});
</script>

<div class="styleshift-quick-customize-container">
	<div class="setting-name-header">
		<div class="name-input">
			<TextInput
				setting={{
					type: "textInput",
					name: "Setting Name",
					value: controller.settingName,
					id: "",
					updateFunction: (val) => (controller.settingName = val),
				}}
				placeholder={controller.defaultName}
			/>
		</div>
		<IconButton icon="help" onClick={openTutorialOverlay} />
	</div>

	<button class="selector-chip" onclick={copySelector} use:hoverPreview={previewConfig} title="Copy selector">
		<Icon name="code" size={16} color="currentColor" />
		<span class="selector-text">{selector}</span>
		{#if previewStatus}<span class="preview-status">{previewStatus}</span>{/if}
		<Icon name={copied ? "check" : "content_copy"} size={14} color="currentColor" />
	</button>

	<div class="tabs-wrapper">
		<CapsuleTabs
			options={[
				{ id: "basic", label: "Basic" },
				{ id: "advanced", label: "Advanced" },
			]}
			bind:activeId={controller.activeTab}
		/>
	</div>

	<div class="modal-content">
		{#if controller.activeTab === "basic"}
			<SidebarScrollLayout
				attribute="data-group"
				bind:activeValue={controller.activeGroup}
				sidebarWidth={200}
				sidebarClass="styleshift-sidebar styleshift-scrollable"
				contentClass="quick-group-list"
			>
				{#snippet sidebar({ scrollTo, activeValue })}
					{#each controller.groups as group (group.id)}
						<SidebarNavItem
							category={{ icon: group.icon, label: group.label }}
							selected={activeValue === group.id}
							onSelect={() => scrollTo(group.id)}
						/>
					{/each}
				{/snippet}

				{#each controller.groups as group (group.id)}
					<SettingsGroup attrs={{ "data-group": group.id }}>
						<div class="group-header">
							<Icon name={group.icon} size={16} color="currentColor" />
							<span>{group.label}</span>
						</div>
						{#each controller.groupControls(group.id) as control (control.id)}
							<QuickControlRow
								ctrl={control}
								bind:value={controller.basicStyles[control.id]}
								bind:enabled={controller.enabledStyles[control.id]}
							/>
						{/each}
					</SettingsGroup>
				{/each}
			</SidebarScrollLayout>
		{:else}
			<div class="advanced-editor">
				{#if controller.isEditorLoading}
					<div class="editor-loading">
						<Icon name="sync" size={24} color="var(--fg-opacity-60)" />
						<span>Loading Code Editor...</span>
					</div>
				{/if}
				<CodeEditor
					value={controller.rawCss}
					language="css"
					height="100%"
					onInput={(val) => (controller.rawCss = val)}
				/>
			</div>
		{/if}
	</div>

	<div class="modal-footer">
		<span class="enabled-summary">
			{controller.enabledCount} on — {controller.enabledLabels || "nothing yet"}
		</span>
		<button class="btn-secondary" onclick={onClose}>Cancel</button>
		<button class="btn-primary" disabled={controller.enabledCount === 0} onclick={() => controller.handleSave()}>
			Save ({controller.enabledCount})
		</button>
	</div>
</div>

<style lang="scss">
	.styleshift-quick-customize-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.setting-name-header {
		padding: 15px 20px 0;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.name-input {
		flex: 1;
		min-width: 0;
	}

	.selector-chip {
		margin: 10px 20px 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 10px;
		border: 1px solid var(--fg-opacity-10);
		background: var(--fg-opacity-03);
		color: var(--text-primary);
		cursor: pointer;
		transition: background 0.2s ease;

		&:hover {
			background: var(--fg-opacity-05);
		}

		.selector-text {
			flex: 1;
			min-width: 0;
			font-family: "Fira Code", "JetBrains Mono", monospace;
			font-size: 12px;
			text-align: left;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.preview-status {
			flex-shrink: 0;
			font-size: 11px;
			color: var(--fg-opacity-60);
			white-space: nowrap;
		}
	}

	.tabs-wrapper {
		padding: 15px 20px;
		display: flex;
		justify-content: center;
	}

	.modal-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		border-radius: 12px;
		border: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
	}

	:global(.quick-group-list) {
		gap: 10px;
		padding: 12px;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 4px 8px;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--fg-opacity-60);
	}

	.advanced-editor {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.editor-loading {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: var(--bg-overlay-20);
		border-radius: 12px;
		color: var(--fg-opacity-60);

		:global(svg) {
			animation: spin 1.5s linear infinite;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.modal-footer {
		padding: 15px 20px;
		display: flex;
		align-items: center;
		gap: 12px;

		.enabled-summary {
			flex: 1;
			min-width: 0;
			font-size: 12px;
			color: var(--fg-opacity-60);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	button {
		padding: 10px 18px;
		border-radius: 12px;
		font-weight: 600;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

		&.btn-primary {
			background: var(--theme-0);
			color: white;
			border: none;
			box-shadow: 0 4px 12px var(--shadow-color);
			&:hover {
				filter: brightness(1.1);
				transform: translateY(-1px);
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
				filter: none;
				transform: none;
			}
		}

		&.btn-secondary {
			background: transparent;
			color: var(--fg-opacity-60);
			border: 1px solid var(--fg-opacity-20);
			&:hover {
				color: var(--text-primary);
				background: var(--fg-opacity-05);
			}
		}
	}
</style>
