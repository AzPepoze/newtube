<script lang="ts">
	import { getAssetUrl } from "@ui/window/utils";
</script>

<div class="preview-youtube">
	<div class="preview-nav">
		<div class="preview-logo"></div>
		<div class="preview-search"></div>
		<div class="preview-avatar"></div>
	</div>
	<div class="preview-body">
		<div class="preview-main">
			<div class="preview-player">
				<img src={getAssetUrl("icon/128.png")} alt="NewTube" class="preview-newtube-icon" />
			</div>
			<div class="preview-title"></div>
			<div class="preview-channel-row">
				<div class="preview-channel-avatar"></div>
				<div class="preview-channel-info">
					<div class="preview-channel-name"></div>
					<div class="preview-channel-sub"></div>
				</div>
				<div class="preview-subscribe"></div>
			</div>
		</div>
		<div class="preview-sidebar">
			<div class="preview-thumb"></div>
			<div class="preview-thumb"></div>
			<div class="preview-thumb"></div>
		</div>
	</div>
</div>

<style lang="scss">
	.preview-youtube {
		position: relative;
		z-index: 2;
		width: 85%;
		height: 85%;
		background: var(--bg-overlay-10, rgba(0, 0, 0, 0.8));
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 4px 10px var(--shadow-color);
		border: 1px solid var(--fg-opacity-10);

		.preview-nav {
			height: 14px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 6px;
			border-bottom: 1px solid var(--fg-opacity-05);

			.preview-logo {
				width: 16px;
				height: 6px;
				background: var(--fg-opacity-20);
				border-radius: 2px;
			}
			.preview-search {
				width: 40px;
				height: 6px;
				background: var(--fg-opacity-10);
				border-radius: 3px;
			}
			.preview-avatar {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				background: var(--theme-0, #fff);
			}
		}

		.preview-body {
			flex: 1;
			display: flex;
			padding: 6px;
			gap: 6px;

			.preview-main {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 4px;

				.preview-player {
					background: #000;
					border-radius: 4px;
					height: 50px;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 0 5px var(--shadow-color);
					overflow: hidden;

					.preview-newtube-icon {
						width: 16px;
						height: 16px;
						object-fit: contain;
						filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
					}
				}

				.preview-title {
					height: 6px;
					width: 90%;
					background: var(--fg-opacity-40);
					border-radius: 2px;
					margin-top: 2px;
				}

				.preview-channel-row {
					display: flex;
					align-items: center;
					gap: 4px;
					margin-top: 2px;

					.preview-channel-avatar {
						width: 10px;
						height: 10px;
						border-radius: 50%;
						background: var(--fg-opacity-20);
					}

					.preview-channel-info {
						display: flex;
						flex-direction: column;
						justify-content: center;
						gap: 3px;
						flex: 1;

						.preview-channel-name {
							height: 3px;
							width: 60%;
							background: var(--fg-opacity-40);
							border-radius: 1px;
						}
						.preview-channel-sub {
							height: 2px;
							width: 40%;
							background: var(--fg-opacity-20);
							border-radius: 1px;
						}
					}

					.preview-subscribe {
						width: 20px;
						height: 8px;
						background: var(--fg-opacity-80);
						border-radius: 4px;
					}
				}
			}

			.preview-sidebar {
				flex: 1;
				display: flex;
				flex-direction: column;
				gap: 5px;
				padding-top: 2px;

				.preview-thumb {
					height: 22px;
					background: var(--fg-opacity-10);
					border-radius: 3px;
				}
			}
		}
	}
</style>
