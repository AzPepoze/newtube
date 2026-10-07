import type { Setting } from "@settings/types/styleshiftTypes";
import { formatRequirementValue } from "../shared/requirementUtils";

export class WarningSectionController {
	isLocked = $state(false);
	lockMessage = $state("");
	requirementsMet = $state(true);
	require = $state<Setting["require"]>();
	requiredSettings = $state<Record<string, { name: string; value: any; type: string; options?: any }>>({});

	constructor(props: {
		isLocked: boolean;
		lockMessage?: string;
		requirementsMet: boolean;
		require?: Setting["require"];
		requiredSettings: Record<string, { name: string; value: any; type: string; options?: any }>;
	}) {
		this.isLocked = props.isLocked;
		this.lockMessage = props.lockMessage || "";
		this.requirementsMet = props.requirementsMet;
		this.require = props.require;
		this.requiredSettings = props.requiredSettings;
	}

	get unmetRequirements() {
		if (!this.require) return [];
		return Object.keys(this.require)
			.filter((reqId) => {
				const reqValue = this.require![reqId];
				const actualValue = this.requiredSettings[reqId]?.value;
				return actualValue !== reqValue;
			})
			.map((reqId) => {
				const reqValue = this.require![reqId];
				const info = this.requiredSettings[reqId];
				return {
					id: reqId,
					name: info?.name || reqId,
					type: info?.type,
					requiredValue: reqValue,
					options: info?.options,
				};
			});
	}

	formatValue(req: any) {
		return formatRequirementValue(req.type, req.requiredValue, req.options);
	}
}
