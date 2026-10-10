<script lang="ts">
	import { logger } from "@/shared/logger";
	import { settingsUi } from "../../settingsApi";
	import { applyPropertyUpdate as applyUpdate } from "../../handler";

	let { setting, groups, updateUi = () => {} } = $props();

	const wideEditorProperties = ["html", "text", "description", "options", "syncId"];

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

	function getSliderRange(property: string) {
		if (property === "fontSize") return { min: 0, max: 50 };
		if (property === "min") return { min: 0, max: setting.max ?? 1000 };
		if (property === "max") return { min: setting.min ?? 0, max: 1000 };
		if (property === "step") return { min: 0.1, max: 10 };
		return { min: 0, max: 1000 };
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
			const sliderRange = getSliderRange(property);
			const updateFunc = createUpdateFunc(property);
			return {
				type: "numberSlide",
				config: {
					type: "numberSlide",
					name: title,
					value: propertyValue,
					min: sliderRange.min,
					max: sliderRange.max,
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
			mainUi.classList.add(
				wideEditorProperties.includes(property) ? "styleshift-config-wide" : "styleshift-config-compact",
			);
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
	{#each groups as group (group.label)}
		<section class="config-group">
			<h3 class="config-group-title">{group.label}</h3>
			<div class="config-group-fields">
				{#each Object.entries(group.fields) as [title, propertyValueEntry] (title)}
					{@const property = Array.isArray(propertyValueEntry) ? propertyValueEntry[0] : propertyValueEntry}
					{@const update = Array.isArray(propertyValueEntry) ? propertyValueEntry[1] : updateUi}
					{@const componentConfig = getComponentConfig(title, property, update)}

					{#if componentConfig}
						<div use:mountWrapper={componentConfig}></div>
					{:else}
						<div use:renderEditor={{ title, property, update }}></div>
					{/if}
				{/each}
			</div>
		</section>
	{/each}
</div>

<style lang="scss">
	.styleshift-config-main-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;

		.config-group {
			background: var(--bg-surface);
			border: 1px solid var(--border-color);
			border-radius: var(--border-radius);
			padding: 14px 16px;
		}

		.config-group-title {
			margin: 0 0 10px;
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0.8px;
			text-transform: uppercase;
			color: var(--font-color-dim);
		}

		.config-group-fields {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 12px 16px;
			align-items: start;
		}

		:global(.styleshift-config-wide) {
			grid-column: 1 / -1;
		}

		:global(.styleshift-config-sub-frame) {
			margin-bottom: 0;
			background: transparent;
			border: none;
			box-shadow: none;
		}

		:global(.styleshift-config-compact .styleshift-text-editor) {
			min-height: 34px;
			height: 34px;
			resize: none;
		}
	}
</style>
