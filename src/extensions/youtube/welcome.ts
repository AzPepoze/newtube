import { getRootValue, saveRootValue } from "@core/storage/manager";
import { showUserConfirmation } from "@ui/window/windowFactory";
import { mount, unmount } from "svelte";
import Welcome from "./views/Welcome.svelte";

let welcomeOpen = false;

function mountWelcome(onDone?: () => void | Promise<void>): void {
	if (welcomeOpen) return;

	welcomeOpen = true;
	const target = document.createElement("div");
	target.id = "NewTube-Welcome-Root";
	document.body.appendChild(target);

	let component: ReturnType<typeof mount>;
	component = mount(Welcome, {
		target,
		intro: true,
		props: {
			onDone: async () => {
				try {
					await onDone?.();
				} finally {
					unmount(component);
					target.remove();
					welcomeOpen = false;
				}
			},
		},
	});
}

export function showWelcome(): void {
	mountWelcome();
}

export async function checkAndShowWelcome(): Promise<void> {
	const hasShown = await getRootValue("welcomeShown");

	if (!hasShown) {
		const hasTime = await showUserConfirmation("Do you have a moment?", "Welcome to NewTube!", {
			confirmLabel: "Uh.. Yes?",
			cancelLabel: "Nope",
		});

		if (!hasTime) {
			await saveRootValue("welcomeShown", true);
			return;
		}

		mountWelcome(async () => {
			await saveRootValue("welcomeShown", true);
		});
	}
}
