<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		ringLauncher = false,
		pressLauncher = false,
		pickMode = false,
		hoverCard = -1,
		dimCard = -1,
		children,
	}: {
		ringLauncher?: boolean;
		pressLauncher?: boolean;
		pickMode?: boolean;
		hoverCard?: number;
		dimCard?: number;
		children?: Snippet;
	} = $props();

	const cardIndexes = [0, 1, 2];
</script>

<div class="scene">
	<header class="masthead" class:pick={pickMode}>
		<span class="logo"></span>
		<span class="search"></span>
		<span class="end">
			<span class="end-dot"></span>
			<span class="end-dot"></span>
			<span class="launcher-slot">
				<span class="launcher-ring" class:shown={ringLauncher}></span>
				<span class="launcher" class:pressed={pressLauncher}>✦</span>
			</span>
		</span>
	</header>

	<div class="grid">
		{#each cardIndexes as index (index)}
			<div class="card" class:pick={pickMode} class:hover={hoverCard === index}>
				<span class="thumb">
					<span class="shade" class:dimmed={dimCard === index}></span>
				</span>
				<span class="line"></span>
				<span class="line short"></span>
			</div>
		{/each}
	</div>

	{@render children?.()}
</div>

<style lang="scss">
	.scene {
		position: absolute;
		inset: 16px 16px 48px;
		border-radius: 14px;
		border: 1px solid var(--fg-opacity-10);
		background: #181818;
		overflow: hidden;
		color: #f1f1f1;
		font-size: 12px;
	}

	.masthead {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 52px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 12px;
		background: #202020;
		border-bottom: 1px solid #2a2a2a;
		transition: box-shadow 400ms ease;

		&.pick {
			outline: 2px dashed var(--accent);
			outline-offset: -4px;
		}
	}

	.logo {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		background: #e5e5e5;
	}

	.search {
		flex: 1;
		height: 26px;
		border-radius: 999px;
		background: #121212;
		border: 1px solid #2f2f2f;
	}

	.end {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.end-dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #303030;
	}

	.launcher-slot {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50px;
		height: 40px;
	}

	.launcher {
		font-size: 20px;
		color: #f1f1f1;
		transition: transform 200ms ease;

		&.pressed {
			transform: scale(0.85);
		}
	}

	.launcher-ring {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 46px;
		height: 46px;
		margin: -23px 0 0 -23px;
		border-radius: 50%;
		border: 2px solid var(--accent);
		opacity: 0;
		transform: scale(0.9);
		transition: opacity 400ms ease;

		&.shown {
			opacity: 1;
			animation: ring-pulse 1.8s ease-in-out infinite;
		}
	}

	.grid {
		position: absolute;
		top: 68px;
		left: 4%;
		right: 4%;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-radius: 10px;
		transition: outline-color 400ms ease;

		&.pick {
			outline: 2px dashed var(--accent);
			outline-offset: 5px;
		}

		&.hover {
			outline: 3px solid var(--accent);
			outline-offset: 5px;
		}
	}

	.thumb {
		position: relative;
		height: 120px;
		border-radius: 10px;
		background: linear-gradient(135deg, #2c2c2c, #3a3a3a);
		overflow: hidden;
	}

	.shade {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		opacity: 0;
		transition: opacity 500ms ease;

		&.dimmed {
			opacity: 1;
		}
	}

	.line {
		height: 7px;
		border-radius: 4px;
		background: #333;

		&.short {
			width: 60%;
		}
	}

	@keyframes ring-pulse {
		0%,
		100% {
			transform: scale(0.92);
		}
		50% {
			transform: scale(1.06);
		}
	}
</style>
