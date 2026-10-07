<script lang="ts">
	import Button from "../controls/Button.svelte";

	let { buttonName, color, collapsed = $bindable(true), contentEl } = $props();

	function toggle() {
		collapsed = !collapsed;
	}

	function mountContent(node: HTMLElement) {
		if (contentEl) {
			node.appendChild(contentEl);
		}
	}
</script>

<div class="styleshift-collapse-wrapper">
	<Button
		setting={{
			type: "button",
			name: buttonName,
			color: color,
			clickFunction: toggle,
		}}
	/>
	<div
		use:mountContent
		class="styleshift-collapse styleshift-collapse-content styleshift-all-transition"
		class:collapsed
	></div>
</div>

<style lang="scss">
	.styleshift-collapse-content {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
		max-height: 2000px;
		opacity: 1;

		&.collapsed {
			max-height: 0px !important;
			padding: 0px !important;
			opacity: 0 !important;
			margin-top: -10px !important;
			pointer-events: none !important;
		}
	}
</style>
