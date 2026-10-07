// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import {
	LAYOUT_OUTLINE_DEPTH_LIMIT,
	buildLayoutOutline,
} from "../../../../../src/extensions/youtube/features/diagnostics/outline";
import {
	anonymizePage,
	buildDiagnosticsReport,
} from "../../../../../src/extensions/youtube/features/diagnostics/report";
import { detectPageMode } from "../../../../../src/extensions/youtube/features/diagnostics/selectors";
import type {
	DiagnosticsReportInput,
	LayoutOutline,
} from "../../../../../src/extensions/youtube/features/diagnostics/types";

const emptyLayout: LayoutOutline = {
	regions: {},
	nodeCount: 0,
	depthLimit: LAYOUT_OUTLINE_DEPTH_LIMIT,
	droppedNodes: 0,
	truncated: false,
};

const baseInput: DiagnosticsReportInput = {
	extensionName: "NewTube",
	extensionVersion: "1.2.3",
	userAgent: "test-agent",
	userAgentData: { mobile: false, platform: "Linux" },
	platform: "linux",
	viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
	colorScheme: "dark",
	reducedMotion: false,
	url: "https://www.youtube.com/watch?v=privateVideoId&list=privateList&hl=en",
	mode: "watch",
	currentSettings: { CenterVideoTitleTheater: false, CenterVideoTitleNormal: true },
	addOnStyleShiftItems: [{ category: { label: "Custom Elements" }, settings: [] }],
	layout: emptyLayout,
	css: { injected: "", injectedBytes: 0, stylesheetCount: 0, computed: [] },
	selectors: { "ytd-watch-flexy": 1 },
	generatedAt: "2026-01-01T00:00:00.000Z",
};

test("anonymized page keeps origin and pathname but drops query values and hash", () => {
	const page = anonymizePage("https://www.youtube.com/watch?v=abc&list=xyz&t=10#frag");
	expect(page.url).toBe("https://www.youtube.com/watch");
	expect(page.origin).toBe("https://www.youtube.com");
	expect(page.pathname).toBe("/watch");
	expect(page.queryParamNames).toEqual(["v", "list", "t"]);
	expect(JSON.stringify(page)).not.toContain("abc");
	expect(JSON.stringify(page)).not.toContain("xyz");
	expect(JSON.stringify(page)).not.toContain("frag");
});

test("anonymized page falls back gracefully when the URL cannot be parsed", () => {
	const page = anonymizePage("/watch?v=abc&gl=US#frag");
	expect(page.url).toBe("/watch");
	expect(page.pathname).toBe("/watch");
	expect(page.queryParamNames).toEqual(["v", "gl"]);
});

test("detects the main YouTube page modes", () => {
	expect(detectPageMode("/watch")).toBe("watch");
	expect(detectPageMode("/watch", "www.youtube.com")).toBe("watch");
	expect(detectPageMode("/shorts/abc")).toBe("shorts");
	expect(detectPageMode("/playlist", "www.youtube.com")).toBe("playlist");
	expect(detectPageMode("/results?search_query=hi")).toBe("search");
	expect(detectPageMode("/@somebody")).toBe("channel");
	expect(detectPageMode("/feed/subscriptions")).toBe("browse");
	expect(detectPageMode("/", "music.youtube.com")).toBe("music");
	expect(detectPageMode("/some/unknown")).toBe("other");
});

test("builds report v2 with complete settings and an anonymized page", () => {
	const report = buildDiagnosticsReport(baseInput);
	expect(report.meta.reportVersion).toBe(2);
	expect(report.meta.generatedAt).toBe("2026-01-01T00:00:00.000Z");
	expect(report.meta.extension).toEqual({ name: "NewTube", version: "1.2.3" });
	expect(report.page.url).toBe("https://www.youtube.com/watch");
	expect(report.page.queryParamNames).toEqual(["v", "list", "hl"]);
	// Complete settings are captured, not just the ones that differ from the defaults.
	expect(report.settings.currentSettings).toEqual({
		CenterVideoTitleTheater: false,
		CenterVideoTitleNormal: true,
	});
	expect(report.settings.addOnStyleShiftItems).toHaveLength(1);
	expect(report.selectors).toEqual({ "ytd-watch-flexy": 1 });
});

function element(tagName: string, options: any = {}) {
	const attrs = options.attrs ?? {};
	return {
		tagName: tagName.toUpperCase(),
		id: options.id,
		className: options.className,
		textContent: options.textContent,
		children: options.children ?? [],
		getAttribute: (name: string) => attrs[name] ?? null,
	};
}

function depthOf(node: any): number {
	if (!node?.children?.length) return 1;
	return 1 + Math.max(...node.children.map(depthOf));
}

test("layout outline contains structure only, never text, scripts or hrefs", () => {
	const tree = element("div", {
		id: "masthead-container",
		className: "style-scope ytd-app",
		attrs: { role: "banner", "aria-label": "Guide" },
		children: [
			element("script", { textContent: "alert('secret')" }),
			element("style", { textContent: "body { color: red }" }),
			element("a", {
				attrs: { href: "https://example.com/private-video", "aria-label": "Link" },
				textContent: "Private title text",
			}),
		],
	});

	const outline = buildLayoutOutline(
		{ querySelector: (selector: string) => (selector === "#masthead-container" ? tree : null) },
		{
			masthead: "#masthead-container",
		},
	);

	const serialized = JSON.stringify(outline);
	expect(serialized).not.toContain("Private title text");
	expect(serialized).not.toContain("private-video");
	expect(serialized).not.toContain("href");
	expect(serialized).not.toContain("color: red");
	expect(serialized).not.toContain("alert");
	expect(outline.regions.masthead?.tag).toBe("div");
	expect(outline.regions.masthead?.id).toBe("masthead-container");
	expect(outline.regions.masthead?.classes).toEqual(["style-scope", "ytd-app"]);
	expect(outline.regions.masthead?.role).toBe("banner");
	expect(outline.regions.masthead?.children?.map((child) => child.tag)).toEqual(["a"]);
});

test("layout outline is bounded by depth and reports truncation counts", () => {
	let child = element("span");
	for (let level = 0; level < 12; level++) {
		child = element("div", { children: [child] });
	}

	const outline = buildLayoutOutline({ querySelector: () => child }, { deep: ".deep" });
	expect(outline.regions.deep).not.toBeNull();
	expect(outline.truncated).toBe(true);
	expect(outline.droppedNodes).toBeGreaterThan(0);
	expect(depthOf(outline.regions.deep)).toBe(LAYOUT_OUTLINE_DEPTH_LIMIT + 1);
});

test("layout outline reports missing regions as null", () => {
	const outline = buildLayoutOutline({ querySelector: () => null }, { player: "ytd-player" });
	expect(outline.regions.player).toBeNull();
	expect(outline.nodeCount).toBe(0);
});
