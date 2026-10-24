/**
 * Background Service Worker for StyleShift Extension
 * Main entry point - delegates to specialized modules
 */

import { logger } from "@/shared/logger";

interface ContentScriptMessage {
	Command: string;
	workerId?: string;
	scriptUrl?: string;
	message?: any;
	Script?: string;
	data?: any;
	error?: string;
	args?: string;
}

chrome.commands.onCommand.addListener(async (command: string) => {
	logger.info("command", `Command "${command}" triggered`);
	const queryOptions = { active: true, lastFocusedWindow: true };
	const [tab] = await chrome.tabs.query(queryOptions);
	if (tab.id) {
		chrome.tabs.sendMessage(tab.id, command);
	}
});

/**
 * Execute a function in the main world of a tab
 * This function runs in the MAIN world via executeScript
 * Note: This function is stringified and injected, so it must be self-contained
 */
async function execFunction(execText: string): Promise<void> {
	try {
		console.debug("StyleShift: Injecting script into Main World");

		// Setup Trusted Types policies first (self-contained)
		const win = window as any;
		if (win.trustedTypes && win.trustedTypes.createPolicy) {
			if (!win.__styleshift_script_policy) {
				try {
					win.__styleshift_script_policy = win.trustedTypes.createPolicy("styleshift-script-policy", {
						createScript: (s: string) => s,
					});
				} catch (_e) {
					win.__styleshift_script_policy = win.trustedTypes.getPolicy("styleshift-script-policy");
				}
			}

			if (!win.__styleshift_html_policy) {
				try {
					win.__styleshift_html_policy = win.trustedTypes.createPolicy("styleshift-html-policy", {
						createHTML: (h: string) => h,
					});
				} catch (_e) {
					win.__styleshift_html_policy = win.trustedTypes.getPolicy("styleshift-html-policy");
				}
			}
		}

		const script = document.createElement("script");

		if (win.__styleshift_script_policy && win.__styleshift_script_policy.createScript) {
			script.textContent = win.__styleshift_script_policy.createScript(execText);
		} else {
			script.textContent = execText;
		}

		(document.head || document.documentElement).appendChild(script);
		script.remove();
	} catch (error) {
		console.error("StyleShift: Execution failed", error);
		const errorMsg = error instanceof Error ? error.message : String(error);
		if (typeof (window as any).StyleShift !== "undefined") {
			(window as any).StyleShift["buildIn"]?.["_call_function"]?.("createError", "Injection failed: " + errorMsg);
		}
		try {
			new Function(execText)();
		} catch (_e) {}
	}
}

chrome.runtime.onMessage.addListener(
	(recivedMsg: ContentScriptMessage, sender: chrome.runtime.MessageSender, sendResponse) => {
		if (recivedMsg.Command === "workerError" || recivedMsg.error) {
			logger.error("message", recivedMsg);
		} else {
			logger.info("message", recivedMsg);
		}

		handleMessage(recivedMsg, sender)
			.then((result) => {
				sendResponse(result);
			})
			.catch((error) => {
				logger.error("message", "Error handling message:", error);
				sendResponse(false);
			});

		return true; // Keep channel open for async response
	},
);

async function handleMessage(recivedMsg: ContentScriptMessage, sender: chrome.runtime.MessageSender): Promise<any> {
	logger.info("message", `Handling command: ${recivedMsg.Command}`);
	switch (recivedMsg.Command) {
		case "runScript": {
			if (!sender.tab?.id) return false;

			let preCode = "";

			if (recivedMsg.args && recivedMsg.args !== "") {
				const args = JSON.parse(recivedMsg.args);

				if (args) {
					const settingId = args["settingId"];
					if (settingId) {
						preCode += `let thisSettingFrame = document.querySelector(".styleshift-window #${settingId}");\n`;
						preCode += `
                            if (window.trustedTypes && thisSettingFrame) {
                                if (!window.__styleshift_html_policy) {
                                    try {
                                        window.__styleshift_html_policy = window.trustedTypes.createPolicy("styleshift-policy-html", { createHTML: (h) => h });
                                    } catch (_e) {
                                        window.__styleshift_html_policy = window.trustedTypes.getPolicy("styleshift-policy-html") || window.trustedTypes.defaultPolicy || null;
                                    }
                                }
                                const policy = window.__styleshift_html_policy;

                                if (policy && !thisSettingFrame.__styleshift_policy_set) {
                                    const originalSetInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML').set;
                                    Object.defineProperty(thisSettingFrame, 'innerHTML', {
                                        set: function(html) {
                                            originalSetInnerHTML.call(this, policy.createHTML(html));
                                        },
                                        configurable: true
                                    });
                                    thisSettingFrame.__styleshift_policy_set = true;
                                }
                            }\n`;
						preCode += `async function saveSettingValue(value){
                                   return await StyleShift["buildIn"]["_call_function"]("saveStyleShiftValue", "${settingId}", value)
                              }\n`;
						preCode += `async function loadSettingValue(){
                                   return await StyleShift["buildIn"]["_call_function"]("loadStyleShiftValue", "${settingId}")
                              }\n`;
					}
					for (const [key, value] of Object.entries(args)) {
						preCode += `let ${key} = "${value}";\n`;
					}
				}
			}

			const scriptData = recivedMsg.Script || "";
			const excuteData = `(async () => {
                try {
                    ${preCode}

					${scriptData}
                } catch (e) {
                    console.error("StyleShift: Script execution failed", e);
                }
            })()`;

			await chrome.scripting.executeScript({
				target: { tabId: sender.tab.id },
				func: execFunction,
				args: [excuteData],
				world: "MAIN",
			});

			logger.info("script", "Executed Script");
			return true;
		}

		case "openSettingPage": {
			const url = chrome.runtime.getURL(`setting/styleshift.html?domain=${recivedMsg.data?.domain || ""}`);
			chrome.tabs.create({ url });
			return true;
		}

		case "openDiagnosticsPage": {
			chrome.tabs.create({ url: chrome.runtime.getURL("diagnostics/diagnostics.html") });
			return true;
		}

		case "openSandboxPage": {
			chrome.tabs.create({ url: chrome.runtime.getURL("setting/sandbox.html?domain=sandbox&sandbox=1") });
			return true;
		}

		case "getCommands": {
			return await new Promise((resolve) => {
				let resolved = false;
				try {
					logger.info("message", "Calling chrome.commands.getAll()");
					chrome.commands.getAll((commands) => {
						if (!resolved) {
							logger.info("message", "chrome.commands.getAll() callback:", commands);
							resolved = true;
							resolve(commands || []);
						}
					});
					// Stop waiting if the callback never fires.
					setTimeout(() => {
						if (!resolved) {
							logger.warn("message", "getCommands timeout - resolving with empty array");
							resolved = true;
							resolve([]);
						}
					}, 5000);
				} catch (_e) {
					if (!resolved) {
						logger.error("message", "Error in getCommands:", _e);
						resolved = true;
						resolve([]);
					}
				}
			});
		}

		case "editCommands": {
			const url = "chrome://extensions/shortcuts";
			chrome.tabs.create({ url });
			return true;
		}
	}

	logger.info("message", "---------------------------------");
	return false;
}

export {};
