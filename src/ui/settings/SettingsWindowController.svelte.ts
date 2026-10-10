import { saveAndRefreshAll } from "@core/runtime/controller";
import { shiftCategory } from "@settings/registry/category";
import { getAddOnItems } from "@settings/registry/items";
import type { Category, SeparateCategory } from "@settings/types/styleshiftTypes";
import { addDrag, addDropTarget, clearDropTargets, removeDropTarget } from "@ui/settings/reorder";
import { getCategoryParts } from "@ui/window/utils";

export interface SettingsWindowProps {
	internalSettings: (Category | SeparateCategory)[];
	externalSettings: Category[];
	devOnlyItems: Category[];
	isDeveloperMode: boolean;
	isDevModulesLoaded: boolean;
	onAddCategory: () => void | Promise<void>;
}

export class SettingsWindowController {
	// State
	searchQuery = $state("");
	leftSidebar = $state<HTMLElement | null>(null);
	activeCategoryLabel = $state("");
	sidebarWidth = $state(200);

	// Props reference
	#props: SettingsWindowProps;

	constructor(props: SettingsWindowProps) {
		this.#props = props;
	}

	// Derived data
	internalData = $derived.by(() => {
		return this.#filterAndProcess(this.#props.internalSettings, this.#props.externalSettings, true);
	});

	externalCategoriesData = $derived.by(() => {
		return this.#filterAndProcess(this.#props.externalSettings, this.#props.internalSettings, false) as Category[];
	});

	buildInItemsData = $derived.by(() => {
		return this.internalData.filter((item) => this.isHeaderItem(item) || !item.editable);
	});

	addOnItemsData = $derived.by(() => {
		return [
			...this.internalData.filter((item) => !this.isHeaderItem(item) && item.editable),
			...this.externalCategoriesData,
		];
	});

	sidebarData = $derived.by(() => {
		const result: (Category | SeparateCategory)[] = [];
		if (this.buildInItemsData.length > 0) {
			result.push(...this.buildInItemsData);
		}
		if (this.addOnItemsData.length > 0) {
			result.push({ isHeader: true, label: "ADD-ON" }, ...this.addOnItemsData);
		}
		return result;
	});

	// Helpers
	isHeaderItem(item: Category | SeparateCategory): item is SeparateCategory {
		return "isHeader" in item;
	}

	#getVisibleSettings(settings: any[]) {
		return settings.filter((s) => s.type !== "conditionSetting" || this.#props.isDeveloperMode);
	}

	#categoryLabel(item: Category | SeparateCategory): string {
		return getCategoryParts((item as Category).category).text;
	}

	#findCategoryIndex(categories: (Category | SeparateCategory)[], label: string): number {
		return categories.findIndex((item) => !this.isHeaderItem(item) && this.#categoryLabel(item) === label);
	}

	#insertDevCategory(categories: (Category | SeparateCategory)[], devCategory: Category | SeparateCategory) {
		const anchorLabel = (devCategory as Category & { insertAfter?: string }).insertAfter;
		const anchorIndex = anchorLabel ? this.#findCategoryIndex(categories, anchorLabel) : -1;

		if (anchorIndex >= 0) {
			categories.splice(anchorIndex + 1, 0, devCategory);
			return;
		}
		categories.push(devCategory);
	}

	#mergeDevItems(
		categories: (Category | SeparateCategory)[],
		allCategories: (Category | SeparateCategory)[],
		pushMissing: boolean = true,
	) {
		if (!this.#props.isDevModulesLoaded || !this.#props.isDeveloperMode) return categories;

		for (const devCategory of this.#props.devOnlyItems.filter((item) => !this.isHeaderItem(item))) {
			const devLabel = this.#categoryLabel(devCategory);
			const target = categories.find(
				(item) => !this.isHeaderItem(item) && this.#categoryLabel(item) === devLabel,
			) as Category;

			if (target) {
				target.settings = [...target.settings, ...(devCategory as Category).settings];
			} else if (pushMissing && this.#findCategoryIndex(allCategories, devLabel) === -1) {
				this.#insertDevCategory(categories, devCategory);
			}
		}
		return categories;
	}

	#filterAndProcess(
		items: (Category | SeparateCategory)[],
		otherItems: (Category | SeparateCategory)[],
		pushMissing: boolean,
	) {
		const processed = items.map((item) => {
			if (this.isHeaderItem(item)) return item;
			return { ...item, settings: this.#getVisibleSettings(item.settings) };
		});

		const merged = this.#mergeDevItems(processed, otherItems, pushMissing);
		return this.searchQuery ? this.#applySearch(merged) : merged;
	}

	#applySearch(categories: (Category | SeparateCategory)[]) {
		const query = this.searchQuery.toLowerCase();

		return categories
			.map((item) => {
				if (this.isHeaderItem(item)) return item;

				const matches = item.settings.filter((s: any) => {
					const name = s.name?.toLowerCase() || "";
					const desc = s.description?.toLowerCase() || "";
					return name.includes(query) || desc.includes(query);
				});

				return { ...item, settings: matches };
			})
			.filter((item) => this.isHeaderItem(item) || item.settings.length > 0);
	}

	// Actions
	async moveCategory(category: Category, direction: "up" | "down") {
		if (shiftCategory(getAddOnItems(), category, direction)) await saveAndRefreshAll();
	}

	sidebarKey(item: Category | SeparateCategory): string {
		return this.isHeaderItem(item) ? `header:${item.label}` : `category:${this.#categoryLabel(item)}`;
	}

	setupDragAndDrop(node: HTMLElement, item: Category | SeparateCategory) {
		if (this.isHeaderItem(item) || !this.#props.isDeveloperMode || !(item as Category).editable) return;

		const dragHandle = node.querySelector(".drag-handle") as HTMLElement;
		if (!dragHandle) return;

		addDrag(dragHandle, node, this.leftSidebar, item);
		addDropTarget(node, this.leftSidebar!, item, "category");

		return {
			update: (next: Category) => addDropTarget(node, this.leftSidebar!, next, "category"),
			destroy: () => removeDropTarget(node),
		};
	}

	clearTargets() {
		clearDropTargets();
	}

	handleResizeKeys = (event: KeyboardEvent) => {
		if (event.key === "ArrowLeft") this.sidebarWidth = Math.max(100, this.sidebarWidth - 10);
		else if (event.key === "ArrowRight") this.sidebarWidth = this.sidebarWidth + 10;
	};

	handleResizeStart = (event: MouseEvent) => {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = this.sidebarWidth;

		const onMouseMove = (moveEvent: MouseEvent) => {
			this.sidebarWidth = Math.max(100, startWidth + (moveEvent.clientX - startX));
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	handleAddCategory = () => {
		void this.#props.onAddCategory();
	};
}
