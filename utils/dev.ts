import { spawn, spawnSync } from "child_process";
import path from "path";

const args = process.argv.slice(2);
const target = args.includes("--firefox") ? "firefox" : "chromium";

const commands = [
	{
		name: "js",
		command: "bun utils/builder-extension.ts",
		color: "cyan",
	},
	{
		name: "css",
		command:
			"sass --watch src/styles/setting.scss out/build/style.css --style=compressed --no-source-map --load-path=node_modules",
		color: "magenta",
	},
	{
		name: "browser",
		command: `web-ext run ${target === "firefox" ? "--pref gfx.webrender.all=true" : "--target=chromium"} --source-dir=./out/dist/${target}`,
		color: "green",
	},
];

console.log(`\nStarting NewTube development environment for ${target}...`);

const templates = spawnSync("bun", ["utils/builder-template.ts"], {
	stdio: "inherit",
	cwd: path.join(__dirname, ".."),
});
if (templates.status !== 0) {
	console.error("Template generation failed");
	process.exit(1);
}

const names = commands.map((commandItem) => commandItem.name).join(",");
const colors = commands.map((commandItem) => commandItem.color).join(",");

const child = spawn(
	"bun",
	[
		"concurrently",
		"--names",
		names,
		"--prefix-colors",
		colors,
		"--kill-others",
		"--raw",
		...commands.map((commandItem) => commandItem.command),
	],
	{
		stdio: "inherit",
		cwd: path.join(__dirname, ".."),
	},
);

child.on("exit", (code) => {
	process.exit(code || 0);
});
