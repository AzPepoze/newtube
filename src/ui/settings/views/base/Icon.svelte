<script lang="ts">
	const edit = "assets/icons/edit.svg";
	const del = "assets/icons/delete.svg";
	const drag = "assets/icons/drag.svg";
	const add = "assets/icons/add.svg";
	const arrowUp = "assets/icons/arrowUp.svg";
	const arrowDown = "assets/icons/arrowDown.svg";
	const exportIcon = "assets/icons/export.svg";
	const openInNew = "assets/icons/openInNew.svg";

	import { getAssetUrl } from "@ui/window/utils";

	const icons: Record<string, string> = {
		edit,
		delete: del,
		drag,
		add,
		arrowUp,
		arrowDown,
		export: exportIcon,
		openInNew: openInNew,
	};

	let {
		name = "",
		className = "",
		style = "",
		color = "",
		applyFilter = true,
		size = 20,
		scale = 1,
	}: {
		name: string;
		className?: string;
		style?: string;
		color?: string;
		applyFilter?: boolean;
		size?: number;
		scale?: number;
	} = $props();

	const isImageFile = $derived(
		typeof name === "string" &&
			(name.endsWith(".png") ||
				name.endsWith(".jpg") ||
				name.endsWith(".jpeg") ||
				name.endsWith(".webp") ||
				name.endsWith(".svg") ||
				name.endsWith(".gif") ||
				name.startsWith("icon/") ||
				name.startsWith("assets/")),
	);
	const isUrl = $derived(name.includes("://") || name.startsWith("data:") || isImageFile);
	const iconPath = $derived(icons[name]);
	const src = $derived(iconPath ? getAssetUrl(iconPath) : isUrl ? getAssetUrl(name) : "");
	const isMaterialIcon = $derived(!iconPath && !isUrl && typeof name === "string" && /^[a-z_0-9]+$/.test(name));
	const isEmoji = $derived(!iconPath && !isUrl && !isMaterialIcon && name.length > 0);
</script>

{#if src}
	<img
		{src}
		alt={name}
		class="styleshift-icon {className}"
		class:with-filter={applyFilter && !color && !isImageFile}
		style="transform: scale({Math.min(scale, 2)}); width: {size}px; height: {size}px; {color
			? `filter: none;`
			: ''}{style}"
		style:color={color || undefined}
	/>
{:else if isMaterialIcon}
	<i
		class="material-icons notranslate styleshift-icon styleshift-material-icon {className}"
		translate="no"
		style="font-size: {size}px; line-height: {size}px; width: {size}px; height: {size}px; {style}"
		style:color={color || undefined}
	>
		{name}
	</i>
{:else if isEmoji}
	<span
		class="styleshift-icon styleshift-text-icon notranslate {className}"
		translate="no"
		style="font-size: {size}px; line-height: {size}px; width: {size}px; height: {size}px; {style}"
	>
		{name}
	</span>
{/if}

<style lang="scss">
	.styleshift-icon {
		display: inline-block;
		vertical-align: middle;
		pointer-events: none;
		object-fit: contain;
		border-radius: 5px;

		&.with-filter {
			filter: brightness(0) invert(1);
		}
	}

	.styleshift-text-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-style: normal;
	}

	.styleshift-material-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-style: normal;
		font-weight: normal;
		font-family: "Material Icons" !important;
		font-size: inherit;
		font-feature-settings: "liga" 1;
		line-height: 1;
		text-transform: none;
		letter-spacing: normal;
		word-wrap: normal;
		white-space: nowrap;
		direction: ltr;
	}
</style>
