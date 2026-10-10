import { globalMetadataCache, loadCodeMirror, loadMetadata } from "@core/runtime/controller";
import { logger } from "@shared/logger";
import { settingsUi } from "@ui/settings/settingsApi";
import { createStyleShiftWindow } from "@ui/window/windowFactory";
import ApiReferenceWindow from "./views/ApiReferenceWindow.svelte";

let activeWindow: { closeWindowHandler?: () => void } | null = null;

/** Opens the API Reference window (function syntax + setting kinds). Singleton. */
export async function openApiReference(): Promise<void> {
	if (activeWindow) return;

	const docsWindow = await createStyleShiftWindow({
		title: "API Reference",
		width: "80%",
		height: "85%",
		center: true,
		blurToggle: true,
		onWindowClosed: () => {
			activeWindow = null;
		},
	});
	activeWindow = docsWindow;

	docsWindow.contentElement.style.padding = "20px";
	docsWindow.contentElement.style.overflowY = "auto";

	try {
		await loadMetadata();
	} catch (error) {
		logger.warn("docs", "API Reference opened without metadata", error);
	}

	try {
		await loadCodeMirror();
	} catch (error) {
		logger.warn("docs", "API Reference opened without CodeMirror, using plain code fallback", error);
	}

	settingsUi.renderComponent(
		ApiReferenceWindow,
		{
			entries: [...globalMetadataCache],
		},
		docsWindow.contentElement,
	);
}
