<script lang="ts">
	import { createSettingPreset, isSettingKind } from "@settings/registry/defaultItems";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import * as mainSettingUi from "../../controls";
	import { catalogGroups, kindDescriptions, kindGroups } from "../../settingCatalog";
	import { settingsUi } from "../../settingsApi";
	import Search from "../base/Search.svelte";

	let { onPick }: { onPick: (kind: string) => void } = $props();

	const kinds = Object.keys(mainSettingUi).filter((key) => isSettingKind(key));

	let query = $state("");
	let activeGroup = $state("all");

	function matches(kind: string) {
		const groupOk = activeGroup === "all" || kindGroups[kind] === activeGroup;
		const text = `${kind} ${kindDescriptions[kind] ?? ""}`.toLowerCase();
		return groupOk && text.includes(query.trim().toLowerCase());
	}

	const visibleCount = $derived(kinds.filter(matches).length);

	function mountPreview(node: HTMLElement, kind: string) {
		const preview = { ...createSettingPreset(kind as any), id: `catalog-preview-${kind}` };
		node.append(settingsUi.renderSetting(preview as any, undefined));
	}
</script>

<div class="styleshift-setting-catalog">
	<div class="catalog-toolbar">
		<Search bind:value={query} />
		<CapsuleTabs options={catalogGroups} bind:activeId={activeGroup} />
	</div>

	<div class="catalog-grid">
		{#each kinds as kind, index (kind)}
			<div
				class="catalog-card"
				style:--index={index}
				class:is-hidden={!matches(kind)}
				role="button"
				tabindex="0"
				onclick={() => onPick(kind)}
				onkeydown={(event) => event.key === "Enter" && onPick(kind)}
			>
				<div class="catalog-preview" inert>
					<div class="catalog-stage" use:mountPreview={kind}></div>
				</div>
				<div class="catalog-meta">
					<span class="catalog-name">{kind}</span>
					<span class="catalog-desc">{kindDescriptions[kind] ?? ""}</span>
				</div>
			</div>
		{/each}

		{#if visibleCount === 0}
			<p class="catalog-empty">No types match your search.</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.styleshift-setting-catalog {
		display: flex;
		flex-direction: column;
		gap: 14px;
		height: 100%;
		padding: 16px;
		box-sizing: border-box;
		color: var(--font-color);
	}

	.catalog-toolbar {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.catalog-grid {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
		grid-auto-rows: max-content;
		align-content: start;
		align-items: start;
	}

	.catalog-card {
		min-height: 280px;
		animation: card-in 0.3s ease backwards;
		animation-delay: calc(var(--index, 0) * 30ms);
		display: flex;
		flex-direction: column;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		overflow: hidden;
		cursor: pointer;
		transition:
			border-color 0.2s,
			transform 0.2s;

		&:hover,
		&:focus-visible {
			border-color: var(--fg-opacity-20);
			outline: none;
			transform: translateY(-2px);
		}

		&.is-hidden {
			display: none;
		}
	}

	.catalog-preview {
		flex-shrink: 0;
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px;
		border-bottom: 1px solid var(--border-color);
		pointer-events: none;
		user-select: none;
	}

	.catalog-stage {
		width: 100%;
		min-width: 236px;
		overflow-wrap: anywhere;
	}

	.catalog-meta {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 12px 12px;
	}

	.catalog-name {
		font-family: "Fira Code", monospace;
		font-size: 13px;
		font-weight: 600;
	}

	.catalog-desc {
		font-size: 12px;
		line-height: 1.4;
		color: var(--font-color-dim);
	}

	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.catalog-card {
			animation: none;
			transition: none;
		}
	}

	.catalog-empty {
		grid-column: 1 / -1;
		margin: 0;
		padding: 32px 0;
		text-align: center;
		font-size: 13px;
		color: var(--font-color-dim);
	}
</style>
