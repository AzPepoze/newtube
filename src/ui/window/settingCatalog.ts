import { settingsUi } from "@ui/settings/settingsApi";
import { createStyleShiftWindow } from "@ui/window/windowFactory";
import { unmount } from "svelte";

let catalogWindow: Awaited<ReturnType<typeof createStyleShiftWindow>> | null = null;
let catalogInstance;

export async function openSettingCatalog(onPick: (kind: string) => void) {
	if (catalogWindow) return;

	const targetWindow = await createStyleShiftWindow({
		width: "60%",
		height: "80%",
		title: "Add Setting",
	});
	catalogWindow = targetWindow;

	targetWindow.closeButton.addEventListener("click", () => closeSettingCatalog(), { once: true });

	catalogInstance = settingsUi.settingCatalog(
		{
			onPick: (kind: string) => {
				closeSettingCatalog();
				onPick(kind);
			},
		},
		targetWindow.contentElement,
	);
}

export function closeSettingCatalog() {
	if (!catalogWindow) return;

	const targetWindow = catalogWindow;
	const targetInstance = catalogInstance;
	catalogWindow = null;
	catalogInstance = null;

	if (targetInstance) {
		unmount(targetInstance);
	}
	targetWindow.closeButton.click();
}
