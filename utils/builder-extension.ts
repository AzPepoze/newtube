import * as chokidar from "chokidar";
import dotenv from "dotenv";
import * as esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import * as fs from "fs-extra";
import * as path from "path";

import { esbuildAliases, esbuildExternals, esbuildLoaders } from "./shared/aliases";
import { processOutputDirectory } from "./shared/branding";
import { log } from "./shared/logger";
import { BUILD, DIST_CHROMIUM, DIST_FIREFOX, ensureDir, ENTRYPOINTS, extensionConfig, SRC, TEMP } from "./shared/paths";
import { createSvelteCompilerOptions } from "./shared/svelte";

dotenv.config();

/** Merge theme store hosts from extension.config.json into the MV3 manifest (API + store site). */
function augmentManifestForThemeStore(buildDir: string) {
	const manifestPath = path.join(buildDir, "manifest.json");
	if (!fs.existsSync(manifestPath)) return;

	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
		version?: string;
		host_permissions?: string[];
		content_scripts?: Array<{ matches: string[]; all_frames?: boolean; js: string[]; css: string[]; run_at?: string }>;
		web_accessible_resources?: Array<{ resources: string[]; matches: string[] }>;
	};

	if (extensionConfig.version) {
		manifest.version = extensionConfig.version;
	}

	const hostPerms = new Set<string>(manifest.host_permissions ?? []);
	const storeOrigins: string[] = Array.isArray(extensionConfig.store_origin) ? extensionConfig.store_origin : [];
	const storeMatchPatterns: string[] = [];

	for (const origin of storeOrigins) {
		try {
			const u = new URL(origin);
			hostPerms.add(`${u.protocol}//${u.host}/*`);
			const scheme = u.protocol.replace(":", "");
			storeMatchPatterns.push(`${scheme}://${u.host}${u.port ? `:${u.port}` : ""}/*`);
		} catch {
			/* ignore invalid origin */
		}
	}

	if (extensionConfig.store_api) {
		try {
			const u = new URL(extensionConfig.store_api as string);
			hostPerms.add(`${u.protocol}//${u.host}/*`);
		} catch {
			/* ignore */
		}
	}

	if (!isProduction()) {
		const devPatterns = ["http://localhost/*", "http://127.0.0.1/*"];
		for (const p of devPatterns) {
			hostPerms.add(p);
			storeMatchPatterns.push(p);
		}
	}

	manifest.host_permissions = [...hostPerms];

	const baseCs = manifest.content_scripts?.[0];
	if (baseCs && storeMatchPatterns.length > 0) {
		manifest.content_scripts = [
			...(manifest.content_scripts ?? []),
			{
				matches: storeMatchPatterns,
				all_frames: baseCs.all_frames,
				js: [...baseCs.js],
				css: [...baseCs.css],
				run_at: baseCs.run_at,
			},
		];
	}

	const war = manifest.web_accessible_resources?.[0];
	if (war && storeMatchPatterns.length > 0) {
		const warMatches = new Set<string>(war.matches ?? []);
		for (const p of storeMatchPatterns) warMatches.add(p);
		war.matches = [...warMatches];
	}

	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"), "utf8");
}

const isProduction = () => process.argv.includes("--production") || process.argv.includes("--release");
const isOnce = () => process.argv.includes("--once") || process.argv.includes("--release");

let isBuilding = false;

async function generateBuildInFunctions() {
	const functionsListPath = path.join(SRC, "core/shared/extensionHelpers.ts");
	let functionsListData = "";

	if (fs.existsSync(functionsListPath)) {
		const functionsList = fs.readFileSync(functionsListPath, "utf8");
		const functionNames = [
			...new Set([...functionsList.matchAll(/\bexport\s+(?:async\s+)?function\s+(\w+)\s*\(/g)].map((x) => x[1])),
		];

		// Include functions from star re-exports (e.g. export * from "./dialogs")
		const starExports = [...functionsList.matchAll(/\bexport\s+\*\s+from\s+["']\.\/([\w-]+)["']/g)].map((x) => x[1]);
		for (const exportFile of starExports) {
			const subFilePath = path.join(SRC, `core/shared/${exportFile}.ts`);
			if (fs.existsSync(subFilePath)) {
				const subContent = fs.readFileSync(subFilePath, "utf8");
				const subFunctionNames = [...subContent.matchAll(/\bexport\s+(?:async\s+)?function\s+(\w+)\s*\(/g)].map(
					(x) => x[1],
				);
				functionNames.push(...subFunctionNames);
			}
		}

		const uniqueFunctionNames = [...new Set(functionNames)];
		const wrappableFunctions = uniqueFunctionNames.filter(
			(name) => !new Set(["_call_function", "fireFunctionEventWithReturn", "onFunctionEvent"]).has(name),
		);

		functionsListData = wrappableFunctions
			.map(
				(name) =>
					`StyleShift["buildIn"]["${name}"] = async function(...args){return await StyleShift["buildIn"]["_call_function"]("${name}",...args)};`,
			)
			.join("\n");
	}

	const sharedJsPath = path.join(TEMP, "shared_bundled.js");
	let sharedCode = "";
	if (fs.existsSync(sharedJsPath)) {
		sharedCode = fs.readFileSync(sharedJsPath, "utf8");
	}

	return `(function() {
	var StyleShift = window.StyleShift || {};
	StyleShift["buildIn"] = StyleShift["buildIn"] || {};
	StyleShift["custom"] = StyleShift["custom"] || {};
	StyleShift["logger"] = StyleShift["logger"] || {
			info: (category, ...args) => console.log("%c StyleShift %c [INFO] %c [" + category.toUpperCase() + "]", "color: #bada55", "color: #00ffff", "color: #6a6a6a", ...args),
			warn: (category, ...args) => console.warn("%c StyleShift %c [WARN] %c [" + category.toUpperCase() + "]", "color: #bada55", "color: #ffae00", "color: #6a6a6a", ...args),
			error: (category, ...args) => console.error("%c StyleShift %c [ERROR] %c [" + category.toUpperCase() + "]", "color: #bada55", "color: #ff0000", "color: #6a6a6a", ...args),
			debug: (category, ...args) => console.debug("%c StyleShift %c [DEBUG] %c [" + category.toUpperCase() + "]", "color: #bada55", "color: #888888", "color: #6a6a6a", ...args),
		};
	var SharedScope = {};
	${sharedCode}
	if (typeof SharedScope === 'object') {
		for (var key in SharedScope) {
			if (typeof SharedScope[key] === 'function') StyleShift["buildIn"][key] = SharedScope[key];
		}
	}
	${functionsListData}
	window['StyleShift'] = StyleShift;
})();`;
}

export async function buildExtension() {
	log.step("Bundling extension...");

	try {
		ensureDir(BUILD);
		ensureDir(TEMP);
		ensureDir(path.join(BUILD, "assets/icons"));
		ensureDir(path.join(BUILD, "assets/fonts"));
		ensureDir(path.join(BUILD, "modules"));

		log.info("Building background script...");
		await esbuild.build({
			entryPoints: [path.join(ENTRYPOINTS, "background.ts")],
			bundle: true,
			outfile: path.join(BUILD, "background.js"),
			platform: "browser",
			minify: isProduction(),
			alias: esbuildAliases,
		});

		log.info("Processing shared and communication functions...");
		const sharedEntryTs = path.join(TEMP, "shared_entry.ts");
		const sharedBundledJs = path.join(TEMP, "shared_bundled.js");
		const entryContent = `export * from "@core/shared/domHelpers";\nexport * from "@core/shared/eventHelpers";\nexport * from "@core/communication/webPage";`;
		fs.outputFileSync(sharedEntryTs, entryContent);

		await esbuild.build({
			entryPoints: [sharedEntryTs],
			bundle: true,
			outfile: sharedBundledJs,
			platform: "browser",
			minify: isProduction(),
			alias: esbuildAliases,
			keepNames: true,
			format: "iife",
			globalName: "SharedScope",
		});

		const buildInContent = await generateBuildInFunctions();
		await fs.writeFile(path.join(BUILD, "build-in.js"), buildInContent, "utf8");

		const mainScriptName = `${extensionConfig.name.toLowerCase()}.js`;
		log.info(`Bundling main script: ${mainScriptName}`);
		await esbuild.build({
			entryPoints: [path.join(SRC, "core/index.ts")],
			bundle: true,
			outfile: path.join(BUILD, mainScriptName),
			platform: "browser",
			minify: isProduction(),
			publicPath: "/",
			external: esbuildExternals,
			alias: esbuildAliases,
			plugins: [esbuildSvelte({ compilerOptions: createSvelteCompilerOptions() })],
			define: {
				imgbb_api_key: JSON.stringify(process.env.IMGBB_API_KEY || ""),
				IS_DEV: JSON.stringify(!isProduction()),
			},
			loader: esbuildLoaders,
			assetNames: "assets/[name]",
		});

		log.info("Bundling diagnostics page...");
		await esbuild.build({
			entryPoints: [path.join(ENTRYPOINTS, "diagnostics/page.ts")],
			bundle: true,
			outfile: path.join(BUILD, "diagnostics/page.js"),
			platform: "browser",
			minify: isProduction(),
			external: esbuildExternals,
			alias: esbuildAliases,
			plugins: [esbuildSvelte({ compilerOptions: createSvelteCompilerOptions() })],
			define: {
				imgbb_api_key: JSON.stringify(process.env.IMGBB_API_KEY || ""),
				IS_DEV: JSON.stringify(!isProduction()),
			},
			loader: esbuildLoaders,
		});

		log.info("Copying assets and extension files...");
		fs.copySync(ENTRYPOINTS, BUILD, {
			filter: (src) => !path.relative(ENTRYPOINTS, src).startsWith("modules") && !src.endsWith(".ts"),
		});
		augmentManifestForThemeStore(BUILD);
		if (fs.existsSync(path.join(SRC, "assets"))) {
			fs.copySync(path.join(SRC, "assets"), path.join(BUILD, "assets"));
		}

		const buildWorkersPath = path.join(BUILD, "workers");
		ensureDir(buildWorkersPath);
		const workerEntries = [
			{ src: "extensions/youtube/features/videoAmbient/worker.ts", out: "videoAmbientWorker.js" },
			{ src: "extensions/youtube/features/removeBlackBars/worker.ts", out: "removeBlackBarsWorker.js" },
		];
		for (const entry of workerEntries) {
			const entryPath = path.join(SRC, entry.src);
			if (fs.existsSync(entryPath)) {
				await esbuild.build({
					entryPoints: [entryPath],
					bundle: true,
					outfile: path.join(buildWorkersPath, entry.out),
					platform: "browser",
					minify: isProduction(),
					alias: esbuildAliases,
				});
			}
		}

		log.info("Deploying to distribution folders...");
		fs.emptyDirSync(DIST_CHROMIUM);
		fs.emptyDirSync(DIST_FIREFOX);
		fs.copySync(BUILD, DIST_CHROMIUM);
		fs.copySync(BUILD, DIST_FIREFOX);

		await processOutputDirectory(DIST_CHROMIUM, false);
		await processOutputDirectory(DIST_FIREFOX, true);

		log.success("Extension build completed successfully!");
	} catch (error) {
		log.error("Build failed:", error);
		throw error;
	} finally {
		fs.removeSync(TEMP);
	}
}

async function build() {
	if (isBuilding) return;
	isBuilding = true;
	try {
		await buildExtension();
	} catch (_e) {}
	isBuilding = false;
}

export async function watchExtension() {
	log.info("Watching for changes...");
	chokidar.watch(SRC).on("all", async (event, pathInstance) => {
		console.log(`[${event}] ${path.basename(pathInstance)}`);
		await build();
	});
}

if (require.main === module) {
	if (isOnce()) {
		buildExtension().catch(() => process.exit(1));
	} else {
		build()
			.then(watchExtension)
			.catch(() => process.exit(1));
	}
}
