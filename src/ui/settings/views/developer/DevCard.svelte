<script lang="ts">
	let { title, color = "#999999", children = undefined, collapsed = $bindable(true), onToggle = undefined } = $props();

	function handleToggle() {
		collapsed = !collapsed;
		onToggle?.(collapsed);
	}
</script>

<div class="styleshift-dev-card {collapsed ? 'collapsed' : ''}" style:--card-color={color}>
	<button class="styleshift-dev-card-header" onclick={handleToggle}>
		<span class="styleshift-dev-card-title">{title}</span>
		<div class="styleshift-dev-card-chevrons">
			<span class="styleshift-dev-card-chevron">{collapsed ? "▼" : "▲"}</span>
		</div>
	</button>

	<div class="styleshift-dev-card-content">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style lang="scss">
	.styleshift-dev-card {
		width: 100%;
		border-radius: 12px;
		margin-bottom: 16px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--fg-opacity-10);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		&.collapsed {
			.styleshift-dev-card-content {
				max-height: 0;
				padding: 0;
				opacity: 0;
				pointer-events: none;
			}
		}

		&:not(.collapsed) {
			background: rgba(255, 255, 255, 0.04);
			border-color: var(--card-color);
			box-shadow: 0 8px 30px var(--bg-overlay-40);
		}
	}

	.styleshift-dev-card-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		background: transparent;
		border: none;
		color: white;
		cursor: pointer;
		font-weight: 600;
		font-size: 14px;
		letter-spacing: 0.5px;
		text-align: left;
		transition: background 0.2s;

		&:hover {
			background: var(--fg-opacity-05);
		}
	}

	.styleshift-dev-card-title {
		border-left: 3px solid var(--card-color);
		padding-left: 12px;
		color: var(--fg-opacity-90);
	}

	.styleshift-dev-card-content {
		padding: 16px;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		gap: 16px;
		background: rgba(0, 0, 0, 0.15);
	}

	.styleshift-dev-card-chevron {
		font-size: 10px;
		opacity: 0.5;
		transition: transform 0.3s;
	}
</style>
