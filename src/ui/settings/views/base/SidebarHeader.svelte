<script lang="ts">
	let {
		label,
		centered = false,
		delay = "0ms",
	}: {
		label: string;
		centered?: boolean;
		delay?: string;
	} = $props();
</script>

<div class="styleshift-sidebar-header" class:centered style:animation-delay={delay}>
	{label}
</div>

<style lang="scss">
	@keyframes sidebar-animation {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.styleshift-sidebar-header {
		padding: 12px 10px 8px;
		font-size: 14px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 700;
		margin-bottom: 4px;
		border-top: 2px solid var(--fg-opacity-10);
		animation: sidebar-animation 1s both;

		:global(.styleshift-main[data-theme="light"]) & {
			color: var(--text-primary);
		}

		&.centered {
			font-size: 18px;
			color: var(--text-muted);
			letter-spacing: 3px;
			font-weight: 900;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 15px;
			margin-top: 30px;
			margin-bottom: 15px;
			border-top: none;

			&::before,
			&::after {
				content: "";
				flex: 1;
				height: 1px;
				background: linear-gradient(to var(--direction), var(--fg-opacity-10), transparent);
			}

			&::before {
				--direction: left;
			}

			&::after {
				--direction: right;
			}
		}

		:global(.skip-animation) & {
			animation: none;
		}
	}

	.styleshift-sidebar-header:first-child {
		border-top: none;
		margin-top: 0;
	}
</style>
