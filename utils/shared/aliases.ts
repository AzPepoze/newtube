import * as path from "path";
import { SRC } from "./paths";

export const esbuildAliases = {
	"@": SRC,
	"@core": path.join(SRC, "core"),
	"@ui": path.join(SRC, "ui"),
	"@settings": path.join(SRC, "settings"),
	"@extensions": path.join(SRC, "extensions"),
	"@shared": path.join(SRC, "shared"),
};

export const esbuildLoaders = {
	".ttf": "file",
	".woff": "file",
	".woff2": "file",
	".eot": "file",
	".png": "file",
} as const;

export const esbuildExternals = [
	"jszip",
	"codemirror",
	"@codemirror/view",
	"@codemirror/state",
	"@codemirror/lang-javascript",
	"@codemirror/lang-css",
	"@codemirror/autocomplete",
];
