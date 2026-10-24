import { logger } from "@shared/logger";

import type { SnapshotFont } from "./types";

/** Matches CSSRule.FONT_FACE_RULE, which is not available in every test environment. */
const FONT_FACE_RULE_TYPE = 5;
const ICON_FONT_FAMILY_PATTERN = /icon|symbol/i;
const FONT_URL_PATTERN = /url\(\s*(["']?)(.*?)\1\s*\)/i;
const DEFAULT_FONT_MIME = "font/woff2";
const MAX_FONT_BYTES = 400000;
const MAX_FONT_COUNT = 6;

interface FontCandidate {
	family: string;
	weight?: string;
	style?: string;
	url: string;
}

function readSheetRules(sheet: CSSStyleSheet): CSSRule[] {
	try {
		return Array.from(sheet.cssRules);
	} catch (error) {
		logger.debug("diagnostics", "Skipped a stylesheet that cannot be read", error);
		return [];
	}
}

function isFontFaceRule(rule: CSSRule): boolean {
	return rule.constructor.name === "CSSFontFaceRule" || rule.type === FONT_FACE_RULE_TYPE;
}

function unquote(value: string): string {
	return value.replace(/^["']|["']$/g, "").trim();
}

function candidateKey(candidate: FontCandidate): string {
	return [candidate.family, candidate.weight ?? "", candidate.style ?? ""].join("|");
}

/** Turns a font-face rule into a fetchable icon font candidate, or undefined when it is not one. */
function toCandidate(rule: CSSRule, sheetBase: string): FontCandidate | undefined {
	const style = (rule as CSSFontFaceRule).style;
	const family = unquote(style.getPropertyValue("font-family"));
	if (!ICON_FONT_FAMILY_PATTERN.test(family)) return undefined;
	const match = FONT_URL_PATTERN.exec(style.getPropertyValue("src"));
	if (!match) return undefined;
	try {
		const url = new URL(match[2], sheetBase).href;
		return {
			family,
			weight: style.getPropertyValue("font-weight") || undefined,
			style: style.getPropertyValue("font-style") || undefined,
			url,
		};
	} catch (error) {
		logger.warn("diagnostics", `Could not resolve the URL of icon font ${family}`, error);
		return undefined;
	}
}

/** Finds the icon font rules across all readable stylesheets, one candidate per family, weight and style. */
function findCandidates(doc: Document): FontCandidate[] {
	const candidates = new Map<string, FontCandidate>();
	for (const sheet of Array.from(doc.styleSheets)) {
		const sheetBase = sheet.href ?? doc.baseURI;
		for (const rule of readSheetRules(sheet)) {
			if (!isFontFaceRule(rule)) continue;
			const candidate = toCandidate(rule, sheetBase);
			if (!candidate) continue;
			const key = candidateKey(candidate);
			if (!candidates.has(key)) candidates.set(key, candidate);
		}
	}
	return [...candidates.values()];
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}

/** Returns a base64 data URL with the given mime type, keeping only the payload from the FileReader result. */
async function blobToFontDataUrl(blob: Blob): Promise<string> {
	const dataUrl = await readBlobAsDataUrl(blob);
	const payload = dataUrl.slice(dataUrl.indexOf(",") + 1);
	return `data:${blob.type || DEFAULT_FONT_MIME};base64,${payload}`;
}

async function loadFont(candidate: FontCandidate): Promise<SnapshotFont | undefined> {
	try {
		const response = await fetch(candidate.url);
		if (!response.ok) {
			logger.warn("diagnostics", `Could not load icon font ${candidate.family}: HTTP ${response.status}`);
			return undefined;
		}
		const blob = await response.blob();
		if (blob.size > MAX_FONT_BYTES) {
			logger.warn("diagnostics", `Skipped icon font ${candidate.family}: larger than ${MAX_FONT_BYTES} bytes`);
			return undefined;
		}
		const data = await blobToFontDataUrl(blob);
		return { family: candidate.family, weight: candidate.weight, style: candidate.style, data };
	} catch (error) {
		logger.warn("diagnostics", `Could not load icon font ${candidate.family}`, error);
		return undefined;
	}
}

/** Collects the icon fonts a page uses as data URLs, so the replica can draw the same icons. */
export async function collectSnapshotFonts(doc: Document = document): Promise<SnapshotFont[]> {
	const fonts: SnapshotFont[] = [];
	for (const candidate of findCandidates(doc)) {
		if (fonts.length >= MAX_FONT_COUNT) break;
		const font = await loadFont(candidate);
		if (font) fonts.push(font);
	}
	return fonts;
}
