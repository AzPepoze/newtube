import type { DiagnosticsReport } from "./types";

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;
const DEFAULT_CAPTURE_WIDTH = 1280;
const DEFAULT_CAPTURE_HEIGHT = 720;

export interface CaptureSize {
	width: number;
	height: number;
}

/** Formats a byte count as KB or MB with one decimal place. */
export function formatReportSize(bytes: number): string {
	if (bytes >= MEGABYTE) return `${(bytes / MEGABYTE).toFixed(1)} MB`;
	return `${(bytes / KILOBYTE).toFixed(1)} KB`;
}

/** The page size the replica was captured at. Falls back when screen details are hidden. */
export function getCaptureSize(report: DiagnosticsReport): CaptureSize {
	const { viewport } = report.environment;
	const rootWidth = report.snapshot?.root?.rect.width ?? 0;
	return {
		width: viewport.width || rootWidth || DEFAULT_CAPTURE_WIDTH,
		height: viewport.height || DEFAULT_CAPTURE_HEIGHT,
	};
}
