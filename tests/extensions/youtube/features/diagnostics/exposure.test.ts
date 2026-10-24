// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import {
	DEFAULT_EXPOSURE,
	applyExposure,
	estimateExposureBytes,
	maskText,
} from "@extensions/youtube/features/diagnostics/exposure";
import { buildDiagnosticsReport } from "@extensions/youtube/features/diagnostics/report";

const rect = { x: 0, y: 0, width: 10, height: 10 };
const ALL_OFF = {
	text: false,
	names: false,
	images: false,
	video: false,
	links: false,
	alt: false,
	fonts: false,
	settings: false,
	css: false,
	layout: false,
	browser: false,
	screen: false,
};
const ALL_ON = Object.fromEntries(Object.keys(ALL_OFF).map((key) => [key, true]));

function buildSampleReport() {
	return buildDiagnosticsReport({
		extensionName: "StyleShift",
		extensionVersion: "6.1.0",
		userAgent: "test-agent",
		userAgentData: { mobile: false },
		platform: "linux",
		viewport: { width: 1920, height: 1080, devicePixelRatio: 2 },
		colorScheme: "dark",
		reducedMotion: true,
		url: "https://www.youtube.com/watch?v=privateVideoId&hl=en#frag",
		mode: "watch",
		currentSettings: { CenterVideoTitleNormal: true },
		addOnStyleShiftItems: [{ settings: [] }],
		layout: {
			regions: { player: { tag: "div", rect, children: [] } },
			nodeCount: 1,
			depthLimit: 8,
			droppedNodes: 0,
			truncated: false,
		},
		css: {
			injected: "body { color: red }",
			injectedBytes: 20,
			stylesheetCount: 1,
			computed: [{ selector: "#app", present: true, styles: { color: "red" } }],
		},
		selectors: { "ytd-watch-flexy": 1 },
		snapshot: {
			root: {
				tag: "html",
				rect,
				style: 0,
				children: [
					{
						tag: "body",
						rect,
						style: 0,
						children: [
							{ tag: "p", rect, style: 0, text: "Secret words" },
							{ tag: "span", rect, style: 0, text: "home", textKind: "icon" },
							{ tag: "span", rect, style: 0, text: "Someone", textKind: "name" },
							{
								tag: "a",
								rect,
								style: 0,
								href: "https://x.test/a?v=1",
								attrs: { style: "background: url(https://img.test/bg.png) red" },
								a11y: { ariaLabel: "Open channel" },
							},
							{
								tag: "img",
								rect,
								style: 0,
								media: { src: "https://img.test/a.png", srcset: "https://img.test/a.png 2x" },
								a11y: { alt: "A cat" },
							},
							{
								tag: "video",
								rect,
								style: 0,
								media: { src: "https://v.test/a.mp4", poster: "https://v.test/p.jpg" },
							},
						],
					},
				],
			},
			styles: [
				{ display: "block", "background-image": "url(https://img.test/x.png)" },
				{ display: "inline", "background-image": "none" },
			],
			nodeCount: 8,
			truncated: false,
			fonts: [{ family: "Roboto", data: "data:font/woff2;base64,AAAA" }],
		},
	});
}

/** Returns the first node with the tag, in document order. */
function findInTree(node, tag) {
	if (node.tag === tag) return node;
	for (const child of node.children ?? []) {
		const found = findInTree(child, tag);
		if (found) return found;
	}
	return undefined;
}

function findNode(report, tag) {
	return findInTree(report.snapshot.root, tag);
}

test("default exposure shares only settings, css, layout, browser and screen", () => {
	expect(DEFAULT_EXPOSURE).toEqual({
		text: false,
		names: false,
		images: false,
		video: false,
		links: false,
		alt: false,
		fonts: false,
		settings: true,
		css: true,
		layout: true,
		browser: true,
		screen: true,
	});
});

test("maskText replaces every non-space character with X", () => {
	expect(maskText("Hello world")).toBe("XXXXX XXXXX");
	expect(maskText("a\tb\nc")).toBe("X\tX\nX");
	expect(maskText("")).toBe("");
});

test("text is masked by default and real when the text switch is on", () => {
	const report = buildSampleReport();
	expect(findNode(applyExposure(report, DEFAULT_EXPOSURE), "p").text).toBe("XXXXXX XXXXX");
	expect(findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, text: true }), "p").text).toBe("Secret words");
});

test("icon text follows the fonts switch, not the text switch", () => {
	const report = buildSampleReport();
	const iconOff = findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, text: true }), "span");
	expect(iconOff.text).toBe("XXXX");

	const iconOn = findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, fonts: true }), "span");
	expect(iconOn.text).toBe("home");
	expect(iconOn.textKind).toBe("icon");
});

function findNameNode(report) {
	return report.snapshot.root.children[0].children.find((node) => node.textKind === "name");
}

test("name text follows the names switch or the text switch", () => {
	const report = buildSampleReport();
	expect(findNameNode(applyExposure(report, DEFAULT_EXPOSURE)).text).toBe("XXXXXXX");
	expect(findNameNode(applyExposure(report, { ...DEFAULT_EXPOSURE, names: true })).text).toBe("Someone");
	expect(findNameNode(applyExposure(report, { ...DEFAULT_EXPOSURE, text: true })).text).toBe("Someone");
});

test("links are dropped by default and the href is kept with the links switch", () => {
	const report = buildSampleReport();
	expect(findNode(applyExposure(report, DEFAULT_EXPOSURE), "a")).not.toHaveProperty("href");
	expect(findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, links: true }), "a").href).toBe("https://x.test/a?v=1");
});

test("media src and srcset follow images, poster follows video", () => {
	const report = buildSampleReport();
	const video = (options) => findNode(applyExposure(report, options), "video");

	expect(findNode(applyExposure(report, DEFAULT_EXPOSURE), "img")).not.toHaveProperty("media");
	expect(findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, images: true }), "img").media).toEqual({
		src: "https://img.test/a.png",
		srcset: "https://img.test/a.png 2x",
	});
	expect(video({ ...DEFAULT_EXPOSURE, images: true }).media).toEqual({ src: "https://v.test/a.mp4" });
	expect(video({ ...DEFAULT_EXPOSURE, video: true }).media).toEqual({ poster: "https://v.test/p.jpg" });
});

test("a11y values are dropped unless the alt switch is on", () => {
	const report = buildSampleReport();
	expect(findNode(applyExposure(report, DEFAULT_EXPOSURE), "img")).not.toHaveProperty("a11y");
	expect(findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, alt: true }), "img").a11y).toEqual({ alt: "A cat" });
	expect(findNode(applyExposure(report, { ...DEFAULT_EXPOSURE, alt: true }), "a").a11y).toEqual({
		ariaLabel: "Open channel",
	});
});

test("background-image urls are replaced with none unless the images switch is on", () => {
	const report = buildSampleReport();
	const hidden = applyExposure(report, DEFAULT_EXPOSURE);
	expect(hidden.snapshot.styles[0]["background-image"]).toBe("none");
	expect(hidden.snapshot.styles[1]["background-image"]).toBe("none");
	expect(findNode(hidden, "a").attrs.style).toBe("background: none red");

	const shown = applyExposure(report, { ...DEFAULT_EXPOSURE, images: true });
	expect(shown.snapshot.styles[0]["background-image"]).toBe("url(https://img.test/x.png)");
	expect(findNode(shown, "a").attrs.style).toBe("background: url(https://img.test/bg.png) red");
});

test("fonts are dropped unless the fonts switch is on", () => {
	const report = buildSampleReport();
	expect(applyExposure(report, DEFAULT_EXPOSURE).snapshot).not.toHaveProperty("fonts");
	expect(applyExposure(report, { ...DEFAULT_EXPOSURE, fonts: true }).snapshot.fonts).toEqual([
		{ family: "Roboto", data: "data:font/woff2;base64,AAAA" },
	]);
});

test("page url is anonymized by default and the full url only with the links switch", () => {
	const report = buildSampleReport();
	const hidden = applyExposure(report, DEFAULT_EXPOSURE);
	expect(hidden.page.url).toBe("https://www.youtube.com/watch");
	expect(hidden.page).not.toHaveProperty("rawUrl");
	expect(JSON.stringify(hidden)).not.toContain("privateVideoId");

	const shown = applyExposure(report, { ...DEFAULT_EXPOSURE, links: true });
	expect(shown.page.url).toBe("https://www.youtube.com/watch?v=privateVideoId&hl=en#frag");
	expect(shown.page).not.toHaveProperty("rawUrl");
});

test("page url falls back to the anonymized url when rawUrl is missing", () => {
	const report = buildSampleReport();
	delete report.page.rawUrl;
	expect(applyExposure(report, { ...DEFAULT_EXPOSURE, links: true }).page.url).toBe("https://www.youtube.com/watch");
});

test("settings, css and layout are cleared when their switches are off", () => {
	const report = buildSampleReport();
	const off = applyExposure(report, { ...DEFAULT_EXPOSURE, settings: false, css: false, layout: false });

	expect(off.settings).toEqual({ currentSettings: {}, addOnStyleShiftItems: [] });
	expect(off.css).toEqual({ injected: "", injectedBytes: 0, stylesheetCount: 0, computed: [] });
	expect(off.layout).toEqual({ regions: {}, nodeCount: 0, depthLimit: 8, droppedNodes: 0, truncated: false });
	expect(off.selectors).toEqual({});
});

test("settings, css and layout are kept with their switches on", () => {
	const report = buildSampleReport();
	const on = applyExposure(report, ALL_ON);

	expect(on.settings).toEqual(report.settings);
	expect(on.css).toEqual(report.css);
	expect(on.layout).toEqual(report.layout);
	expect(on.selectors).toEqual(report.selectors);
});

test("browser details are cleared when the browser switch is off", () => {
	const report = buildSampleReport();
	const off = applyExposure(report, { ...DEFAULT_EXPOSURE, browser: false });

	expect(off.environment.userAgent).toBe("");
	expect(off.environment.userAgentData).toBeNull();
	expect(off.environment.platform).toBe("");
	expect(off.environment.viewport).toEqual({ width: 1920, height: 1080, devicePixelRatio: 2 });
});

test("viewport is cleared when the screen switch is off and color scheme stays", () => {
	const report = buildSampleReport();
	const off = applyExposure(report, { ...DEFAULT_EXPOSURE, screen: false });

	expect(off.environment.viewport).toEqual({ width: 0, height: 0, devicePixelRatio: 1 });
	expect(off.environment.colorScheme).toBe("dark");
	expect(off.environment.reducedMotion).toBe(true);
});

test("meta is always kept", () => {
	const report = buildSampleReport();
	expect(applyExposure(report, ALL_OFF).meta).toEqual(report.meta);
});

test("applyExposure never mutates the input report", () => {
	const report = buildSampleReport();
	const before = JSON.stringify(report);
	applyExposure(report, DEFAULT_EXPOSURE);
	applyExposure(report, ALL_ON);
	expect(JSON.stringify(report)).toBe(before);
});

test("estimateExposureBytes matches the JSON text length", () => {
	const report = applyExposure(buildSampleReport(), DEFAULT_EXPOSURE);
	expect(estimateExposureBytes(report)).toBe(JSON.stringify(report).length);
});
