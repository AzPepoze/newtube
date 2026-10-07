<script lang="ts">
	import Description from "@base/Description.svelte";
	let { text, align = "left" }: { text: string; align?: "left" | "center" | "right" } = $props();
</script>

<Description {text} {align} style="color: var(--font-color, white);" />
