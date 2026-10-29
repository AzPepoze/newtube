// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { collectSnapshotFonts } from "../../../../../src/extensions/youtube/features/diagnostics/fonts";

const originalFetch = globalThis.fetch;
const originalFileReader = globalThis.FileReader;
let fetchedUrls = [];
let responder = null;

/** Minimal FileReader, since Bun does not provide one. Only readAsDataURL is used. */
class FakeFileReader {
	readAsDataURL(blob) {
		blob.arrayBuffer().then(
			(buffer) => {
				this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buffer).toString("base64")}`;
				this.onload?.();
			},
			(error) => {
				this.error = error;
				this.onerror?.();
			},
		);
	}
}

beforeEach(() => {
	fetchedUrls = [];
	responder = () => okResponse(new Blob([new Uint8Array([1, 2, 3])], { type: "font/woff2" }));
	globalThis.fetch = async (url) => {
		fetchedUrls.push(String(url));
		return responder(String(url));
	};
	globalThis.FileReader = FakeFileReader;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	globalThis.FileReader = originalFileReader;
});

function okResponse(blob) {
	return { ok: true, status: 200, blob: async () => blob };
}

function fontRule(family, src, extra = {}) {
	const values = { "font-family": family, src, ...extra };
	return { type: 5, style: { getPropertyValue: (name) => values[name] ?? "" } };
}

function sheet(cssRules, href = null) {
	return { href, cssRules };
}

function fakeDocument(styleSheets, baseURI = "https://www.youtube.com/") {
	return { styleSheets, baseURI };
}

test("fetches an icon font and returns it as a data url with its weight and style", async () => {
	const doc = fakeDocument([
		sheet([
			fontRule('"Font Icons"', 'url("https://www.youtube.com/fonts/icons.woff2") format("woff2")', {
				"font-weight": "400",
				"font-style": "normal",
			}),
		]),
	]);
	const fonts = await collectSnapshotFonts(doc);
	expect(fetchedUrls).toEqual(["https://www.youtube.com/fonts/icons.woff2"]);
	expect(fonts).toEqual([
		{ family: "Font Icons", weight: "400", style: "normal", data: "data:font/woff2;base64,AQID" },
	]);
});

test("uses the default font mime type when the blob has none", async () => {
	responder = () => okResponse(new Blob([new Uint8Array([1, 2, 3])]));
	const doc = fakeDocument([sheet([fontRule("Symbols", "url(https://www.youtube.com/a.woff2)")])]);
	const fonts = await collectSnapshotFonts(doc);
	expect(fonts[0].data).toBe("data:font/woff2;base64,AQID");
});

test("ignores font families that are not icon or symbol fonts", async () => {
	const doc = fakeDocument([sheet([fontRule("Roboto", "url(https://www.youtube.com/roboto.woff2)")])]);
	expect(await collectSnapshotFonts(doc)).toEqual([]);
	expect(fetchedUrls).toEqual([]);
});

test("matches symbol font families", async () => {
	const doc = fakeDocument([sheet([fontRule('"Material Symbols Outlined"', "url(https://www.youtube.com/s.woff2)")])]);
	const fonts = await collectSnapshotFonts(doc);
	expect(fonts.map((font) => font.family)).toEqual(["Material Symbols Outlined"]);
});

test("resolves a relative font url against the stylesheet href", async () => {
	const doc = fakeDocument([
		sheet([fontRule("Icons", "url('../fonts/icons.woff2')")], "https://www.youtube.com/css/app.css"),
	]);
	await collectSnapshotFonts(doc);
	expect(fetchedUrls).toEqual(["https://www.youtube.com/fonts/icons.woff2"]);
});

test("resolves a relative font url against the document base for inline sheets", async () => {
	const doc = fakeDocument([sheet([fontRule("Icons", "url(fonts/icons.woff2)")])]);
	await collectSnapshotFonts(doc);
	expect(fetchedUrls).toEqual(["https://www.youtube.com/fonts/icons.woff2"]);
});

test("skips an unreadable cross-origin sheet and keeps the others", async () => {
	const unreadable = {
		href: "https://cdn.test/theme.css",
		get cssRules() {
			throw new DOMException("cross-origin", "SecurityError");
		},
	};
	const doc = fakeDocument([unreadable, sheet([fontRule("Icons", "url(https://www.youtube.com/i.woff2)")])]);
	const fonts = await collectSnapshotFonts(doc);
	expect(fonts.length).toBe(1);
});

test("skips a font larger than 400000 bytes", async () => {
	responder = () => okResponse(new Blob([new Uint8Array(400001)], { type: "font/woff2" }));
	const doc = fakeDocument([sheet([fontRule("Icons", "url(https://www.youtube.com/big.woff2)")])]);
	expect(await collectSnapshotFonts(doc)).toEqual([]);
	expect(fetchedUrls.length).toBe(1);
});

test("keeps a font of exactly 400000 bytes", async () => {
	responder = () => okResponse(new Blob([new Uint8Array(400000)], { type: "font/woff2" }));
	const doc = fakeDocument([sheet([fontRule("Icons", "url(https://www.youtube.com/edge.woff2)")])]);
	expect((await collectSnapshotFonts(doc)).length).toBe(1);
});

test("returns at most six fonts", async () => {
	const rules = Array.from({ length: 8 }, (_, index) =>
		fontRule(`Icons ${index}`, `url(https://www.youtube.com/${index}.woff2)`),
	);
	const fonts = await collectSnapshotFonts(fakeDocument([sheet(rules)]));
	expect(fonts.length).toBe(6);
	expect(fetchedUrls.length).toBe(6);
});

test("returns each family, weight and style once", async () => {
	const rule = fontRule("Icons", "url(https://www.youtube.com/i.woff2)", { "font-weight": "400" });
	const fonts = await collectSnapshotFonts(fakeDocument([sheet([rule, rule]), sheet([rule])]));
	expect(fonts.length).toBe(1);
	expect(fetchedUrls.length).toBe(1);
});

test("keeps the same family with a different weight", async () => {
	const light = fontRule("Icons", "url(https://www.youtube.com/l.woff2)", { "font-weight": "300" });
	const regular = fontRule("Icons", "url(https://www.youtube.com/r.woff2)", { "font-weight": "400" });
	const fonts = await collectSnapshotFonts(fakeDocument([sheet([light, regular])]));
	expect(fonts.map((font) => font.weight)).toEqual(["300", "400"]);
});

test("skips a font that answers with an error status", async () => {
	responder = (url) =>
		url.endsWith("missing.woff2")
			? { ok: false, status: 404, blob: async () => new Blob([]) }
			: okResponse(new Blob([new Uint8Array([9])], { type: "font/woff2" }));
	const doc = fakeDocument([
		sheet([
			fontRule("Icons Missing", "url(https://www.youtube.com/missing.woff2)"),
			fontRule("Icons Present", "url(https://www.youtube.com/present.woff2)"),
		]),
	]);
	const fonts = await collectSnapshotFonts(doc);
	expect(fonts.map((font) => font.family)).toEqual(["Icons Present"]);
});

test("skips a font whose fetch throws", async () => {
	responder = () => {
		throw new TypeError("network down");
	};
	const doc = fakeDocument([sheet([fontRule("Icons", "url(https://www.youtube.com/i.woff2)")])]);
	expect(await collectSnapshotFonts(doc)).toEqual([]);
});
