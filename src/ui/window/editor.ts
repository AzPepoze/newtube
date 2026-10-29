import { getElementCenterPosition } from "@core/shared/domHelpers";
import { type Category } from "@settings/types/styleshiftTypes";
import { startHighlighter } from "../highlight/highlight";
import { createMainSettingsUi } from "../settings/settingsManager";

const editorWidth = 400;
export let editorUi: Awaited<ReturnType<typeof createMainSettingsUi>>;
const currentEditObj = {};
let animationFrameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

(async () => {
	editorUi = await createMainSettingsUi({
		showCategoryList: false,
		onCreate: function (styleshiftWindow) {
			styleshiftWindow.windowElement.style.width = editorWidth + "px";
			styleshiftWindow.windowElement.style.minWidth = "300px";

			function updatePosition() {
				const currentTargetElement = currentEditObj["target"];
				if (!currentTargetElement) {
					animationFrameId = requestAnimationFrame(updatePosition);
					return;
				}

				const targetElementCenterPosition = getElementCenterPosition(currentTargetElement);
				const windowElement = styleshiftWindow.windowElement;
				const currentEditorWidth = windowElement.offsetWidth;
				const currentEditorHeight = windowElement.offsetHeight;
				const targetBoundingRect = currentTargetElement.getBoundingClientRect();
				const viewportPadding = 20;

				let calculatedPositionX =
					targetElementCenterPosition.x < window.innerWidth / 2
						? targetBoundingRect.right + 10
						: targetBoundingRect.left - currentEditorWidth - 10;

				let calculatedPositionY = targetElementCenterPosition.y - currentEditorHeight / 2;

				calculatedPositionX = Math.max(
					viewportPadding,
					Math.min(calculatedPositionX, window.innerWidth - currentEditorWidth - viewportPadding),
				);

				calculatedPositionY = Math.max(
					viewportPadding,
					Math.min(calculatedPositionY, window.innerHeight - currentEditorHeight - viewportPadding),
				);

				windowElement.style.translate = `${calculatedPositionX}px ${calculatedPositionY}px`;

				animationFrameId = requestAnimationFrame(updatePosition);
			}

			updatePosition();

			resizeObserver = new ResizeObserver(() => {});

			const initialTarget = currentEditObj["target"];
			if (initialTarget) {
				resizeObserver.observe(initialTarget);
			}

			styleshiftWindow.dragHandle.addEventListener("mousedown", () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
			});

			styleshiftWindow.closeButton.addEventListener("click", () => {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
				if (resizeObserver) {
					resizeObserver.disconnect();
					resizeObserver = null;
				}
				startHighlighter();
			});
		},
	});
})();

export async function createEditorUi(targetElement: HTMLElement, categories: Category[]) {
	currentEditObj["target"] = targetElement;
	currentEditObj["Categories"] = categories;
	editorUi.setGetCategory(() => categories);
	editorUi.createUi();
}
