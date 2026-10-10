/**
 * Props for a mounted component that can be updated in place.
 * Values stay raw (no deep Svelte proxies), so the data can be saved to storage.
 */
export function createSettingsProps<T extends Record<string, any>>(initial: T) {
	let data = $state.raw<T>(initial);

	const props = {} as T;
	for (const key of Object.keys(initial)) {
		Object.defineProperty(props, key, { enumerable: true, get: () => data[key] });
	}

	return {
		props,
		update(next: Partial<T>) {
			data = { ...data, ...next };
		},
	};
}
