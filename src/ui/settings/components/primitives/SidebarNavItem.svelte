<script lang="ts">
	import type { CategoryNameWithIcon } from "@settings/types/styleshiftTypes";
	import LeftTitle from "./LeftTitle.svelte";

	let {
		category,
		selected = false,
		isDeveloperMode = false,
		editable = false,
		onSelect = () => {},
		onMove = null,
		action = (() => {}) as (node: HTMLElement, arg: any) => void,
		actionArg = undefined,
		style = "",
	}: {
		category: string | CategoryNameWithIcon;
		selected?: boolean;
		isDeveloperMode?: boolean;
		editable?: boolean;
		onSelect?: () => void;
		onMove?: ((direction: "up" | "down") => void) | null;
		action?: (node: HTMLElement, arg: any) => void;
		actionArg?: any;
		style?: string;
	} = $props();
</script>

<button class="styleshift-sidebar-item-wrapper" {style} onclick={onSelect} use:action={actionArg}>
	<LeftTitle {category} {selected} {isDeveloperMode} {editable} {onMove} />
</button>

<style lang="scss">
	@keyframes sidebar-animation {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.styleshift-sidebar-item-wrapper {
		background: transparent;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
		width: 100%;
		display: block;
		animation: sidebar-animation 0.2s both;

		:global(.skip-animation) & {
			animation: none;
		}
	}
</style>
