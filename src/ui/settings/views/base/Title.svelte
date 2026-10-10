<script lang="ts">
	import Icon from "@base/Icon.svelte";
	import { getAddOnItems, removeCategory } from "@settings/registry/items";
	import { getCategoryLabel } from "@settings/registry/category";
	import { settingsUi } from "../../settingsApi";
	import { removeConfigUi, showConfigUi } from "@ui/window/config";
	import { showUserConfirmation } from "@ui/window/windowFactory";
	import { deactivateSetting } from "@settings/engine/functions";
	import { saveToStorage } from "@core/storage/manager";

	let {
		text,
		icon = "",
		subtitle = false,
		rainbow = false,
		className = "",
		leftSeparator = false,
		editable = false,
		isDeveloperMode = false,
	} = $props();

	async function handleEditCategory() {
		const addOnItems = getAddOnItems();
		const category = addOnItems.find((c) => getCategoryLabel(c) === text);

		if (category) {
			showConfigUi(async (parent: HTMLElement) => {
				settingsUi.configEditorRenderer(
					{
						setting: category as any,
						onClose: () => removeConfigUi(),
					},
					parent,
				);
			});
		}
	}

	async function handleRemoveCategory() {
		const addOnItems = getAddOnItems();
		const category = addOnItems.find((item) => getCategoryLabel(item) === text);
		if (!category) return;

		const confirmed = await showUserConfirmation(
			`Remove the category "${text}" and its ${category.settings.length} setting${category.settings.length === 1 ? "" : "s"}? This cannot be undone.`,
			"Remove Category",
			{
				confirmLabel: "Remove",
				confirmColor: "#f44336",
			},
		);
		if (!confirmed) return;

		for (const setting of category.settings) {
			if (setting.id) {
				await saveToStorage(setting.id, false, true);
				await deactivateSetting(setting.id);
			}
		}

		await removeCategory(category);
	}
</script>

{#if subtitle}
	<div class="styleshift-sub-title {className}" class:styleshift-left-separator={leftSeparator}>
		{#if editable}
			<div class="styleshift-group-drag drag-handle">
				<Icon name="drag" size={14} />
			</div>
		{/if}
		{@html text}
	</div>
{:else}
	<div class="styleshift-category-title {rainbow ? 'styleshift-category-title-rainbow' : ''} {className}">
		{#if icon}
			<span class="styleshift-category-title-icon">
				<Icon name={icon} size={24} color="black" />
			</span>
		{/if}
		{text}

		{#if editable}
			<div class="styleshift-category-actions">
				{#if isDeveloperMode}
					<button onclick={handleEditCategory} title="Edit Category">
						<Icon name="edit" size={16} color="black" />
					</button>
				{/if}
				<button onclick={handleRemoveCategory} title="Remove Category">
					<Icon name="delete" size={16} color="black" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.styleshift-category-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		position: relative;
		width: calc(100% - 6px);
		font-size: 20px;
		padding-block: 10px;
		font-weight: 600;
		background: var(--category-title-bg);
		color: black;
		text-align: center;
		border-radius: 20px;
		margin: 3px;
		margin-bottom: 10px;
		user-select: text;
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		box-shadow: 0 4px 15px var(--bg-overlay-10);

		&:hover,
		&:focus-within {
			.styleshift-category-actions {
				opacity: 1;
			}
		}
	}

	.styleshift-category-actions {
		position: absolute;
		right: 15px;
		display: flex;
		gap: 5px;
		opacity: 0;
		transition: all 0.2s;

		button {
			background: rgba(255, 255, 255, 0.3);
			border: none;
			border-radius: 50%;
			width: 30px;
			height: 30px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				background: rgba(255, 255, 255, 0.5);
				transform: scale(1.1);
			}
		}
	}

	@media (hover: none) {
		.styleshift-category-actions {
			opacity: 1;
		}
	}

	.styleshift-category-title-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.styleshift-sub-title {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 25px;
		margin-bottom: 15px;
		margin-inline: 10px;
		font-size: 16px;
		font-weight: 600;
		color: var(--fg-opacity-80);
		opacity: 0.9;
		position: relative;

		&.styleshift-left-separator {
			padding-left: 12px;
			&::before {
				content: "";
				position: absolute;
				left: 0;
				top: 2px;
				bottom: 2px;
				width: 4px;
				background: var(--theme-0);
				border-radius: 4px;
				box-shadow: 0 0 10px var(--theme-0);
			}
		}
	}

	.styleshift-group-drag {
		cursor: grab;
		opacity: 0;
		transition: opacity 0.2s;
		color: var(--fg-opacity-40);

		&:hover {
			color: var(--fg-opacity-100);
		}

		:global(.styleshift-sub-title:hover) & {
			opacity: 1;
		}
	}

	:global(.styleshift-main[data-theme="light"]) .styleshift-category-title {
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.styleshift-main[data-theme="light"]) .styleshift-category-title-rainbow::before {
		display: none;
	}

	.styleshift-category-title-rainbow {
		&::before {
			z-index: -1;
			width: 100%;
			height: 100%;
			position: absolute;
			top: -3px;
			left: -3px;
			content: "";
			border-radius: 20px;
			padding: 3px;

			background: linear-gradient(
					45deg,
					rgb(255, 0, 0),
					rgb(255, 115, 0),
					rgb(255, 251, 0),
					rgb(72, 255, 0),
					rgb(0, 255, 213),
					rgb(0, 43, 255),
					rgb(122, 0, 255),
					rgb(255, 0, 200),
					rgb(255, 0, 0)
				)
				0% 0% / 400%;
			animation: 20s styleshift-slide-rainbow linear infinite;
		}
	}

	@keyframes styleshift-slide-rainbow {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 400% 50%;
		}
	}
</style>
