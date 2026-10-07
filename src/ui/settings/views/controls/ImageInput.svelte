<script lang="ts">
	import { logger } from "@/shared/logger";
	import { getFromStorage } from "@core/storage/manager";
	import { triggerSettingUpdate } from "@settings/engine/functions";
	import type { Setting } from "@settings/types/styleshiftTypes";
	import { setAndSave } from "@ui/settings/settingsApi";
	import { getAssetUrl } from "@ui/window/utils";
	import { showUserConfirmation } from "@ui/window/windowFactory";
	import Button from "../controls/Button.svelte";
	import PreviewImage from "../controls/PreviewImage.svelte";
	import Description from "../base/Description.svelte";
	const uploadIcon = "assets/icons/upload.svg";

	let {
		setting,
		placeholder = "https://example.com/image.png",
	}: {
		setting: Extract<Setting, { type: "imageInput" }>;
		placeholder?: string;
	} = $props();

	let value = $state("");

	async function init() {
		if (setting.id) {
			value = await getFromStorage(setting.id);
		} else {
			value = setting.value;
		}
	}
	init();

	const _name = $derived(setting.name);
	const _description = $derived(setting.description);
	const isBase64 = $derived(value?.startsWith("data:") ?? false);
	const inputValue = $derived(isBase64 ? "" : value);
	const inputPlaceholder = $derived(isBase64 ? "Stored Image (Base64 Data)" : placeholder);

	let fileInput = $state<HTMLInputElement | null>(null);
	let fileName = $state("");
	let isDragging = $state(false);

	function getFileNameFromUrl(urlStr: string) {
		if (!urlStr) return "";
		if (urlStr.startsWith("data:")) return "Stored Image (Base64)";
		try {
			// Try to parse as URL
			const urlStrSafe = urlStr.includes("://") ? urlStr : "http://" + urlStr;
			const url = new URL(urlStrSafe);
			const name = url.pathname.split("/").pop();
			return name && name.includes(".") ? name : "Remote Image";
		} catch {
			return "Remote Image";
		}
	}

	async function handleUpdate(newValue: string) {
		value = newValue;
		if (setting.id) {
			await setAndSave(setting, value);
			triggerSettingUpdate(setting.id);
		}
	}

	const getWarningMessage = (fileSize: number, maxSize: number) => {
		const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);
		const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);

		return (
			`Your file size : ${fileSize.toLocaleString()} bytes. (${fileSizeMB} MB)\n` +
			`Recommend file size : lower than ${maxSize.toLocaleString()} bytes. (${maxSizeMB} MB)\n\n` +
			`Your file is quite large. (It may cause lag!)\n\n` +
			`I recommend do one of these.\n` +
			`- compress file\n` +
			`- (image) resize it\n` +
			`- (image) Use image URL instead \n` +
			`- Use Upload api (Make this is the last choice)\n\n` +
			`Are you want to continue?`
		);
	};

	async function processFile(file: File) {
		const fileName = file.name;
		const fileSize = file.size;
		const fileType = file.type;
		const maxSize = setting.maxFileSize || 10000000;

		logger.info("UI", `File selected: ${fileName} (${fileSize.toLocaleString()} bytes, type: ${fileType})`);

		if (fileSize > maxSize) {
			logger.info("UI", `File size exceeds limit (${maxSize} bytes). Showing confirmation.`);

			const warningTitle = "WARNING!";
			const warningMessage = getWarningMessage(fileSize, maxSize);
			const confirmOptions = {
				confirmLabel: "Continue anyway",
				cancelLabel: "Cancel",
				confirmColor: "#7f5db7",
				align: "left" as const,
			};

			const confirmed = await showUserConfirmation(warningMessage, warningTitle, confirmOptions);

			if (confirmed) {
				logger.info("UI", "User confirmed large file upload.");
				uploadFile(file);
			} else {
				logger.info("UI", "User cancelled large file upload.");
			}
			return;
		}

		uploadFile(file);
	}

	function uploadFile(file: File) {
		fileName = file.name;
		const reader = new FileReader();
		reader.onload = async (e) => {
			const result = e.target?.result as string;
			await handleUpdate(result);
			logger.info("UI", `File uploaded successfully: ${file.name}`);
		};
		reader.readAsDataURL(file);
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file);
			target.value = ""; // Clear to allow re-selection of same file
		}
	}

	async function handleUrlInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		await handleUpdate(val);
		fileName = getFileNameFromUrl(val);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && file.type.startsWith("image/")) {
			processFile(file);
		}
	}

	function openImage() {
		if (value) {
			window.open(value);
		}
	}

	async function removeImage() {
		const confirmed = await showUserConfirmation("Are you sure you want to remove this image?", "Remove Image", {
			confirmLabel: "Remove",
			cancelLabel: "Cancel",
			confirmColor: "#f44336",
		});

		if (confirmed) {
			await handleUpdate("");
			fileName = "";
			logger.info("UI", "Image removed by user");
		}
	}

	$effect(() => {
		if (value && !fileName) {
			fileName = getFileNameFromUrl(value);
		} else if (!value) {
			fileName = "";
		}
	});
</script>

<div class="styleshift-image-input-container">
	<div class="styleshift-image-input-header">
		<Description name={setting.name} description={setting.description} />
	</div>

	<div class="styleshift-image-input-controls">
		<div
			class="styleshift-upload-zone"
			class:dragging={isDragging}
			onclick={() => fileInput?.click()}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === "Enter" && fileInput?.click()}
			title="Click or Drag & Drop image to upload"
		>
			<img class="styleshift-upload-icon" src={getAssetUrl(uploadIcon)} alt="Upload" />
			<span class="styleshift-upload-text">Upload</span>
		</div>

		<input type="file" bind:this={fileInput} onchange={handleFileChange} accept="image/*" style="display: none;" />

		<div class="styleshift-url-input-wrapper">
			<input
				type="text"
				value={inputValue}
				placeholder={inputPlaceholder}
				oninput={handleUrlInput}
				class="styleshift-url-input"
			/>
		</div>
	</div>

	{#if value}
		<div class="styleshift-image-preview-wrapper">
			<PreviewImage src={value} />
			{#if fileName}
				<span class="styleshift-file-name" title={fileName}>{fileName}</span>
			{/if}
			<div class="styleshift-button-center-wrapper">
				<Button
					setting={{
						type: "button",
						name: "View Original Image",
						color: "#ffffff",
						fontSize: 11,
						clickFunction: openImage,
					}}
					style="padding: 5px 12px; width: auto; height: 26px;"
				/>
				<Button
					setting={{
						type: "button",
						name: "Remove",
						color: "#ff4444",
						fontSize: 11,
						clickFunction: removeImage,
					}}
					style="padding: 5px 12px; width: auto; height: 26px;"
				/>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.styleshift-button-center-wrapper {
		display: flex;
		justify-content: center;
		gap: 10px;
		width: 100%;
		margin-top: 5px;
	}
	.styleshift-image-input-header {
		display: flex;
		padding-left: 10px;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		margin-bottom: 10px;
	}

	.styleshift-file-name {
		font-size: 13px;
		font-weight: 600;
		color: white;
		background: var(--fg-opacity-05);
		padding: 8px 20px;
		border-radius: 20px;
		max-width: 92%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 10px;
		border: 1px solid var(--fg-opacity-10);
		box-shadow: 0 4px 15px var(--bg-overlay-30);
	}

	.styleshift-image-input-controls {
		display: flex;
		gap: 15px;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
	}

	.styleshift-upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 80px;
		height: 80px;
		background: var(--fg-opacity-05);
		border: 1px dashed var(--fg-opacity-20);
		border-radius: 15px;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;

		&:hover,
		&.dragging {
			border-color: var(--theme-0);
			background: var(--theme-0-10);
			transform: translateY(-2px);
		}

		&.dragging {
			transform: scale(1.05);
			box-shadow: 0 0 20px var(--theme-0-30);
		}
	}

	.styleshift-upload-icon {
		width: 28px;
		height: 28px;
		opacity: 0.7;
		filter: drop-shadow(0 2px 4px var(--bg-overlay-20));
		transition: all 0.2s;

		.styleshift-upload-zone:hover & {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	.styleshift-upload-text {
		font-size: 11px;
		font-weight: 500;
		opacity: 0.6;
	}

	.styleshift-url-input-wrapper {
		flex: 1;
		min-width: 0;
	}

	.styleshift-url-input {
		width: 100%;
		padding: 8px 15px;
		background: var(--bg-overlay-30);
		border: 1px grey solid;
		border-radius: 20px;
		color: white;
		font-size: 13px;
		outline: none;
		transition: all 0.2s;
		overflow: hidden;
		text-overflow: ellipsis;
		box-sizing: border-box;

		&:focus {
			border-color: var(--theme-0);
			background: var(--bg-overlay-50);
		}

		&::placeholder {
			color: var(--fg-opacity-30);
		}
	}

	.styleshift-image-preview-wrapper {
		margin-top: 15px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
</style>
