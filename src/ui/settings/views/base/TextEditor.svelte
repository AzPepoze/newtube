<script lang="ts">
	interface Props {
		value?: string;
		onInput?: (value: string) => void;
		onBlur?: (value: string) => void;
		className?: string;
		placeholder?: string;
	}

	let { value = $bindable(""), onInput, onBlur, className = "", placeholder = "" }: Props = $props();
</script>

<textarea
	class="styleshift-text-editor {className}"
	bind:value
	{placeholder}
	oninput={() => onInput?.(value)}
	onblur={() => onBlur?.(value)}
></textarea>

<style lang="scss">
	.styleshift-text-editor {
		width: 100%;
		box-sizing: border-box;
		min-height: 100px;
		background: var(--fg-opacity-05);
		border: 1px solid var(--fg-opacity-10);
		color: white;
		border-radius: 8px;
		padding: 10px;
		font-family: "Fira Code", monospace;
		resize: vertical;
		outline: none;
		transition: border-color 0.2s;

		&:focus {
			border-color: var(--theme-color, var(--theme-0));
		}
	}
</style>
