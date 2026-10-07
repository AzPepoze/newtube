<script lang="ts">
	let {
		accept = "",
		onFileSelect,
		children,
	}: {
		accept?: string;
		onFileSelect: (file: File) => void;
		children?: import("svelte").Snippet;
	} = $props();

	let inputRef: HTMLInputElement;

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			onFileSelect(file);
			target.value = "";
		}
	}

	function triggerClick() {
		inputRef.click();
	}
</script>

<button class="styleshift-file-button" onclick={triggerClick}>
	{#if children}
		{@render children()}
	{:else}
		Choose File
	{/if}
</button>
<input bind:this={inputRef} type="file" {accept} onchange={handleChange} style="display: none;" />

<style lang="scss">
	.styleshift-file-button {
		background: var(--fg-opacity-10);
		border: 1px solid var(--fg-opacity-20);
		border-radius: 8px;
		padding: 6px 12px;
		color: var(--font-color, white);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 14px;
		margin: 5px 0;

		&:hover {
			background: var(--fg-opacity-20);
			border-color: var(--theme-0, #7f5db7);
		}

		&:active {
			transform: scale(0.98);
		}
	}
</style>
