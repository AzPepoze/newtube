<script lang="ts">
	import { getJustifyContent } from "../../utils";

	let {
		html = "",
		text = "",
		fontSize = 14,
		textAlign = "start",
		color = "inherit",
		id = "",
		className = "",
	} = $props();

	const justifyContent = $derived(getJustifyContent(textAlign));
</script>

<div
	{id}
	class="styleshift-text {className}"
	style:font-size="{fontSize}px"
	style:text-align={textAlign}
	style:justify-content={justifyContent}
	style:color
>
	{#if html}
		{@html html}
	{:else}
		{text}
	{/if}
</div>

<style lang="scss">
	.styleshift-text {
		width: 100%;
		transition: all 0.2s ease;
		line-height: 1.5;
		display: flex;
		align-items: center;
	}
</style>
