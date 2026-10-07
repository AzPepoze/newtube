<script lang="ts">
	import { logger } from "@/shared/logger";
	import { settingsUi } from "../../settingsApi";
	import { applyPropertyUpdate as applyUpdate } from "./handler";

	let { setting, props, updateUi = () => {} } = $props();

	const settingSnapshot = $derived(JSON.stringify(setting));

	async function handlePropertyUpdate(property: string, newValue: any, customCallback?: Function) {
		await applyUpdate(setting, property, newValue, {
			updateUI: updateUi,
			customCallback: customCallback,
		});
	}

	function mountWrapper(node: HTMLElement, params: { type: string; config: any; updateFunction?: any }) {
		const { type, config, updateFunction } = params;
		(async () => {
			const res = await settingsUi[type](config, updateFunction);
			const frame = res.frame || res.button || res;
			if (frame instanceof HTMLElement) {
				frame.classList.add("styleshift-config-sub-frame");
				node.replaceWith(frame);
			}
		})();
	}

	function getComponentConfig(title: string, property: string, update: any) {
		const propertyValue = setting[property];
		const isBooleanValue = typeof propertyValue === "boolean" && (property === "value" || property === "rainbow");
		const isColorValue =
			property === "color" || property === "highlightColor" || (property === "value" && setting.type === "color");
		const isNumberValue =
			property === "fontSize" ||
			property === "min" ||
			property === "max" ||
			property === "step" ||
			(property === "value" && setting.type === "numberSlide");

		// Helper to create update function with optional custom callback
		const createUpdateFunc = (prop: string) => (val: any) =>
			handlePropertyUpdate(prop, val, typeof update === "function" ? update : undefined);

		if (property.toLowerCase() === "selector") {
			const updateFunc = createUpdateFunc(property);
			return {
				type: "selectorInput",
				config: {
					type: "selectorInput",
					name: title,
					value: propertyValue,
					updateFunction: updateFunc,
				},
				updateFunction: updateFunc,
			};
		}

		if (Array.isArray(update)) {
			const updateFunc = (val) => handlePropertyUpdate(property, val);
			return {
				type: "dropdown",
				config: {
					type: "dropdown",
					name: title,
					value: propertyValue,
					options: Object.fromEntries(update.map((v) => [v, {}])),
					updateFunction: updateFunc,
				},
				updateFunction: updateFunc,
			};
		}

		if (property.toLowerCase() === "rainbow" || isBooleanValue) {
			const updateFunc = createUpdateFunc(property);
			return {
				type: "checkbox",
				config: {
					type: "checkbox",
					name: title,
					value: propertyValue,
					updateFunction: updateFunc,
				},
				updateFunction: updateFunc,
			};
		}

		if (isColorValue) {
			const updateFunc = createUpdateFunc(property);
			return {
				type: "color",
				config: {
					type: "color",
					name: title,
					value: propertyValue,
					showAlphaSlider: true,
					updateFunction: updateFunc,
				},
				updateFunction: updateFunc,
			};
		}

		if (isNumberValue) {
			const updateFunc = createUpdateFunc(property);
			return {
				type: "numberSlide",
				config: {
					type: "numberSlide",
					name: title,
					value: propertyValue,
					min: property === "max" ? propertyValue : property === "step" ? 0.1 : 0,
					max: property === "fontSize" ? 50 : property === "min" ? propertyValue : property === "step" ? 10 : 1000,
					step: property === "step" ? 0.1 : 1,
					updateFunction: updateFunc,
				},
				updateFunction: updateFunc,
			};
		}

		return null;
	}

	function renderEditor(node: HTMLElement, params: { title: string; property: string; update: any }) {
		const { title, property, update } = params;
		(async () => {
			// Pre-process object properties to string for the editor
			const tempObj = { ...setting };
			if (typeof tempObj[property] === "object" && tempObj[property] !== null) {
				tempObj[property] = JSON.stringify(tempObj[property], null, 2);
			}

			const textEditor = await settingsUi.settingDeveloperTextEditor(node, tempObj, {
				[title]: property,
			});
			const mainUi = textEditor.mainUi;
			node.replaceWith(mainUi);

			const editorWrapper = textEditor.textEditors[title];
			const textarea = editorWrapper.textEditor;

			textarea.addEventListener("focus", () => {
				logger.debug("ui", `[ConfigMainSection] Text editor focused for property "${property}"`);
			});

			textarea.addEventListener("blur", () => {
				logger.debug("ui", `[ConfigMainSection] Text editor blurred for property "${property}"`);
			});

			const onUpdate = async (value: any) => {
				logger.debug("ui", `[ConfigMainSection] Text editor update for "${property}":`, value);
				tempObj[property] = value;
				await handlePropertyUpdate(property, value, typeof update === "function" ? update : undefined);
			};

			editorWrapper.onChange(onUpdate);
		})();
	}
</script>

<div class="styleshift-config-main-section">
	{#each Object.entries(props) as [title, propertyValueEntry] (`${title}:${settingSnapshot}`)}
		{@const property = Array.isArray(propertyValueEntry) ? propertyValueEntry[0] : propertyValueEntry}
		{@const update = Array.isArray(propertyValueEntry) ? propertyValueEntry[1] : updateUi}
		{@const componentConfig = getComponentConfig(title, property, update)}

		{#if componentConfig}
			<div use:mountWrapper={componentConfig}></div>
		{:else}
			<div class="full-width" use:renderEditor={{ title, property, update }}></div>
		{/if}
	{/each}
</div>

<style lang="scss">
	.styleshift-config-main-section {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
		width: 100%;

		.full-width {
			grid-column: 1 / -1;
		}

		:global(.styleshift-config-sub-frame) {
			margin-bottom: 0 !important;
			background: var(--bg-surface) !important;
			border: 1px solid var(--border-color) !important;
			box-shadow: none !important;

			&:focus-within {
				border-color: var(--theme-0) !important;
				background: var(--bg-surface-hover) !important;
			}
		}
	}
</style>
