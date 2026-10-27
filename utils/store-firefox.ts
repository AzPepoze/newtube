import { execFileSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

async function storeFirefox() {
	const apiKey = process.env.AMO_JWT_ISSUER;
	const apiSecret = process.env.AMO_JWT_SECRET;
	const sourceDir = path.resolve("out/dist/firefox");

	if (!apiKey || !apiSecret || !existsSync(sourceDir)) {
		console.error("Missing environment variables for Firefox Add-ons upload.");
		process.exit(1);
	}

	console.log(`Starting Firefox Add-ons upload from: ${sourceDir}`);

	try {
		const args = [
			"x",
			"web-ext",
			"sign",
			"--api-key",
			apiKey,
			"--api-secret",
			apiSecret,
			"--source-dir",
			sourceDir,
			"--artifacts-dir",
			"out/signed",
			"--channel",
			"listed",
			"--approval-timeout",
			"0",
		];

		console.log("Executing web-ext sign...");
		execFileSync("bun", args, { stdio: "inherit" });
		console.log("Submitted to Firefox Add-ons. Approval and signing will continue on Mozilla's servers.");
	} catch (_error) {
		console.error("Firefox Add-ons upload failed.");
		process.exit(1);
	}
}

storeFirefox().catch((err) => {
	console.error("Fatal error in Firefox Add-ons upload:", err);
	process.exit(1);
});
