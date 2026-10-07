<div class="logo-halo">
	<img src="https://imgs-newtube.azpepoze.com/logo.png" alt="NewTube" />
</div>

<style lang="scss">
	.logo-halo {
		width: clamp(240px, 32vw, 380px);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: radial-gradient(circle, var(--theme-0-30), transparent 68%);
		animation: logoFloat 4s ease-in-out infinite;
	}

	img {
		width: 95%;
		height: 95%;
		object-fit: contain;
		filter: drop-shadow(0 18px 30px var(--theme-0-30));
	}

	@keyframes logoFloat {
		0%,
		100% {
			transform: translateY(0) rotate(-2deg);
		}
		50% {
			transform: translateY(-14px) rotate(2deg);
		}
	}

	@media (max-width: 760px) {
		.logo-halo {
			width: min(240px, 64vw);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.logo-halo {
			animation: none;
		}
	}
</style>
