<script lang="ts">
	import type { LayoutNode } from "../types";
	import { describeNode } from "../viewer/nodeLabel";
	import { fitScale, flattenBoxes, type PreviewBox } from "../viewer/layoutScale";

	let { name, root }: { name: string; root: LayoutNode } = $props();

	let stageWidth = $state(0);
	let hoveredNode = $state<LayoutNode | null>(null);
	let selectedNode = $state<LayoutNode | null>(null);

	const scale = $derived(root.rect ? fitScale(root.rect, stageWidth) : 1);
	const boxes = $derived(flattenBoxes(root, scale));
	const stageHeight = $derived(root.rect ? root.rect.height * scale : 0);
	const focusNode = $derived(hoveredNode ?? selectedNode);

	function boxStyle(box: PreviewBox): string {
		return `left: ${box.left}px; top: ${box.top}px; width: ${box.width}px; height: ${box.height}px; z-index: ${box.depth};`;
	}

	function describeRect(node: LayoutNode): string {
		if (!node.rect) return "no geometry";
		const { x, y, width, height } = node.rect;
		return `${width} x ${height} at ${x}, ${y}`;
	}

	function isSelected(box: PreviewBox): boolean {
		return box.node === selectedNode;
	}
</script>

{#if root.rect}
	<div class="preview">
		<p class="focus">
			{#if focusNode}
				<span class="tag">{describeNode(focusNode)}</span>
				<span class="meta">{describeRect(focusNode)}</span>
			{:else}
				<span class="meta">Hover or click a box</span>
			{/if}
		</p>

		<div class="scroll" role="region" aria-label="{name} preview" bind:clientWidth={stageWidth}>
			<div class="stage" style="width: {stageWidth}px; height: {stageHeight}px;">
				{#each boxes as box (box.node)}
					<button
						type="button"
						class="box"
						class:selected={isSelected(box)}
						style={boxStyle(box)}
						title={describeNode(box.node)}
						aria-label={describeNode(box.node)}
						onmouseenter={() => (hoveredNode = box.node)}
						onmouseleave={() => (hoveredNode = null)}
						onclick={() => (selectedNode = box.node)}
					></button>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<p class="empty">This region has no geometry.</p>
{/if}

<style>
	.preview {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.focus {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0;
		font:
			13px ui-monospace,
			monospace;
		overflow-wrap: anywhere;
	}

	.meta {
		color: var(--font-color-dim);
	}

	.tag {
		color: var(--theme-0-text);
	}

	.scroll {
		max-width: 100%;
		overflow-x: auto;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		background: var(--bg-surface);
	}

	.stage {
		position: relative;
	}

	.box {
		position: absolute;
		box-sizing: border-box;
		padding: 0;
		border: 1px solid var(--theme-0-50);
		background: var(--theme-0-10);
		cursor: pointer;
	}

	.box:hover {
		border-color: var(--theme-0-light);
		background: var(--theme-0-20);
	}

	.box.selected {
		border: 2px solid var(--theme-0);
		background: var(--theme-0-30);
	}

	.empty {
		margin: 0;
		color: var(--font-color-dim);
	}
</style>
