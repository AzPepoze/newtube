<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		className = "",
		attrs = {},
		children,
	}: {
		className?: string;
		attrs?: Record<string, string>;
		children: Snippet;
	} = $props();
</script>

<div class="styleshift-settings-group {className}" {...attrs}>
	{@render children()}
</div>

<style lang="scss">
	.styleshift-settings-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
		background: var(--fg-opacity-05);
		border-radius: 20px;
		container: settings-group / inline-size;
	}
</style>
