import { getRootValue, saveRootValue } from "@core/storage/manager";
import { logger } from "@shared/logger";

const TUTORIAL_SEEN_KEY = "tutorialSeen";

export async function hasSeenTutorial(): Promise<boolean> {
	try {
		return (await getRootValue(TUTORIAL_SEEN_KEY)) === true;
	} catch (error) {
		logger.warn("tutorial", "Could not read the tutorial seen flag", error);
		return false;
	}
}

export async function markTutorialSeen(): Promise<void> {
	try {
		await saveRootValue(TUTORIAL_SEEN_KEY, true);
	} catch (error) {
		logger.warn("tutorial", "Could not persist the tutorial seen flag", error);
	}
}
