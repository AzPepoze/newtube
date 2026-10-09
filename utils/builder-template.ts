import { convertToExportSetting } from "../src/core/theme/exportConverter";
import { createAllSettingPresets } from "../src/settings/registry/defaultItems";
import * as fs from "fs-extra";
import * as path from "path";
import { SRC, BUILD, TEMPLATE, extensionConfig, ensureDir } from "./shared/paths";
import { log } from "./shared/logger";

const SETTINGS_OUT_DIR = path.join(TEMPLATE, "settings");
const PROD_TYPES_DIR = path.join(BUILD, "types");
const TYPE_FILE_NAME = `${extensionConfig.name}.d.ts`;
const METADATA_FILE_NAME = `${extensionConfig.name}-Metadata.json`;

async function createSettingFolder(categoryFolderPath: string, thisSetting: any) {
	const settingFolderName = thisSetting.type.toLowerCase().replace(/\s+/g, "-");
	const settingsFolderPath = path.join(categoryFolderPath, settingFolderName);

	ensureDir(settingsFolderPath);

	await convertToExportSetting(thisSetting, async (fileName, fileData) => {
		fs.writeFileSync(path.join(settingsFolderPath, fileName), fileData);
	});

	fs.writeFileSync(path.join(settingsFolderPath, "config.json"), JSON.stringify(thisSetting, null, 2));
}

function normalizeParams(rawParams: string): string {
	return rawParams.replace(/\s+/g, " ").trim();
}

function extractMetadata(content: string, fileName: string) {
	const metadata: any[] = [];
	const regex = /\/\*\*([\s\S]*?)\*\/[\s\r\n]*export\s+(async\s+)?function\s+(\w+)\s*\(([\s\S]*?)\)/g;
	let match;
	while ((match = regex.exec(content)) !== null) {
		const [_full, jsdoc, isAsync, name, rawParams] = match;
		const params = normalizeParams(rawParams);
		metadata.push({
			label: name,
			type: "function",
			file: fileName,
			detail: `(${params}) => ${isAsync ? "Promise<any>" : "any"}`,
			info: jsdoc
				.replace(/\*\/$/, "")
				.replace(/^\/\*\*/, "")
				.replace(/^\s*\* ?/gm, "")
				.trim(),
		});
	}

	const simpleRegex = /(?!\/\*\*[\s\S]*?)\bexport\s+(async\s+)?function\s+(\w+)\s*\(([\s\S]*?)\)/g;
	while ((match = simpleRegex.exec(content)) !== null) {
		const [_, isAsync, name, rawParams] = match;
		const params = normalizeParams(rawParams);
		if (!metadata.find((m) => m.label === name)) {
			metadata.push({
				label: name,
				type: "function",
				file: fileName,
				detail: `(${params}) => ${isAsync ? "Promise<any>" : "any"}`,
			});
		}
	}
	return metadata;
}

export async function buildTemplates() {
	log.info("Generating UI Templates...");
	ensureDir(SETTINGS_OUT_DIR);
	for (const thisPreset of createAllSettingPresets()) {
		await createSettingFolder(SETTINGS_OUT_DIR, thisPreset);
	}

	log.info("Generating Type Definitions...");
	const sharedFunctionsDir = path.join(SRC, "core/shared");
	const sharedUtilitiesDir = path.join(SRC, "shared");
	const coreUtilsDir = path.join(SRC, "core/utils");
	const commDir = path.join(SRC, "core/communication");

	const sourceFiles = [
		path.join(sharedFunctionsDir, "domHelpers.ts"),
		path.join(sharedFunctionsDir, "extensionHelpers.ts"),
		path.join(sharedFunctionsDir, "notifications.ts"),
		path.join(sharedFunctionsDir, "dialogs.ts"),
		path.join(sharedFunctionsDir, "importExport.ts"),
		path.join(sharedFunctionsDir, "webPageLogger.ts"),
		path.join(sharedUtilitiesDir, "utilities.ts"),
		path.join(coreUtilsDir, "colorConversion.ts"),
		path.join(commDir, "webPage.ts"),
	];

	let allMetadata: any[] = [];
	for (const filePath of sourceFiles) {
		if (fs.existsSync(filePath)) {
			const content = fs.readFileSync(filePath, "utf-8");
			allMetadata = [...allMetadata, ...extractMetadata(content, path.basename(filePath))];
		}
	}

	allMetadata.push(
		{
			label: "setValue",
			type: "function",
			file: "webPage.ts",
			detail: "(id: string, value: any) => void",
			info: `Sets a value in the ${extensionConfig.name} storage.`,
		},
		{
			label: "getValue",
			type: "function",
			file: "webPage.ts",
			detail: "(id: string) => any",
			info: `Gets a value from the ${extensionConfig.name} storage.`,
		},
	);

	const combinedSignatures = allMetadata
		.map((m) => `    /** ${m.info || m.label} */\n    function ${m.label}${m.detail.replace(" => ", ": ")};`)
		.join("\n");

	const dTsContent = `/**\n * ${extensionConfig.name} Global API\n */\ndeclare global {\n${combinedSignatures}\n}\nexport {};`;
	const metadataJson = JSON.stringify(allMetadata, null, 2);

	ensureDir(TEMPLATE);
	fs.writeFileSync(path.join(TEMPLATE, TYPE_FILE_NAME), dTsContent);

	const templateTsconfig = {
		compilerOptions: {
			target: "es2022",
			module: "esnext",
			moduleResolution: "node",
			strict: true,
			skipLibCheck: true,
			lib: ["es2022", "dom"],
			ignoreDeprecations: "6.0",
		},
		include: ["**/*.js", "**/*.ts", TYPE_FILE_NAME],
	};
	fs.writeFileSync(path.join(TEMPLATE, "tsconfig.json"), JSON.stringify(templateTsconfig, null, 2));

	ensureDir(PROD_TYPES_DIR);
	fs.writeFileSync(path.join(PROD_TYPES_DIR, METADATA_FILE_NAME), metadataJson);
	fs.writeFileSync(path.join(PROD_TYPES_DIR, TYPE_FILE_NAME), dTsContent);
}

if (require.main === module) {
	buildTemplates().catch((err) => log.error("Templates build failed", err));
}
