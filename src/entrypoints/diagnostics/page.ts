import DiagnosticsRoot from "@extensions/youtube/features/diagnostics/views/DiagnosticsRoot.svelte";
import { mount } from "svelte";

/** Same font source as the settings page, injected here because this page has no core bootstrap. */
function injectMaterialIconsFont(): void {
	const style = document.createElement("style");
	style.textContent = `
		@font-face {
			font-family: "Material Icons";
			font-style: normal;
			font-weight: 400;
			font-display: block;
			src:
				url("${chrome.runtime.getURL("assets/fonts/material-icons.woff2")}") format("woff2"),
				url("${chrome.runtime.getURL("assets/fonts/material-icons.woff")}") format("woff"),
				url("${chrome.runtime.getURL("assets/fonts/material-icons.ttf")}") format("truetype");
		}
	`;
	document.head.appendChild(style);
}

injectMaterialIconsFont();
mount(DiagnosticsRoot, { target: document.getElementById("app")! });
