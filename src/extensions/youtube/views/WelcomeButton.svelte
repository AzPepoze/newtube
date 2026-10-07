<script lang="ts">
	import { getAssetUrl } from "@ui/window/utils";

	let {
		label,
		onClick,
		variant = "default",
		withMemes = false,
	}: {
		label: string;
		onClick: () => void;
		variant?: "default" | "highlight" | "secondary";
		withMemes?: boolean;
	} = $props();
</script>

<div class="button-wrap" class:compact={!withMemes}>
	{#if withMemes}<img src={getAssetUrl("welcome/kokoro.gif")} alt="" class="side-meme left" />{/if}
	<button class:highlight={variant === "highlight"} class:secondary={variant === "secondary"} onclick={onClick}>
		{label}
	</button>
	{#if withMemes}<img src={getAssetUrl("welcome/kokoro.gif")} alt="" class="side-meme" />{/if}
</div>

<style lang="scss">
	.button-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	button {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		min-width: 180px;
		border: 1px solid var(--fg-opacity-50);
		border-radius: 24px;
		padding: 18px 38px;
		color: #111;
		background: var(--fg-opacity-95);
		box-shadow: 0 12px 35px var(--bg-overlay-50);
		font: inherit;
		font-size: 18px;
		font-weight: 850;
		cursor: pointer;
		animation: buttonIdle 3.2s ease-in-out infinite;
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease,
			background 0.25s ease;
	}

	button::before {
		content: "";
		position: absolute;
		inset: -100% -45%;
		z-index: -1;
		background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.75) 50%, transparent 65%);
		transform: translateX(-70%) rotate(8deg);
		animation: shimmer 3.5s ease-in-out infinite;
	}

	button.highlight {
		color: white;
		border-color: var(--theme-0-Light);
		background: var(--theme-0);
		box-shadow: 0 15px 42px var(--theme-0-40);
	}

	button.secondary {
		color: var(--font-color);
		border-color: var(--fg-opacity-15);
		background: var(--fg-opacity-05);
	}

	button:hover {
		transform: translateY(-8px) scale(1.07);
		background: white;
		box-shadow:
			0 22px 55px var(--fg-opacity-15),
			0 0 28px var(--theme-0-40);
		animation-play-state: paused;
	}

	button.highlight:hover {
		background: var(--theme-0-Light);
	}
	button.secondary:hover {
		color: white;
		background: var(--fg-opacity-12);
	}
	button:active {
		transform: translateY(-1px) scale(0.94);
		transition-duration: 0.08s;
	}
	button:focus-visible {
		outline: 3px solid var(--theme-0-Light);
		outline-offset: 5px;
	}

	.side-meme {
		width: clamp(64px, 8vw, 100px);
		object-fit: contain;
		filter: drop-shadow(0 0 18px var(--theme-0-40));
		animation: memeBounce 2.4s ease-in-out infinite;
	}
	.side-meme.left {
		transform: scaleX(-1);
		animation-name: memeBounceLeft;
	}

	@keyframes buttonIdle {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}
	@keyframes shimmer {
		0%,
		35% {
			transform: translateX(-70%) rotate(8deg);
		}
		70%,
		100% {
			transform: translateX(70%) rotate(8deg);
		}
	}
	@keyframes memeBounce {
		0%,
		100% {
			transform: translateY(0) rotate(3deg);
		}
		50% {
			transform: translateY(-14px) rotate(-3deg);
		}
	}
	@keyframes memeBounceLeft {
		0%,
		100% {
			transform: scaleX(-1) translateY(0) rotate(3deg);
		}
		50% {
			transform: scaleX(-1) translateY(-14px) rotate(-3deg);
		}
	}

	@media (max-width: 760px) {
		.button-wrap {
			gap: 4px;
		}
		button {
			padding: 15px 28px;
		}
		.side-meme {
			width: 62px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		button,
		button::before,
		.side-meme {
			animation: none;
		}
		button {
			transition-duration: 0.12s;
		}
		button:hover {
			transform: translateY(-3px);
		}
		button:active {
			transform: scale(0.96);
		}
	}
</style>
