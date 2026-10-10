/**
 * Creates a runner that ensures only one async task runs at a time.
 * If tasks are requested while one is running, it will run exactly once more
 * with the latest state after the current task finishes.
 *
 * @param {Function} task - The async function to sequence.
 * @returns {Function} A wrapped version of the function that handles sequencing.
 *
 * @example
 * const safeSave = sequencedTask(async (data) => { await api.save(data); });
 * safeSave(d1);
 * safeSave(d2); // Will run after d1 completes
 */
export function sequencedTask(task: Function): Function {
	let isRunning = false;
	let pendingArgs: any[] | null = null;

	return async function (...args: any[]) {
		if (isRunning) {
			pendingArgs = args;
			return;
		}

		isRunning = true;
		try {
			let currentArgs: any[] | null = args;
			while (currentArgs) {
				pendingArgs = null;
				await task(...currentArgs);
				currentArgs = pendingArgs;
			}
		} finally {
			isRunning = false;
		}
	};
}

/**
 * Creates a debounced version of a function that delays its execution until after
 * a specified number of milliseconds have elapsed since the last time it was invoked.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} The debounced function.
 *
 * @example
 * const handleResize = debounce(() => console.log("Resized!"), 250);
 * window.addEventListener("resize", handleResize);
 */
export function debounce(func: Function, wait: number): Function {
	let timeout: any;
	return function (...args: any[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Returns a promise that resolves after a specified delay.
 *
 * @param {number} delay - The delay in milliseconds.
 * @returns {Promise<void>}
 *
 * @example
 * await sleep(1000); // Wait for 1 second
 */
export function sleep(delay: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Generates a consistent numerical hash from a string.
 *
 * @param {string} str - The input string.
 * @returns {number} The generated hash.
 *
 * @example
 * const hash = stringToNumber("StyleShift");
 */
export function stringToNumber(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return Math.abs(hash);
}

/**
 * Generates a random integer between a minimum and maximum value (inclusive) using a seed.
 * Useful for deterministic "randomness".
 *
 * @param {number} minimum - The lower bound.
 * @param {number} maximum - The upper bound.
 * @param {string | number} seed - The seed for the random number generator.
 * @returns {number} A random integer between minimum and maximum.
 *
 * @example
 * const rand = randomNumberInRange(1, 100, "mySeed");
 */
export function randomNumberInRange(minimum: number, maximum: number, seed: string | number): number {
	const numericalSeed = typeof seed === "string" ? stringToNumber(seed) : seed;

	const a = 931;
	const c = 49297;
	const m = 233280;

	let currentSeed = numericalSeed;

	const random = (): number => {
		currentSeed = (currentSeed * a + c) % m;
		return currentSeed / m;
	};

	return Math.floor(minimum + random() * (maximum - minimum + 1));
}

/**
 * Generates a random alphanumeric unique ID of a specified length.
 *
 * @param {number} length - The length of the ID.
 * @returns {string} The generated unique ID.
 *
 * @example
 * const id = createUniqueId(10); // e.g., "A1b2C3d4E5"
 */
export function createUniqueId(length: number): string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let uniqueId = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		uniqueId += charset[randomIndex];
	}

	return uniqueId;
}

/**
 * Creates a deep copy of an object using JSON serialization.
 * Note: Does not support functions, undefined, or circular references.
 *
 * @param {any} data - The data to clone.
 * @returns {any} The deep cloned data.
 *
 * @example
 * const copy = deepClone(myObject);
 */
export function deepClone(data: any): any {
	return JSON.parse(JSON.stringify(data));
}

/**
 * Recursively sorts object keys without changing array order.
 */
export function sortObjectKeys<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => sortObjectKeys(item)) as T;
	}

	if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
		return Object.keys(value)
			.sort()
			.reduce(
				(sorted, key) => {
					sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
					return sorted;
				},
				{} as Record<string, unknown>,
			) as T;
	}

	return value;
}

/**
 * Triggers a file download in the browser with the specified data and filename.
 *
 * @param {BlobPart} data - The content of the file.
 * @param {string} filename - The name of the file to be saved as.
 *
 * @example
 * downloadFile('{"test": true}', "config.json");
 */
export function downloadFile(data: BlobPart, filename: string): void {
	const file = new Blob([data]);
	const a = document.createElement("a"),
		url = URL.createObjectURL(file);
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	setTimeout(function () {
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}, 0);
}
