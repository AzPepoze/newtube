<script lang="ts">
	let {
		id = "",
		type = "",
		vertical = false,
		clickable = false,
		padding = true,
		transparent = false,
		children,
		onClick = undefined,
		onKeyDown = undefined,
		role: roleProp = undefined,
		tabindex: tabindexProp = undefined,
		style = "",
		useAction = undefined,
		className = "",
	}: {
		id?: string;
		type?: string;
		vertical?: boolean;
		clickable?: boolean;
		padding?: boolean;
		transparent?: boolean;
		children: any;
		onClick?: (event: MouseEvent) => void;
		onKeyDown?: (event: KeyboardEvent) => void;
		role?: string;
		tabindex?: number;
		style?: string;
		useAction?: (node: HTMLElement) => any;
		className?: string;
	} = $props();

	const isButton = $derived(clickable);
	const role = $derived(roleProp ?? (isButton ? "button" : tabindexProp !== undefined ? "region" : undefined));
	const tabindex = $derived(tabindexProp ?? (isButton ? 0 : undefined));

	function handleKeyDown(e: KeyboardEvent) {
		if (onKeyDown) {
			onKeyDown(e);
		} else if (isButton && (e.key === "Enter" || e.key === " ")) {
			e.preventDefault();
			onClick?.(e as any);
		}
	}

	function applyAction(node: HTMLElement) {
		if (useAction) return useAction(node);
	}
</script>

<svelte:element
	this={isButton ? "button" : "div"}
	type={isButton ? "button" : undefined}
	class="styleshift-setting-frame {className}"
	class:vertical
	class:clickable
	class:no-padding={!padding}
	class:transparent
	{id}
	{role}
	{tabindex}
	{style}
	data-settingtype={type}
	onclick={onClick}
	onkeydown={handleKeyDown}
	use:applyAction
>
	{@render children()}
</svelte:element>

<style lang="scss">
	.styleshift-setting-frame {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 20px;
		gap: 10px;
		width: -webkit-fill-available;
		transition: all 0.3s;
		border-radius: 20px;
		position: relative;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: default;

		&.no-padding {
			padding: 0;
		}

		&.transparent {
			background: transparent !important;
			border: none !important;
		}

		&.vertical {
			flex-direction: column;
			align-items: stretch;
		}

		&.clickable {
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				filter: brightness(1.5) drop-shadow(2px 2px 3px black) drop-shadow(-2px -2px 3px var(--fg-opacity-40));
			}

			&:active {
				transform: scale(0.98);
			}
		}
	}
</style>
