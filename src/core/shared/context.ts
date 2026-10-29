import { STORE_TARGET_SITES } from "@extensions/youtube/constants";
import { getCurrentDomain, getCurrentUrlParameters } from "../shared/domHelpers";

export const IS_FIREFOX = navigator.userAgent.toLowerCase().includes("firefox");

export const EXTENSION_BASE_URL = chrome.runtime.getURL("").slice(0, -1);

export const IS_IN_EXTENSION_SETTINGS_PAGE = window.location.origin === EXTENSION_BASE_URL;

export const IS_SANDBOX = IS_IN_EXTENSION_SETTINGS_PAGE && getCurrentUrlParameters().sandbox === "1";

/** Storage domain; the settings page reads it from the URL or uses the default site. */
export let currentContextDomain: string;
if (IS_IN_EXTENSION_SETTINGS_PAGE) {
	const params = getCurrentUrlParameters();
	currentContextDomain = params.domain || STORE_TARGET_SITES[0];
} else {
	currentContextDomain = getCurrentDomain();
}

/**
 * Sets the current context domain.
 *
 * @param {string} domain - The domain to set as the current context.
 *
 * @example
 * setCurrentContextDomain("youtube.com");
 */
export function setCurrentContextDomain(domain: string) {
	currentContextDomain = domain;
}
