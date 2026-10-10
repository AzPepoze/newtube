<script lang="ts">
	import { executeScriptString } from "@core/runtime/controller";
	import { openApiReference } from "@ui/docs/apiReferenceService";
	import CapsuleTabs from "@ui/window/views/CapsuleTabs.svelte";
	import { untrack } from "svelte";
	import { fade, fly } from "svelte/transition";
	import { settingsUi } from "../../settingsApi";
	import Button from "../controls/Button.svelte";
	import DevCard from "./DevCard.svelte";
	import { handleLogicUpdate } from "../../handler";

	let { setting, runType, extArray = ["function", "css"], onUpdateConfig, isWorkspace = false } = $props();

	const runTypeNameMap = {
		var: "Variable",
		click: "On Click",
		constant: "Constant CSS",
		ui: "UI Script",
		setup: "Startup Script",
		enable: "On Enable",
		disable: "On Disable",
		update: "On Change",
	};

	const colorMap = {
		var: "#FFA500",
		click: "#00DFFF",
		constant: "#09ff00",
		ui: "#3232FF",
		setup: "#3232FF",
		enable: "#32CD32",
		disable: "#FF3232",
		update: "#FF00F5",
	};

	let activeExt = $state(untrack(() => extArray[0]));
	const extOptions = $derived(
		extArray.map((ext) => ({
			id: ext,
			label: ext.toLowerCase() === "function" ? "JS" : ext.toLowerCase() === "css" ? "CSS" : ext,
		})),
	);

	$effect(() => {
		if (!extArray.includes(activeExt)) {
			activeExt = extArray[0];
		}
	});

	let title = $derived(runTypeNameMap[runType as keyof typeof runTypeNameMap] || runType);
	let color = $derived(colorMap[runType as keyof typeof colorMap] || "#999999");

	function handleRunScript() {
		const property = runType + activeExt;
		const script = setting[property];
		if (script) {
			executeScriptString({
				scriptContent: script,
				shouldSanitize: true,
				sourceIdentifier: `Manual Run: ${property}`,
			});
		}
	}

	function renderEditor(node: HTMLElement, ext: string) {
		const div = node as HTMLDivElement;
		let typeName = ext.toLowerCase() === "function" ? "JS" : ext.toLowerCase() === "css" ? "CSS" : ext;
		const typeLangMap: Record<string, string> = {
			JS: "javascript",
			CSS: "css",
		};

		(async () => {
			div.innerHTML = "";
			const editor = await settingsUi.codeEditor(
				div,
				setting,
				runType + ext,
				typeLangMap[typeName] || typeLangMap[ext] || typeName,
				isWorkspace ? "100%" : runType == "var" ? 100 : 400,
			);
			editor.afterOnChange(() => handleLogicUpdate(onUpdateConfig));
		})();
	}

	function renderLegacyContent(node: HTMLElement) {
		const div = node as HTMLDivElement;
		(async () => {
			for (const ext of extArray) {
				let typeName = ext.toLowerCase() === "function" ? "JS" : ext.toLowerCase() === "css" ? "CSS" : ext;
				const item = document.createElement("div");
				item.style.marginBottom = "20px";
				div.appendChild(item);

				const typeLangMap: Record<string, string> = {
					JS: "javascript",
					CSS: "css",
				};
				const editor = await settingsUi.codeEditor(
					item,
					setting,
					runType + ext,
					typeLangMap[typeName] || typeLangMap[ext] || typeName,
					runType == "var" ? 100 : 400,
				);
				editor.afterOnChange(() => handleLogicUpdate(onUpdateConfig));
			}
		})();
	}
</script>

{#if isWorkspace}
	<div class="styleshift-dev-section">
		<header class="section-header">
			<span class="section-title">{title}</span>

			<div class="section-actions">
				{#if extArray.length > 1}
					<CapsuleTabs options={extOptions} bind:activeId={activeExt} />
				{:else}
					<span class="section-lang-hint">
						{activeExt === "function" ? "JavaScript" : activeExt === "css" ? "CSS" : activeExt}
					</span>
				{/if}

				<Button
					setting={{
						type: "button",
						name: "API reference",
						icon: "code",
						color: "#7f5db7",
						clickFunction: openApiReference,
					}}
					variant="subtle"
					iconSize={14}
					fontSize={12}
					style="padding: 6px 12px; border-radius: 8px; white-space: nowrap;"
				/>

				{#if activeExt.toLowerCase() === "function"}
					<Button
						setting={{
							type: "button",
							name: "Run",
							icon: "code",
							color: "#7f5db7",
							clickFunction: handleRunScript,
						}}
						iconSize={14}
						fontSize={12}
						style="padding: 6px 14px; border-radius: 8px; white-space: nowrap; background: var(--theme-0); border-color: var(--theme-0); color: #fff;"
					/>
				{/if}
			</div>
		</header>

		<div class="section-editor-area">
			{#each extArray as ext (ext)}
				{#if activeExt === ext}
					<div
						class="editor-mount"
						use:renderEditor={ext}
						in:fly={{ y: 5, duration: 200, delay: 100 }}
						out:fade={{ duration: 100 }}
					></div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<DevCard {title} {color}>
		<div use:renderLegacyContent></div>
	</DevCard>
{/if}

<style lang="scss">
	.styleshift-dev-section {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
		min-height: 32px;
	}

	.section-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--font-color);
	}

	.section-actions {
		display: flex;
		align-items: center;
		gap: 8px;

		:global(.styleshift-button) {
			width: auto;
		}

		:global(.styleshift-button *) {
			white-space: nowrap !important;
		}
	}

	.section-lang-hint {
		font-family: "Fira Code", monospace;
		font-size: 12px;
		color: var(--font-color-dim);
	}

	.section-editor-area {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.editor-mount {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;

		:global(.styleshift-code-editor-container) {
			flex: 1;
			display: flex;
			flex-direction: column;
			border: 1px solid var(--border-color) !important;
			background: var(--bg-input) !important;
			border-radius: 8px !important;
			margin-top: 0 !important;

			&:focus-within {
				border-color: var(--fg-opacity-20) !important;
			}
		}
	}
</style>
