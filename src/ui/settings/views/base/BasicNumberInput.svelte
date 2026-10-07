<script lang="ts">
	let {
		value = $bindable(0),
		onInput,
	}: {
		value?: number;
		onInput?: (val: number) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const val = parseFloat(target.value);
		value = isNaN(val) ? 0 : val;
		onInput?.(value);
	}
</script>

<input type="number" {value} oninput={handleInput} class="styleshift-number-input" />

<style lang="scss">
	.styleshift-number-input {
		width: 60px;
		height: 24px;
		background: var(--fg-opacity-10);
		color: var(--font-color, white);
		border: 1px solid var(--fg-opacity-20);
		border-radius: 5px;
		padding: 0 8px;
		text-align: center;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		outline: none;

		&:focus {
			border-color: var(--theme-0, #7f5db7);
			box-shadow: 0 0 5px var(--theme-0, #7f5db7);
		}

		&::-webkit-inner-spin-button,
		&::-webkit-outer-spin-button {
			opacity: 0.5;
		}
	}
</style>
