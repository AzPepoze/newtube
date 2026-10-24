// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { buildReplicaDocument } from "@extensions/youtube/features/diagnostics/sandbox/replica";

function snapshotWith(root, styles = [{ display: "block" }]) {
	return { root, styles, nodeCount: 1, truncated: false };
}

const rect = { x: 0, y: 0, width: 10, height: 10 };

test("returns an empty document when the root is null", () => {
	const html = buildReplicaDocument(snapshotWith(null));
	expect(html).toContain("<body></body>");
	expect(html).not.toContain("<style>");
});

test("renders id, classes and the style index on an element", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "html",
			rect,
			style: 0,
			children: [
				{ tag: "body", rect, style: 0, children: [{ tag: "div", id: "app", classes: ["a", "b"], rect, style: 0 }] },
			],
		}),
	);
	expect(html).toContain('<div id="app" class="a b" data-ss-s="0" data-ss-n="1"></div>');
});

test("escapes quotes in attribute values", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "div", attrs: { slot: 'x" onmouseover="alert(1)' }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('slot="x&quot; onmouseover=&quot;alert(1)"');
	expect(html).not.toContain('onmouseover="');
});

test("never emits text content", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "button", attrs: { role: "button" }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('<div role="button" data-ss-s="0" data-ss-n="1"></div>');
	expect(html).not.toContain("Play");
});

test("drops url and event attributes from a report", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "a", attrs: { href: "javascript:alert(1)", onclick: "x()" }, rect, style: 0 }],
		}),
	);
	expect(html).not.toContain("javascript");
	expect(html).not.toContain("onclick");
});

test("renders internal href references for SVG sprites", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "use", attrs: { href: "#icon-id" }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('<use href="#icon-id" data-ss-s="0" data-ss-n="1"></use>');
});

test("drops external href values but keeps the anchor", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "a", attrs: { href: "https://x.test" }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('<a data-ss-s="0" data-ss-n="1"></a>');
	expect(html).not.toContain("x.test");
});

test("does not render blocked tags", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "script", rect, style: 0 }],
		}),
	);
	expect(html).not.toContain("<script");
});

test("renders void elements without a closing tag or children", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "img", rect, style: 0, children: [{ tag: "span", rect, style: 0 }] }],
		}),
	);
	expect(html).toContain('<img data-ss-img="" data-ss-s="0" data-ss-n="1">');
	expect(html).not.toContain("</img>");
	expect(html).not.toContain("<span");
});

test("renders the text of an exposure-filtered snapshot as escaped text content", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "p", text: "XXXXX <XX>&", rect, style: 0 }],
		}),
	);
	expect(html).toContain('<div data-ss-s="0" data-ss-n="1">XXXXX &lt;XX&gt;&amp;</div>');
});

test("marks images with data-ss-img and styles them with the placeholder rule", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "img", attrs: { width: "10" }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('<img width="10" data-ss-img="" data-ss-s="0" data-ss-n="1">');
	expect(html).toContain("img[data-ss-img] { background-color: #2a2a2a; }");
});

test("removes angle brackets from style values", () => {
	const html = buildReplicaDocument(
		snapshotWith({ tag: "body", rect, style: 0 }, [{ "background-color": "red</style><script>alert(1)</script>" }]),
	);
	expect(html).not.toContain("</style><script>");
	expect(html).toContain("background-color: red/stylescriptalert(1)/script;");
});

test("emits the base layer with the style rule for index 0", () => {
	const html = buildReplicaDocument(
		snapshotWith({ tag: "body", rect, style: 0 }, [{ display: "flex", "margin-top": "0px", color: "" }]),
	);
	expect(html).toContain("@layer base {");
	expect(html).toContain("html, body { margin: 0; }");
	expect(html).toContain('[data-ss-s="0"] { display: flex; margin-top: 0px; }');
	expect(html).not.toContain(" color:");
});

function imageNode(media) {
	return snapshotWith({ tag: "body", rect, style: 0, children: [{ tag: "img", media, rect, style: 0 }] });
}

test("renders an image src from an http or data:image url and drops the placeholder", () => {
	const html = buildReplicaDocument(imageNode({ src: "https://i.test/a.jpg" }));
	expect(html).toContain('<img src="https://i.test/a.jpg" data-ss-s="0" data-ss-n="1">');
	expect(html).not.toContain('data-ss-img=""');
	const dataHtml = buildReplicaDocument(imageNode({ src: "data:image/png;base64,AAAA" }));
	expect(dataHtml).toContain('src="data:image/png;base64,AAAA"');
});

test("keeps the gray placeholder when the image src is not allowed", () => {
	const html = buildReplicaDocument(imageNode({ src: "javascript:alert(1)" }));
	expect(html).toContain('<img data-ss-img="" data-ss-s="0" data-ss-n="1">');
	expect(html).not.toContain("javascript");
});

test("keeps the gray placeholder when the image has no media", () => {
	const html = buildReplicaDocument(imageNode(undefined));
	expect(html).toContain('<img data-ss-img="" data-ss-s="0" data-ss-n="1">');
});

test("renders a srcset whose candidates are all allowed", () => {
	const html = buildReplicaDocument(
		imageNode({ src: "https://i.test/a.jpg", srcset: "https://i.test/a2.jpg 2x, https://i.test/a3.jpg 3x" }),
	);
	expect(html).toContain('srcset="https://i.test/a2.jpg 2x, https://i.test/a3.jpg 3x"');
});

test("drops the whole srcset when any candidate is not allowed", () => {
	const html = buildReplicaDocument(
		imageNode({ src: "https://i.test/a.jpg", srcset: "https://i.test/a2.jpg 2x, javascript:alert(1) 3x" }),
	);
	expect(html).toContain('src="https://i.test/a.jpg"');
	expect(html).not.toContain("srcset");
	expect(html).not.toContain("javascript");
});

test("renders a video poster from an allowed url and no autoplay", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [
				{
					tag: "video",
					attrs: { autoplay: "", controls: "" },
					media: { poster: "https://i.test/p.jpg" },
					rect,
					style: 0,
				},
			],
		}),
	);
	expect(html).toContain('<video controls="" poster="https://i.test/p.jpg" data-ss-s="0" data-ss-n="1"></video>');
	expect(html).not.toContain("autoplay");
	expect(html).toContain("video:not([poster]) { background-color: #1a1a1a; }");
});

test("drops a video poster with a javascript url", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "video", media: { poster: "javascript:alert(1)" }, rect, style: 0 }],
		}),
	);
	expect(html).toContain('<video data-ss-s="0" data-ss-n="1"></video>');
	expect(html).not.toContain("javascript");
});

function linkNode(href, attrs = {}) {
	return snapshotWith({ tag: "body", rect, style: 0, children: [{ tag: "a", href, attrs, rect, style: 0 }] });
}

test("renders absolute http(s) links with noopener and no target", () => {
	const html = buildReplicaDocument(linkNode("https://x.test/page"));
	expect(html).toContain('<a href="https://x.test/page" rel="noreferrer noopener" data-ss-s="0" data-ss-n="1"></a>');
	expect(html).not.toContain("target=");
});

test("renders root-relative and hash links", () => {
	expect(buildReplicaDocument(linkNode("/watch?v=1"))).toContain('<a href="/watch?v=1"');
	expect(buildReplicaDocument(linkNode("#top"))).toContain('<a href="#top"');
});

test("drops links with other schemes or protocol-relative urls", () => {
	for (const href of ["javascript:alert(1)", "data:text/html,hi", "//evil.test/x", "/\\evil.test", "ftp://x.test"]) {
		const html = buildReplicaDocument(linkNode(href));
		expect(html).not.toContain("href=");
		expect(html).not.toContain("rel=");
	}
});

test("renders aria-label, title and alt escaped", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [
				{
					tag: "img",
					media: { src: "https://i.test/a.jpg" },
					a11y: { ariaLabel: 'Say "hi"', title: "Tip <b>", alt: "Cat" },
					rect,
					style: 0,
				},
			],
		}),
	);
	expect(html).toContain('aria-label="Say &quot;hi&quot;"');
	expect(html).toContain('title="Tip &lt;b&gt;"');
	expect(html).toContain('alt="Cat"');
});

function styleSnapshot(value) {
	return snapshotWith({ tag: "body", rect, style: 0 }, [{ "background-image": value }]);
}

test("keeps http(s) and data:image url() values in styles", () => {
	const https = buildReplicaDocument(styleSnapshot('url("https://i.test/bg.jpg")'));
	expect(https).toContain('background-image: url("https://i.test/bg.jpg");');
	const data = buildReplicaDocument(styleSnapshot("url(data:image/png;base64,AAAA)"));
	expect(data).toContain('background-image: url("data:image/png;base64,AAAA");');
});

test("replaces url() values with other schemes with none", () => {
	const html = buildReplicaDocument(styleSnapshot("url(javascript:alert(1))"));
	expect(html).toContain("background-image: none;");
	expect(html).not.toContain("javascript");
});

test("replaces a url() value with a quote inside it with none", () => {
	const html = buildReplicaDocument(styleSnapshot('url("https://i.test/a.jpg") url(https://i.test/b")'));
	expect(html).toContain('url("https://i.test/a.jpg") none');
	expect(html).not.toContain("i.test/b");
});

test("emits font-face rules before the base layer with escaped family and allowed data", () => {
	const withFonts = {
		root: { tag: "body", rect, style: 0 },
		styles: [{ display: "block" }],
		nodeCount: 1,
		truncated: false,
		fonts: [
			{ family: 'Icons "Pro"', weight: "400", style: "normal", data: "data:font/woff2;base64,AAAA" },
			{ family: "Bad", data: "data:text/html;base64,AAAA" },
		],
	};
	const fontHtml = buildReplicaDocument(withFonts);
	const fontFace =
		'@font-face { font-family: "Icons \\"Pro\\""; src: url("data:font/woff2;base64,AAAA"); font-weight: 400; font-style: normal; }';
	expect(fontHtml).toContain(fontFace);
	expect(fontHtml.indexOf("@font-face")).toBeLessThan(fontHtml.indexOf("@layer base {"));
	expect(fontHtml).not.toContain("text/html");
	expect(fontHtml).not.toContain('"Bad"');
});

test("rejects font data urls with a non-font mime type", () => {
	const html = buildReplicaDocument({
		root: { tag: "body", rect, style: 0 },
		styles: [{ display: "block" }],
		nodeCount: 1,
		truncated: false,
		fonts: [{ family: "Icons", data: "data:image/svg+xml;base64,AAAA" }],
	});
	expect(html).not.toContain("@font-face");
});

test("emits a size rule with width and min-height for a block node", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "div", rect: { x: 0, y: 0, width: 100, height: 50 }, style: 0 }],
		}),
	);
	expect(html).toContain('<div data-ss-s="0" data-ss-n="1"></div>');
	expect(html).toContain('[data-ss-n="1"] { width: 100px; min-height: 50px; }');
});

test("emits no size rule for inline, display none or zero width nodes", () => {
	const html = buildReplicaDocument({
		root: {
			tag: "body",
			rect: { x: 0, y: 0, width: 100, height: 100 },
			style: 0,
			children: [
				{ tag: "span", rect, style: 1 },
				{ tag: "div", rect, style: 2 },
				{ tag: "div", rect: { x: 0, y: 0, width: 0, height: 10 }, style: 0 },
			],
		},
		styles: [{ display: "block" }, { display: "inline" }, { display: "none" }],
		nodeCount: 4,
		truncated: false,
	});
	expect(html).toContain('[data-ss-n="0"] { width: 100px; min-height: 100px; }');
	expect(html).not.toContain('data-ss-n="1"');
	expect(html).not.toContain('data-ss-n="2"');
	expect(html).not.toContain('data-ss-n="3"');
});

test("converts border-box rects to content-box sizes unless box-sizing is border-box", () => {
	const spacing = {
		"padding-left": "5px",
		"padding-right": "5px",
		"padding-top": "3px",
		"padding-bottom": "3px",
		"border-left-width": "2px",
		"border-right-width": "2px",
		"border-top-width": "1px",
		"border-bottom-width": "1px",
	};
	const html = buildReplicaDocument({
		root: {
			tag: "body",
			rect: { x: 0, y: 0, width: 200, height: 200 },
			style: 1,
			children: [
				{ tag: "div", rect: { x: 0, y: 0, width: 100, height: 50 }, style: 0 },
				{ tag: "div", rect: { x: 0, y: 0, width: 100, height: 50 }, style: 1 },
			],
		},
		styles: [
			{ display: "block", "box-sizing": "content-box", ...spacing },
			{ display: "block", "box-sizing": "border-box", ...spacing },
		],
		nodeCount: 3,
		truncated: false,
	});
	expect(html).toContain('[data-ss-n="1"] { width: 86px; min-height: 42px; }');
	expect(html).toContain('[data-ss-n="2"] { width: 100px; min-height: 50px; }');
});

test("pins flex children of a flex parent and leaves children of other parents alone", () => {
	const flexHtml = buildReplicaDocument({
		root: {
			tag: "body",
			rect: { x: 0, y: 0, width: 200, height: 200 },
			style: 0,
			children: [
				{
					tag: "div",
					rect: { x: 0, y: 0, width: 200, height: 50 },
					style: 1,
					children: [{ tag: "div", rect: { x: 0, y: 0, width: 100, height: 50 }, style: 0 }],
				},
			],
		},
		styles: [{ display: "block" }, { display: "flex" }],
		nodeCount: 3,
		truncated: false,
	});
	expect(flexHtml).toContain(
		'[data-ss-n="2"] { width: 100px; min-height: 50px; flex: 0 0 auto; min-width: 0; max-width: none; }',
	);

	const blockHtml = buildReplicaDocument({
		root: {
			tag: "body",
			rect: { x: 0, y: 0, width: 200, height: 200 },
			style: 0,
			children: [
				{
					tag: "div",
					rect: { x: 0, y: 0, width: 200, height: 50 },
					style: 0,
					children: [{ tag: "div", rect: { x: 0, y: 0, width: 100, height: 50 }, style: 0 }],
				},
			],
		},
		styles: [{ display: "block" }],
		nodeCount: 3,
		truncated: false,
	});
	expect(blockHtml).toContain('[data-ss-n="2"] { width: 100px; min-height: 50px; }');
	expect(blockHtml).not.toContain("flex: 0 0 auto");
});

test("renders button, p and li as div", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [
				{ tag: "button", id: "b", rect, style: 0 },
				{ tag: "p", id: "p", rect, style: 0 },
				{ tag: "li", id: "l", rect, style: 0 },
			],
		}),
	);
	expect(html).toContain('<div id="b" data-ss-s="0" data-ss-n="1"></div>');
	expect(html).toContain('<div id="p" data-ss-s="0" data-ss-n="2"></div>');
	expect(html).toContain('<div id="l" data-ss-s="0" data-ss-n="3"></div>');
	expect(html).not.toMatch(/<(button|p|li)[ >]/);
});

test("renders a nested anchor as div and keeps a sibling anchor", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [
				{
					tag: "a",
					id: "outer",
					href: "/one",
					rect,
					style: 0,
					children: [{ tag: "a", id: "inner", href: "/two", rect, style: 0 }],
				},
				{ tag: "a", id: "sibling", href: "/three", rect, style: 0 },
			],
		}),
	);
	expect(html).toContain(
		'<a id="outer" href="/one" rel="noreferrer noopener" data-ss-s="0" data-ss-n="1"><div id="inner"',
	);
	expect(html).not.toContain('<a id="inner"');
	expect(html).toContain('<a id="sibling" href="/three"');
});

test("places size rules inside the base layer", () => {
	const html = buildReplicaDocument(
		snapshotWith({
			tag: "body",
			rect,
			style: 0,
			children: [{ tag: "div", rect, style: 0 }],
		}),
	);
	const layerStart = html.indexOf("@layer base {");
	const sizeRule = html.indexOf('[data-ss-n="1"] {');
	const layerEnd = html.indexOf("}</style>");
	expect(layerStart).toBeGreaterThanOrEqual(0);
	expect(sizeRule).toBeGreaterThan(layerStart);
	expect(layerEnd).toBeGreaterThan(sizeRule);
});
