import { ThemeStoreEvent } from "@core/theme/events";

export const STORE_MESSAGE_SOURCE = "newtube-extension";
export const STORE_MESSAGE_DIRECTION = "ext-to-page";

export type StoreReplyType = ThemeStoreEvent.READY | ThemeStoreEvent.INSTALL_STATUS;
export type StoreReplyDetail = { themeId?: string; isInstalled?: boolean };

export function postReplyToStore(type: StoreReplyType, detail?: StoreReplyDetail): void {
	window.postMessage(
		{ source: STORE_MESSAGE_SOURCE, direction: STORE_MESSAGE_DIRECTION, type, detail: detail ?? {} },
		window.location.origin,
	);
}
