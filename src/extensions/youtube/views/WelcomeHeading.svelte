<script lang="ts">
	let {
		text,
		level = "h2",
		variant = "standard",
	}: {
		text: string;
		level?: "h1" | "h2";
		variant?: "main" | "standard";
	} = $props();
</script>

<svelte:element this={level} class:main={variant === "main"} aria-label={text}>
	{#each text.split("") as char, index (index)}
		<span class="wave-char" style:animation-delay={`${index * 50}ms`}>{char === " " ? "\u00A0" : char}</span>
	{/each}
</svelte:element>

<style lang="scss">
	h1,
	h2 {
		display: flex;
		flex-wrap: nowrap;
		margin: 0;
		white-space: nowrap;
		font-size: clamp(30px, 3.5vw, 42px);
		font-weight: 900;
		line-height: 1.02;
		letter-spacing: -0.04em;
	}

	.main {
		font-size: clamp(36px, 4vw, 52px);
	}

	.wave-char {
		display: inline-block;
		animation: textWave 2s infinite ease-in-out;
	}

	@keyframes textWave {
		0%,
		100% {
			transform: translateY(0);
			text-shadow: 0 0 10px var(--fg-opacity-30);
		}
		50% {
			transform: translateY(-8px);
			text-shadow: 0 0 20px var(--theme-0-50);
		}
	}

	@media (max-width: 760px) {
		h1,
		h2 {
			font-size: clamp(22px, 6.2vw, 38px);
		}

		.main {
			font-size: clamp(26px, 7.5vw, 42px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wave-char {
			animation: none;
		}
	}
</style>
