import { initializeDeveloperEnvironment, isDevModulesLoaded } from "@core/runtime/controller";
import { ALL_CONTROLS, CONTROL_GROUPS, defaultBasicStyles, defaultEnabledStyles } from "./quickCustomizeControls";
import { buildBasicCss } from "./quickCustomizeCss";

export class QuickCustomizeController {
	selector = $state("");
	activeTab = $state("basic");
	activeGroup = $state(CONTROL_GROUPS[0].id);
	rawCss = $state("");
	settingName = $state("");
	isEditorLoading = $state(false);

	groups = CONTROL_GROUPS;

	basicStyles = $state<Record<string, string>>(defaultBasicStyles());

	enabledStyles = $state<Record<string, boolean>>(defaultEnabledStyles());

	defaultName = $derived(`Custom: ${this.selector.slice(0, 20)}${this.selector.length > 20 ? "..." : ""}`);

	enabledCount = $derived(Object.values(this.enabledStyles).filter(Boolean).length);

	enabledLabels = $derived(
		ALL_CONTROLS.filter((control) => this.enabledStyles[control.id])
			.map((control) => control.label)
			.join(", "),
	);

	previewStyleElement: HTMLStyleElement | null = null;
	private props: {
		selector: string;
		initialData: any;
		onSave: (data: any) => void;
	};

	constructor(props: { selector: string; initialData: any; onSave: (data: any) => void }) {
		this.props = props;
		this.selector = props.selector;

		const initialData = props.initialData;
		if (initialData) {
			this.settingName = initialData.name;
			this.activeTab = initialData.mode;
			if (initialData.basicStyles) {
				Object.assign(this.basicStyles, initialData.basicStyles);
			}
			if (initialData.enabledStyles) {
				Object.assign(this.enabledStyles, initialData.enabledStyles);
			}
			if (initialData.rawCss) {
				this.rawCss = initialData.rawCss;
			} else {
				this.rawCss = `${this.selector} {\n\t\n}`;
			}
		} else {
			this.rawCss = `${this.selector} {\n\t\n}`;
		}
	}

	groupControls(groupId: string) {
		return this.groups.find((group) => group.id === groupId)?.controls ?? [];
	}

	groupEnabledCount(groupId: string) {
		return this.groupControls(groupId).filter((control) => this.enabledStyles[control.id]).length;
	}

	generateBasicCss() {
		return buildBasicCss(this.selector, this.basicStyles, this.enabledStyles, ALL_CONTROLS);
	}

	applyPreview() {
		if (typeof document === "undefined") return;
		if (!this.previewStyleElement) {
			this.previewStyleElement = document.createElement("style");
			this.previewStyleElement.id = "quick-customize-preview";
			document.head.appendChild(this.previewStyleElement);
		}
		this.previewStyleElement.textContent = this.activeTab === "basic" ? this.generateBasicCss() : this.rawCss;
	}

	async handleTabChange(tab: string) {
		this.activeTab = tab;
		if (tab === "advanced" && !isDevModulesLoaded) {
			this.isEditorLoading = true;
			try {
				await initializeDeveloperEnvironment();
			} finally {
				this.isEditorLoading = false;
			}
		}
	}

	handleSave() {
		this.props.onSave({
			selector: this.selector,
			css: this.activeTab === "basic" ? this.generateBasicCss() : this.rawCss,
			mode: this.activeTab,
			name: this.settingName || this.defaultName,
			metadata: {
				basicStyles: $state.snapshot(this.basicStyles),
				enabledStyles: $state.snapshot(this.enabledStyles),
			},
		});
	}

	destroy() {
		this.previewStyleElement?.remove();
	}
}
