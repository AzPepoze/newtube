<script lang="ts">
	import { localStorageUtil } from "@core/shared/localStorage";
	import Window from "@ui/window/views/Window.svelte";
	import { untrack } from "svelte";
	import FlyoutCanvas from "./FlyoutCanvas.svelte";

	let {
		onClose = () => {},
		initialPos,
		disableBackdropFilter = false,
	}: {
		onClose?: () => void;
		initialPos?: any;
		disableBackdropFilter?: boolean;
	} = $props();

	const DEFAULT_WIDTH = 420;
	const DEFAULT_HEIGHT = 236;
	const MARGIN = 20;

	let pos = $state<{
		translate?: string;
		width?: string;
		height?: string;
	}>(
		untrack(() => initialPos) ?? {
			width: `${DEFAULT_WIDTH}px`,
			height: `${DEFAULT_HEIGHT}px`,
			translate: `${window.innerWidth - DEFAULT_WIDTH - MARGIN}px ${window.innerHeight - DEFAULT_HEIGHT - MARGIN}px`,
		},
	);

	function handlePositionChange(newPos: any) {
		const filteredPos = {
			translate: newPos.translate,
			width: newPos.width,
			height: newPos.height,
		};
		pos = filteredPos;
		localStorageUtil.set("flyoutPosition", filteredPos);
	}
</script>

<Window
	title="Flyout Player"
	onPositionChange={handlePositionChange}
	width={pos.width}
	height={pos.height}
	translate={pos.translate}
	mini={true}
	aspectRatio={16 / 9}
	autoHideTopbar={true}
	noPadding={true}
	minVisibleRatio={0.4}
	{disableBackdropFilter}
	{onClose}
>
	<FlyoutCanvas />
</Window>

<style lang="scss">
</style>
