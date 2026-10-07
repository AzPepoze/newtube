<script lang="ts">
	let { size = 20 } = $props();
</script>

<div class="styleshift-space" style:min-height="{size}px"></div>

<style lang="scss">
	.styleshift-space {
		width: 100%;
	}
</style>
