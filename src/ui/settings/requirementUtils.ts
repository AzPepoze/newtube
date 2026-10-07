/**
 * Formats a requirement or condition value into a human-readable string.
 * Used by WarningSection and ConditionStatus components.
 */
export function formatRequirementValue(
	type: string | undefined,
	targetValue: any,
	options?: Record<string, { name: string }>,
): string {
	if (type === "checkbox") {
		return targetValue ? "to be enabled" : "to be disabled";
	}

	const values = Array.isArray(targetValue) ? targetValue : [targetValue];
	const names = values.map((v) => options?.[v]?.name || v);

	if (names.length === 0) return "";
	if (names.length === 1) return `to be ${names[0]}`;

	const lastPart = names.pop();
	return `to be ${names.join(", ")} or ${lastPart}`;
}
