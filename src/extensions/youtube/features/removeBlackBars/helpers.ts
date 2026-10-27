import type { BarDetectionData, BarEdgeSamples, BarSample } from "./types";

export function checkPixelDiff(
	r1: number,
	g1: number,
	b1: number,
	r2: number,
	g2: number,
	b2: number,
	threshold: number,
) {
	return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) > threshold;
}

export function calculateBarDimension(values: BarSample[], currentLastValue: number): number {
	const validValues = values.filter((v): v is number => typeof v === "number");
	if (validValues.length < 3) return currentLastValue;

	const frequencyMap = new Map<number, number>();
	for (const val of validValues) {
		const rounded = Math.round(val / 5) * 5; // Group in 5px bins
		frequencyMap.set(rounded, (frequencyMap.get(rounded) || 0) + 1);
	}

	let maxFreq = 0;
	let bestValue = currentLastValue;

	for (const [val, freq] of frequencyMap.entries()) {
		if (freq > maxFreq || (freq === maxFreq && val > bestValue)) {
			maxFreq = freq;
			bestValue = val;
		}
	}

	return maxFreq >= 3 ? bestValue : currentLastValue;
}

function hasSimilarBarSize(values: BarSample[], expectedSize: number): boolean {
	return values.some((value) => typeof value === "number" && Math.abs(value - expectedSize) <= 5);
}

export function calculatePairedBarDimension(samples: BarEdgeSamples, currentLastValue: number): number {
	const startSize = calculateBarDimension(samples.start, -1);
	const endSize = calculateBarDimension(samples.end, -1);
	const candidates = [
		startSize !== -1 && hasSimilarBarSize(samples.end, startSize) ? startSize : -1,
		endSize !== -1 && hasSimilarBarSize(samples.start, endSize) ? endSize : -1,
	];
	const detectedSize = Math.max(...candidates);

	return detectedSize === -1 ? currentLastValue : detectedSize;
}

export async function detectVerticalBars(
	verticalImgData: Uint8ClampedArray,
	videoHeight: number,
	verticalR: number,
	verticalG: number,
	verticalB: number,
	threshold: number,
	pixelBudget?: number,
	verticalCtx?: CanvasRenderingContext2D | null,
): Promise<BarEdgeSamples> {
	const heightsFound: BarEdgeSamples = { start: [], end: [] };
	let pixelsChecked = 0;

	const isDifferentVertical = (dataArray: Uint8ClampedArray, base: number) =>
		checkPixelDiff(
			dataArray[base],
			dataArray[base + 1],
			dataArray[base + 2],
			verticalR,
			verticalG,
			verticalB,
			threshold,
		);

	if (verticalCtx) verticalCtx.fillStyle = "red";

	for (let x = 0; x < 5; x++) {
		let top = -1;
		let bottom = -1;

		for (let i = 5; i < videoHeight / 2; i++) {
			pixelsChecked++;
			if (isDifferentVertical(verticalImgData, (i * 5 + x) * 4)) {
				top = i;
				break;
			}
			if (verticalCtx) verticalCtx.fillRect(x, i, 1, 1);
			if (pixelBudget && pixelBudget > 0 && pixelsChecked >= pixelBudget) {
				await new Promise((r) => setTimeout(r, 1));
				pixelsChecked = 0;
			}
		}

		for (let i = videoHeight - 5; i > videoHeight / 2; i--) {
			pixelsChecked++;
			if (isDifferentVertical(verticalImgData, (i * 5 + x) * 4)) {
				bottom = videoHeight - i;
				break;
			}
			if (verticalCtx) verticalCtx.fillRect(x, i, 1, 1);
			if (pixelBudget && pixelBudget > 0 && pixelsChecked >= pixelBudget) {
				await new Promise((r) => setTimeout(r, 1));
				pixelsChecked = 0;
			}
		}

		heightsFound.start.push(top === -1 ? "inf" : top);
		heightsFound.end.push(bottom === -1 ? "inf" : bottom);
	}

	return heightsFound;
}

export async function detectHorizontalBars(
	horizontalImgData: Uint8ClampedArray,
	videoWidth: number,
	horizontalR: number,
	horizontalG: number,
	horizontalB: number,
	threshold: number,
	pixelBudget?: number,
	horizontalCtx?: CanvasRenderingContext2D | null,
): Promise<BarEdgeSamples> {
	const widthsFound: BarEdgeSamples = { start: [], end: [] };
	let pixelsChecked = 0;

	const isDifferentHorizontal = (dataArray: Uint8ClampedArray, base: number) =>
		checkPixelDiff(
			dataArray[base],
			dataArray[base + 1],
			dataArray[base + 2],
			horizontalR,
			horizontalG,
			horizontalB,
			threshold,
		);

	if (horizontalCtx) horizontalCtx.fillStyle = "red";

	for (let y = 0; y < 5; y++) {
		let left = -1;
		let right = -1;

		for (let i = 5; i < videoWidth / 2; i++) {
			pixelsChecked++;
			if (isDifferentHorizontal(horizontalImgData, (y * videoWidth + i) * 4)) {
				left = i;
				break;
			}
			if (horizontalCtx) horizontalCtx.fillRect(i, y, 1, 1);
			if (pixelBudget && pixelBudget > 0 && pixelsChecked >= pixelBudget) {
				await new Promise((r) => setTimeout(r, 1));
				pixelsChecked = 0;
			}
		}

		for (let i = videoWidth - 5; i > videoWidth / 2; i--) {
			pixelsChecked++;
			if (isDifferentHorizontal(horizontalImgData, (y * videoWidth + i) * 4)) {
				right = videoWidth - i;
				break;
			}
			if (horizontalCtx) horizontalCtx.fillRect(i, y, 1, 1);
			if (pixelBudget && pixelBudget > 0 && pixelsChecked >= pixelBudget) {
				await new Promise((r) => setTimeout(r, 1));
				pixelsChecked = 0;
			}
		}

		widthsFound.start.push(left === -1 ? "inf" : left);
		widthsFound.end.push(right === -1 ? "inf" : right);
	}

	return widthsFound;
}

export async function detectBlackBars(
	data: BarDetectionData,
	verticalCtx?: CanvasRenderingContext2D | null,
	horizontalCtx?: CanvasRenderingContext2D | null,
) {
	const {
		verticalImgData,
		videoHeight,
		videoWidth = 0,
		mode = "vertical",
		threshold,
		verticalR,
		verticalG,
		verticalB,
		horizontalR = verticalR,
		horizontalG = verticalG,
		horizontalB = verticalB,
		pixelBudget,
		horizontalImgData,
		currentLastHeight = 0,
		currentLastWidth = 0,
	} = data;

	const runVertical = mode === "vertical" || mode === "both";
	const runHorizontal = (mode === "horizontal" || mode === "both") && !!horizontalImgData && videoWidth > 0;

	const [heightsFound, widthsFound] = await Promise.all([
		runVertical
			? detectVerticalBars(
					verticalImgData,
					videoHeight,
					verticalR,
					verticalG,
					verticalB,
					threshold,
					pixelBudget,
					verticalCtx,
				)
			: Promise.resolve({ start: [], end: [] } as BarEdgeSamples),
		runHorizontal
			? detectHorizontalBars(
					horizontalImgData!,
					videoWidth,
					horizontalR,
					horizontalG,
					horizontalB,
					threshold,
					pixelBudget,
					horizontalCtx,
				)
			: Promise.resolve({ start: [], end: [] } as BarEdgeSamples),
	]);

	const heightResult = runVertical ? calculatePairedBarDimension(heightsFound, currentLastHeight) : currentLastHeight;
	const widthResult = runHorizontal ? calculatePairedBarDimension(widthsFound, currentLastWidth) : currentLastWidth;

	return { heightResult, widthResult };
}
