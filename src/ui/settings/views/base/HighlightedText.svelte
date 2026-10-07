<script lang="ts">
	let {
		text = "",
		query = "",
	}: {
		text?: string;
		query?: string;
	} = $props();

	const parts = $derived.by(() => {
		const trimmedQuery = query.trim();
		if (!trimmedQuery) return [{ text, isMatch: false }];

		const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(escapedQuery, "gi");
		const result: { text: string; isMatch: boolean }[] = [];
		let lastIndex = 0;

		for (const match of text.matchAll(regex)) {
			const index = match.index ?? 0;
			if (index > lastIndex) result.push({ text: text.slice(lastIndex, index), isMatch: false });
			result.push({ text: match[0], isMatch: true });
			lastIndex = index + match[0].length;
		}

		if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), isMatch: false });
		return result;
	});
</script>

<span>
	{#each parts as part, index (index)}
		{#if part.isMatch}
			<mark>{part.text}</mark>
		{:else}
			{part.text}
		{/if}
	{/each}
</span>

<style lang="scss">
	mark {
		background: var(--theme-0);
		color: white;
		border-radius: 2px;
	}
</style>
