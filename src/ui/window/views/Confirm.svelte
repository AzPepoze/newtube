<script lang="ts">
	import Button from "@controls/Button.svelte";
	import Description from "@base/Description.svelte";
	import type { Snippet } from "svelte";
	import { quintOut } from "svelte/easing";
	import { fly } from "svelte/transition";
	import Modal from "./Modal.svelte";

	let {
		title = "Confirm Action",
		message = "",
		align = "center",
		vertical = false,
		onConfirm,
		onCancel,
		footer,
		buttons,
		onClose,
	}: {
		title?: string;
		message?: string;
		align?: "left" | "center" | "right";
		vertical?: boolean;
		onConfirm?: () => void;
		onCancel?: () => void;
		footer?: Snippet;
		buttons?: { label: string; color: string; description?: string; onClick: () => void }[];
		onClose?: () => void;
	} = $props();

	let isOpen = $state(true);

	function handleAction(callback?: () => void) {
		isOpen = false;
		if (callback) callback();
	}
</script>

<Modal {isOpen} onClose={() => handleAction(onClose || onCancel)} width="400px">
	<div class="header" in:fly={{ y: 12, duration: 420, easing: quintOut, delay: 80 }}>
		{title}
	</div>
	{#if message}
		<div class="body" in:fly={{ y: 12, duration: 420, easing: quintOut, delay: 140 }}>
			<Description name={message} {align} />
		</div>
	{/if}
	<div class="footer {vertical ? 'vertical' : ''}" in:fly={{ y: 12, duration: 420, easing: quintOut, delay: 200 }}>
		{#if footer}
			{@render footer()}
		{:else if buttons}
			{#each buttons as btn, i (i)}
				<Button
					setting={{
						type: "button",
						name: btn.label,
						color: btn.color,
						description: btn.description,
						clickFunction: () => handleAction(btn.onClick),
					}}
					showHelpIcon={!!btn.description}
				/>
			{/each}
		{:else}
			<Button
				setting={{
					type: "button",
					name: "Confirm",
					color: "var(--theme-0)",
					clickFunction: () => handleAction(onConfirm),
				}}
			/>
			<Button
				setting={{
					type: "button",
					name: "Cancel",
					color: "var(--fg-opacity-20)",
					clickFunction: () => handleAction(onCancel),
				}}
			/>
		{/if}
	</div>
</Modal>

<style lang="scss">
	.header {
		font-size: 24px;
		font-weight: 900;
		text-align: center;
		color: var(--font-color);
	}

	.footer {
		display: flex;
		gap: 15px;
		margin-top: 10px;

		&.vertical {
			flex-direction: column;
			gap: 10px;
		}

		:global(.styleshift-button) {
			flex: 1;
		}
	}
</style>
