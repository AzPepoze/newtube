// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { SNAPSHOT_NODE_LIMIT, buildPageSnapshot } from "@extensions/youtube/features/diagnostics/snapshot";

const computedStyle = {
	display: "block",
	width: "10px",
	height: "5px",
	"background-image": "url(https://example.com/bg.png)",
};

function element(tagName: string, options: any = {}) {
	const attributes = Object.entries(options.attrs ?? {}).map(([name, value]) => ({ name, value }));
	return {
		tagName: tagName.toUpperCase(),
		id: options.id ?? "",
		className: options.className ?? "",
		attributes,
		children: options.children ?? [],
		childNodes: options.childNodes ?? [],
		fontFamily: options.fontFamily ?? "",
		currentSrc: options.currentSrc,
		closest: options.closest,
		getAttribute: (name: string) => options.attrs?.[name] ?? null,
		getBoundingClientRect: () => options.rect ?? { x: 0, y: 0, width: 0, height: 0 },
	};
}

function textNode(value: string) {
	return { nodeType: 3, nodeValue: value };
}

function fakeDocument(documentElement: any) {
	return {
		documentElement,
		defaultView: {
			getComputedStyle: (target: any) => ({
				getPropertyValue: (name: string) => {
					if (name === "font-family") return target?.fontFamily ?? "";
					return computedStyle[name] ?? "";
				},
			}),
			scrollX: 0,
			scrollY: 0,
		},
	};
}

test("skips script and style elements", () => {
	const body = element("body", {
		children: [element("script"), element("style"), element("div", { id: "kept" })],
	});
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	const bodyNode = snapshot.root.children[0];
	expect(bodyNode.children.map((child) => child.tag)).toEqual(["div"]);
	expect(JSON.stringify(snapshot)).not.toContain("script");
});

test("keeps aria-label in the a11y section and out of attrs", () => {
	const button = element("button", {
		attrs: { "aria-label": "Close dialog", lang: "en", role: "button" },
	});
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [button] })));

	const node = snapshot.root.children[0];
	expect(node.attrs).not.toHaveProperty("aria-label");
	expect(node.attrs.lang).toBe("");
	expect(node.attrs.role).toBe("button");
	expect(node.a11y).toEqual({ ariaLabel: "Close dialog" });
});

test("drops data-* attributes and keeps the raw href outside attrs", () => {
	const link = element("a", {
		attrs: { "data-secret": "abc123", href: "https://example.com/private", type: "text" },
	});
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [link] })));

	const node = snapshot.root.children[0];
	expect(node.attrs).not.toHaveProperty("data-secret");
	expect(node.attrs).not.toHaveProperty("href");
	expect(node.attrs.type).toBe("text");
	expect(node.href).toBe("https://example.com/private");
	expect(JSON.stringify(snapshot)).not.toContain("abc123");
});

test("keeps the inline style attribute raw", () => {
	const box = element("div", {
		attrs: { style: "background: url(https://example.com/a.png) red" },
	});
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [box] })));

	expect(snapshot.root.children[0].attrs.style).toBe("background: url(https://example.com/a.png) red");
});

test("keeps background-image url(...) raw in the style table", () => {
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [element("span")] })] })),
	);

	const leaf = snapshot.root.children[0].children[0];
	expect(snapshot.styles[leaf.style]["background-image"]).toBe("url(https://example.com/bg.png)");
});

test("captures media sources, srcset and video poster when present", () => {
	const image = element("img", {
		currentSrc: "https://img.test/current.png",
		attrs: { src: "https://img.test/a.png", srcset: "https://img.test/a2.png 2x" },
	});
	const video = element("video", { attrs: { poster: "https://img.test/poster.jpg" } });
	const source = element("source", { attrs: { src: "https://img.test/clip.mp4" } });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [image, video, source] })] })),
	);

	const [imageNode, videoNode, sourceNode] = snapshot.root.children[0].children;
	expect(imageNode.media).toEqual({ src: "https://img.test/current.png", srcset: "https://img.test/a2.png 2x" });
	expect(videoNode.media).toEqual({ poster: "https://img.test/poster.jpg" });
	expect(sourceNode.media).toEqual({ src: "https://img.test/clip.mp4" });
	expect(imageNode.attrs).not.toHaveProperty("src");
});

test("captures alt and title alongside aria-label", () => {
	const image = element("img", { attrs: { alt: "A cat", title: "Cat" } });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [image] })] })),
	);

	expect(snapshot.root.children[0].children[0].a11y).toEqual({ title: "Cat", alt: "A cat" });
});

test("interns identical computed styles", () => {
	const first = element("span");
	const second = element("span");
	const body = element("body", { children: [first, second] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	const [leafA, leafB] = snapshot.root.children[0].children;
	expect(leafA.style).toBe(leafB.style);
	expect(snapshot.styles).toHaveLength(2);
});

test("includes width and height only on leaf elements", () => {
	const leaf = element("span");
	const parent = element("div", { children: [leaf] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [parent] })));

	const parentNode = snapshot.root.children[0];
	const leafNode = parentNode.children[0];
	expect(snapshot.styles[snapshot.root.style]).not.toHaveProperty("width");
	expect(snapshot.styles[parentNode.style]).not.toHaveProperty("width");
	expect(snapshot.styles[leafNode.style].width).toBe("10px");
	expect(snapshot.styles[leafNode.style].height).toBe("5px");
});

test("skips the extension's own UI with its whole subtree", () => {
	const station = element("div", {
		className: "StyleShift-Station",
		children: [element("span", { id: "station-child" })],
	});
	const settings = element("div", { className: "NewTube-settings-window" });
	const holder = element("div", { id: "STYLESHIFT_stylesheet_holder" });
	const normal = element("div", { id: "page-content" });
	const body = element("body", { children: [station, settings, holder, normal] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	const bodyNode = snapshot.root.children[0];
	expect(bodyNode.children.map((child) => child.id)).toEqual(["page-content"]);
	expect(JSON.stringify(snapshot)).not.toContain("station-child");
	expect(JSON.stringify(snapshot)).not.toContain("StyleShift");
	expect(JSON.stringify(snapshot)).not.toContain("NewTube");
	expect(JSON.stringify(snapshot)).not.toContain("STYLESHIFT_stylesheet_holder");
	expect(snapshot.nodeCount).toBe(3);
	expect(snapshot.truncated).toBe(false);
});

test("captures the background tint and image layers with their style", () => {
	const tint = element("div", { id: "newtube-bg-tint" });
	const image = element("div", { id: "newtube-bg-image" });
	const body = element("body", { children: [tint, image] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	const [tintNode, imageNode] = snapshot.root.children[0].children;
	expect(tintNode.id).toBe("newtube-bg-tint");
	expect(imageNode.id).toBe("newtube-bg-image");
	expect(snapshot.styles[tintNode.style]["background-image"]).toBe("url(https://example.com/bg.png)");
	expect(snapshot.styles[imageNode.style].display).toBe("block");
});

test("skips a newtube background element that is not a tint or image layer", () => {
	const background = element("div", { id: "newtube-bg-youtube" });
	const normal = element("div", { id: "page-content" });
	const body = element("body", { children: [background, normal] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	expect(snapshot.root.children[0].children.map((child) => child.id)).toEqual(["page-content"]);
	expect(JSON.stringify(snapshot)).not.toContain("newtube-bg-youtube");
});

test("skips a STYLESHIFT-prefixed id together with its children", () => {
	const holder = element("div", {
		id: "STYLESHIFTSET",
		children: [element("span", { id: "set-child" })],
	});
	const normal = element("div", { id: "page-content" });
	const body = element("body", { children: [holder, normal] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	expect(snapshot.root.children[0].children.map((child) => child.id)).toEqual(["page-content"]);
	expect(JSON.stringify(snapshot)).not.toContain("set-child");
});

test("skips an element with a styleshift class together with its children", () => {
	const windowElement = element("div", {
		className: "styleshift-window",
		children: [element("span", { id: "window-child" })],
	});
	const body = element("body", { children: [windowElement] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	expect(snapshot.root.children[0].children).toBeUndefined();
	expect(JSON.stringify(snapshot)).not.toContain("window-child");
	expect(JSON.stringify(snapshot)).not.toContain("styleshift-window");
});

test("keeps SVG geometry and child shapes", () => {
	const path = element("path", { attrs: { d: "M0 0L10 10", fill: "red" } });
	const svg = element("svg", { attrs: { viewBox: "0 0 24 24" }, children: [path] });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [svg] })] })),
	);

	const svgNode = snapshot.root.children[0].children[0];
	expect(svgNode.attrs.viewBox).toBe("0 0 24 24");
	expect(svgNode.children[0].tag).toBe("path");
	expect(svgNode.children[0].attrs.d).toBe("M0 0L10 10");
	expect(svgNode.children[0].attrs.fill).toBe("red");
});

test("keeps only internal href references in attrs", () => {
	const internalUse = element("use", { attrs: { href: "#icon-id" } });
	const externalUse = element("use", { attrs: { "xlink:href": "https://x.test/a" } });
	const body = element("body", { children: [internalUse, externalUse] });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	const [internalNode, externalNode] = snapshot.root.children[0].children;
	expect(internalNode.attrs.href).toBe("#icon-id");
	expect(internalNode.href).toBeUndefined();
	expect(externalNode.attrs).not.toHaveProperty("xlink:href");
});

test("keeps the real text of normal elements", () => {
	const paragraph = element("p", { childNodes: [textNode("  Hello world  ")] });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [paragraph] })] })),
	);

	const paragraphNode = snapshot.root.children[0].children[0];
	expect(paragraphNode.text).toBe("Hello world");
	expect(paragraphNode.textKind).toBeUndefined();
	expect(paragraphNode.children).toBeUndefined();
});

test("marks icon font text as icon", () => {
	const icon = element("span", { childNodes: [textNode("home")], fontFamily: "'Material Icons', sans-serif" });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [icon] })] })),
	);

	const iconNode = snapshot.root.children[0].children[0];
	expect(iconNode.text).toBe("home");
	expect(iconNode.textKind).toBe("icon");
});

test("marks text inside a channel name element as name", () => {
	const closestChannelName = (selector: string) => (selector.includes("ytd-channel-name") ? {} : null);
	const channel = element("ytd-channel-name", {
		childNodes: [textNode("Some Channel")],
		closest: closestChannelName,
	});
	const nameSpan = element("span", {
		childNodes: [textNode("Someone")],
		closest: closestChannelName,
	});
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [channel, nameSpan] })] })),
	);

	const [channelNode, nameNode] = snapshot.root.children[0].children;
	expect(channelNode.textKind).toBe("name");
	expect(nameNode.textKind).toBe("name");
});

test("does not store script text", () => {
	const script = element("script", { childNodes: [textNode("alert(1)")] });
	const snapshot = buildPageSnapshot(
		fakeDocument(element("html", { children: [element("body", { children: [script] })] })),
	);

	expect(snapshot.root.children[0].children).toBeUndefined();
	expect(JSON.stringify(snapshot)).not.toContain("alert");
});

test("stops at the node limit and sets truncated", () => {
	const children = Array.from({ length: SNAPSHOT_NODE_LIMIT + 1 }, () => element("span"));
	const body = element("body", { children });
	const snapshot = buildPageSnapshot(fakeDocument(element("html", { children: [body] })));

	expect(snapshot.nodeCount).toBe(SNAPSHOT_NODE_LIMIT);
	expect(snapshot.truncated).toBe(true);
});
