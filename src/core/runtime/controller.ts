import { sleep } from "@/core/shared/utilities";
import { createNotification } from "@core/shared/notifications";
import { persistCachedDataToStorage, saveToStorage } from "@core/storage/manager";
import { getAddOnItems } from "@settings/registry/items";
import { logger } from "@shared/logger";

import { IS_IN_EXTENSION_SETTINGS_PAGE, refreshExtensionState } from "../";
import { isSafeCode } from "../utils/security";

export async function saveAndRefreshAll(): Promise<void> {
	logger.info("STORAGE", "Saving structure and refreshing all...");
	await saveItems();
	await refreshExtensionState();
}

export async function saveItems(): Promise<void> {
	const addOnItems = getAddOnItems();
	if (addOnItems && addOnItems.length > 0) {
		await saveToStorage("addOnStyleShiftItems", addOnItems, true);
	}
	await persistCachedDataToStorage();
}

let activeStyleShiftFunctions: Record<string, string[]> = {};

const FUNCTION_DISCOVERY_SCRIPT = `
(function discoverFunctions(){
	if(window["StyleShift"] == null) {
		setTimeout(discoverFunctions, 1);
		return;
	}

	let registry = {};
	for (const [scope, methods] of Object.entries(window["StyleShift"])) {
		registry[scope] = Object.keys(methods);
	}

	window["StyleShift"].logger.info("Function Discovery Complete", registry);

	window.dispatchEvent(
		new CustomEvent("StyleShift:FunctionsDiscovered", {
			detail: registry,
		})
	);
})();`;

export async function synchronizeAvailableFunctions(): Promise<void> {
	if (IS_IN_EXTENSION_SETTINGS_PAGE) {
		let attempts = 0;
		while (window["StyleShift"] == null && attempts < 5000) {
			await sleep(1);
			attempts++;
		}

		if (window["StyleShift"]) {
			for (const [scope, methods] of Object.entries(window["StyleShift"])) {
				activeStyleShiftFunctions[scope] = Object.keys(methods as object);
			}
		}
		return;
	}

	return new Promise((resolve) => {
		const listener = ((event: CustomEvent) => {
			logger.info("runtime", "Function registry received:", event.detail);
			activeStyleShiftFunctions = event.detail;
			resolve();
		}) as EventListener;

		window.addEventListener("StyleShift:FunctionsDiscovered", listener, {
			once: true,
		});

		executeScriptString({
			scriptContent: FUNCTION_DISCOVERY_SCRIPT,
			shouldSanitize: false,
		});
	});
}

export async function fetchGlobalFunction(scope: "buildIn" | "custom", functionName: string): Promise<any> {
	for (let i = 0; i < 100; i++) {
		const fn = window["StyleShift"]?.[scope]?.[functionName];
		if (fn) return fn;
		await sleep(10);
	}
	return null;
}

interface ExecutionOptions {
	scriptContent: string | Function;
	shouldSanitize?: boolean;
	sourceIdentifier?: string;
	executionArguments?: string;
}

export async function executeScriptString({
	scriptContent,
	shouldSanitize = true,
	sourceIdentifier = "StyleShift",
	executionArguments = "",
}: ExecutionOptions): Promise<void> {
	logger.debug("runtime", "Trying to run script from source:", sourceIdentifier);

	if (!scriptContent) {
		logger.debug("runtime", "Script content is empty for source:", sourceIdentifier);
		return;
	}

	if (typeof scriptContent === "function") {
		logger.debug("runtime", "Executing script as function");
		scriptContent();
		return;
	}

	let finalScript = scriptContent;
	logger.debug("runtime", "Original script content:", finalScript);

	if (shouldSanitize) {
		if (!isSafeCode(finalScript, sourceIdentifier)) {
			logger.warn("runtime", "Script blocked by security policy:", sourceIdentifier);
			return;
		}

		logger.debug("runtime", "Script passed safety check, applying shorthand replacements");
		// Shorthand replacements
		for (const [scope, methods] of Object.entries(activeStyleShiftFunctions)) {
			for (const methodName of methods) {
				const pattern = new RegExp(`\\b${methodName}\\b`, "g");
				if (pattern.test(finalScript)) {
					finalScript = finalScript.replace(pattern, `window["StyleShift"]["${scope}"]["${methodName}"]`);
				}
			}
		}
	}

	logger.debug("runtime", "Final script for execution:", finalScript);

	if (!IS_IN_EXTENSION_SETTINGS_PAGE) {
		logger.debug("runtime", "Sending runScript message to background for script execution");
		chrome.runtime.sendMessage({
			Command: "runScript",
			Script: finalScript,
			args: executionArguments,
		});
	} else {
		logger.debug("runtime", "In extension settings page, runScript message not sent");
	}
}

export function executeSettingScript(settingObject: any, functionProperty: string = "script"): void {
	executeScriptString({
		scriptContent: settingObject[functionProperty],
		sourceIdentifier: `${settingObject.id} : ${functionProperty}`,
		executionArguments: JSON.stringify({ settingId: settingObject.id }),
	});
}

export let isDevModulesLoaded = false;
export let hasAttemptedDevModuleLoad = false;
export let jszipInstance: any;
export let codemirrorInstance: any;

export const globalMetadataCache: any[] = [];

export async function loadMetadata(): Promise<void> {
	if (globalMetadataCache.length > 0) return;
	try {
		const metadataUrl = chrome.runtime.getURL("types/NewTube-Metadata.json");
		logger.debug("runtime", "Fetching metadata from:", metadataUrl);
		const response = await fetch(metadataUrl);
		const data = await response.json();
		globalMetadataCache.length = 0;
		globalMetadataCache.push(...data);
	} catch (error) {
		logger.error("runtime", "Failed to load metadata", error);
		throw error;
	}
}

async function importModule(path: string, name: string): Promise<any> {
	try {
		const url = chrome.runtime.getURL(path);
		logger.debug("runtime", `Importing ${name} from:`, url);
		const module = await import(url);
		return module.default?.default || module.default;
	} catch (error) {
		logger.error("runtime", `Failed to load ${name}`, error);
		throw error;
	}
}

export async function loadJSZip(): Promise<void> {
	if (jszipInstance) return;
	jszipInstance = await importModule("modules/jszip.js", "JSZip");
}

export async function loadCodeMirror(): Promise<void> {
	if (codemirrorInstance) return;
	codemirrorInstance = await importModule("modules/codemirror.js", "CodeMirror");
}

export async function initializeDeveloperEnvironment(): Promise<void> {
	if (hasAttemptedDevModuleLoad || isDevModulesLoaded) return;

	hasAttemptedDevModuleLoad = true;

	const loaderUi = await createNotification({
		icon: "sync",
		title: "NewTube - Loading Developer Modules",
		content: "Preparing environment...",
		timeout: -1,
	});

	try {
		logger.info("runtime", "Loading developer environment...");

		loaderUi.setContent("Fetching Metadata...");
		await loadMetadata();

		loaderUi.setContent("Loading JSZip...");
		await loadJSZip();

		loaderUi.setContent("Loading CodeMirror...");
		await loadCodeMirror();

		logger.info("runtime", "Developer environment loaded successfully.");
		loaderUi.setIcon("check_circle");
		loaderUi.setTitle("Developer Environment Ready");
		loaderUi.setContent("");

		setTimeout(() => loaderUi.close(), 2000);
		isDevModulesLoaded = true;
	} catch (error) {
		const errorName = (error as any)?.name;
		const isAbort = errorName === "AbortError" || errorName === "NS_ERROR_ABORT";

		logger.error("runtime", "Failed to load developer modules:", error);

		loaderUi.setIcon("warning");
		if (isAbort) {
			loaderUi.setTitle("Load Aborted");
			loaderUi.setContent(
				"The operation was aborted by the browser. (This often happens if the page is navigated or reloaded during loading)",
			);
		} else {
			loaderUi.setTitle("Developer Module Error");
			const message = error instanceof Error ? error.message : String(error);
			loaderUi.setContent(`${message}\n(Check console for details)`);
		}

		setTimeout(() => loaderUi.close(), 10000);
		hasAttemptedDevModuleLoad = false;
	}
}

let workerPolicy: any = null;

function getWorkerPolicy() {
	if (workerPolicy) return workerPolicy;
	if (typeof window !== "undefined" && (window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
		try {
			workerPolicy = (window as any).trustedTypes.createPolicy("styleshift-worker-policy", {
				createScriptURL: (url: string) => url,
			});
		} catch (e) {
			logger.warn("runtime", "Failed to create Trusted Types policy:", e);
		}
	}
	return workerPolicy;
}

export async function loadWorker(fileName: string): Promise<Worker | null> {
	const scriptUrl = chrome.runtime.getURL(`workers/${fileName}`);
	logger.info("runtime", `Loading worker ${fileName}`);

	const policy = getWorkerPolicy();
	const trustedUrl = policy ? policy.createScriptURL(scriptUrl) : scriptUrl;

	try {
		const worker = new Worker(trustedUrl);
		logger.info("runtime", `Native Worker created successfully for ${fileName}`);
		return worker;
	} catch (error) {
		logger.warn("runtime", `Native Worker failed for ${fileName} with direct URL, trying Blob fallback:`, error);

		try {
			const response = await fetch(scriptUrl);
			if (!response.ok) {
				throw new Error(`HTTP error fetching worker script: ${response.status} ${response.statusText}`);
			}
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const trustedBlobUrl = policy ? policy.createScriptURL(blobUrl) : blobUrl;
			const worker = new Worker(trustedBlobUrl);
			logger.info("runtime", `Worker created successfully via Blob for ${fileName}`);
			return worker;
		} catch (blobError) {
			logger.error("runtime", `All worker creation methods failed for ${fileName}:`, blobError);
			return null;
		}
	}
}
