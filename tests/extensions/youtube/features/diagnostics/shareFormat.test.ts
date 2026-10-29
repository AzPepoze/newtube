// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { DEFAULT_EXPOSURE } from "@extensions/youtube/features/diagnostics/exposure";
import { EXPOSURE_SWITCHES } from "@extensions/youtube/features/diagnostics/exposureSwitches";
import { formatReportSize, getCaptureSize } from "@extensions/youtube/features/diagnostics/shareFormat";

test("formatReportSize uses KB below one megabyte and MB above", () => {
	expect(formatReportSize(640 * 1024)).toBe("640.0 KB");
	expect(formatReportSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
});

test("EXPOSURE_SWITCHES covers every ExposureOptions key exactly once", () => {
	const switchKeys = EXPOSURE_SWITCHES.map((item) => item.key).sort();
	expect(switchKeys).toEqual(Object.keys(DEFAULT_EXPOSURE).sort());
});

test("getCaptureSize uses the viewport, then the root width, then 1280x720", () => {
	const base = { environment: { viewport: { width: 1000, height: 600, devicePixelRatio: 1 } } };
	expect(getCaptureSize(base)).toEqual({ width: 1000, height: 600 });

	const hidden = {
		environment: { viewport: { width: 0, height: 0, devicePixelRatio: 1 } },
		snapshot: { root: { rect: { width: 900 } } },
	};
	expect(getCaptureSize(hidden)).toEqual({ width: 900, height: 720 });

	const empty = { environment: { viewport: { width: 0, height: 0, devicePixelRatio: 1 } } };
	expect(getCaptureSize(empty)).toEqual({ width: 1280, height: 720 });
});
