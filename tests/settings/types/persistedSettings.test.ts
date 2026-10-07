// @ts-nocheck -- Bun's test globals are not part of the extension TypeScript program.
import { expect, test } from "bun:test";
import { assertCanonicalPersistedItems } from "../../../src/settings/types/persistedSettings";

const canonicalItems = [
	{
		category: "Test",
		settings: [{ type: "checkbox", id: "enabled", name: "Enabled", value: true }],
	},
];

test("accepts canonical persisted settings", () => {
	expect(() => assertCanonicalPersistedItems(canonicalItems)).not.toThrow();
});

test.each(["Selector", "Highlight_color", "setup_"])("rejects legacy field %s at any depth", (legacyField) => {
	const payload = structuredClone(canonicalItems) as Array<Record<string, unknown>>;
	(payload[0].settings as Array<Record<string, unknown>>)[0].nested = { [legacyField]: "legacy" };
	expect(() => assertCanonicalPersistedItems(payload)).toThrow("Migration required");
});

test("rejects an unsupported setting type", () => {
	const payload = structuredClone(canonicalItems) as Array<Record<string, unknown>>;
	(payload[0].settings as Array<Record<string, unknown>>)[0].type = "unknown";
	expect(() => assertCanonicalPersistedItems(payload)).toThrow("not a supported setting type");
});
