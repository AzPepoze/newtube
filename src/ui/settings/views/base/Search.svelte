<script lang="ts">
	import Icon from "./Icon.svelte";

	let {
		value = $bindable(""),
		placeholder = "Search",
		onInput = () => {},
	}: {
		value?: string;
		placeholder?: string;
		onInput?: (val: string) => void;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let isFocused = $state(false);

	function handleInput() {
		onInput(value);
	}

	function clearSearch() {
		value = "";
		onInput("");
		inputEl?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			clearSearch();
		}
	}

	// Focus shortcut listener
	$effect(() => {
		function onGlobalKeyDown(e: KeyboardEvent) {
			if (
				e.key === "/" &&
				document.activeElement?.tagName !== "INPUT" &&
				document.activeElement?.tagName !== "TEXTAREA"
			) {
				e.preventDefault();
				inputEl?.focus();
			}
		}
		window.addEventListener("keydown", onGlobalKeyDown);
		return () => window.removeEventListener("keydown", onGlobalKeyDown);
	});
</script>

<div class="styleshift-search-wrapper" class:is-focused={isFocused}>
	<div class="styleshift-search-prefix">
		<Icon name="search" size={18} className="styleshift-search-icon" />
	</div>

	<input
		bind:this={inputEl}
		type="text"
		class="styleshift-search-input"
		{placeholder}
		bind:value
		oninput={handleInput}
		onkeydown={handleKeydown}
		onfocus={() => (isFocused = true)}
		onblur={() => (isFocused = false)}
	/>

	{#if value}
		<button class="styleshift-search-clear-button" onclick={clearSearch} title="Clear search">
			<Icon name="close" size={16} />
		</button>
	{/if}
</div>

<style lang="scss">
	.styleshift-search-wrapper {
		position: relative;
		width: 100%;
		display: flex;
		align-items: center;
		background: var(--fg-opacity-08);
		border-radius: 12px;
		padding: 2px 12px;
		box-sizing: border-box;
		margin-top: 3px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid var(--border-color);

		&:hover {
			background: var(--fg-opacity-10);
			border-color: var(--fg-opacity-20);
		}

		&.is-focused {
			background: var(--fg-opacity-15);
			border-color: var(--theme-0);
			box-shadow: 0 0 0 3px var(--theme-0-20);
		}
	}

	.styleshift-search-prefix {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 10px;
		opacity: 0.6;
		transition: color 0.2s ease;
	}

	.styleshift-search-input {
		background: transparent;
		border: none;
		outline: none;
		color: var(--font-color);
		font-size: 15px;
		width: 100%;
		padding: 8px 0;
		font-family: inherit;

		&::placeholder {
			color: var(--font-color-dim);
			opacity: 0.5;
		}
	}

	.styleshift-search-clear-button {
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 50%;
		color: var(--font-color-dim);
		transition: all 0.2s ease;
		margin-left: 8px;

		&:hover {
			background: var(--fg-opacity-10);
			color: var(--font-color);
		}
	}
</style>
