<script lang="ts">
	let {
		padding = true,
		vertical = true,
		centerX = false,
		centerY = false,
		transparent = false,
		children = undefined,
		className = "",
		style = "",
	} = $props();
</script>

<div
	class="styleshift-setting-frame {className}"
	style:padding={padding ? "" : "0px"}
	style:flex-direction={vertical ? "column" : "row"}
	style:justify-content={centerX ? "center" : ""}
	style:align-items={centerY ? "center" : ""}
	style:background={transparent ? "transparent" : ""}
	{style}
>
	{@render children?.()}
</div>

<style lang="scss">
	.styleshift-setting-frame {
		display: flex;
		transition: all 0.3s;
	}
</style>
