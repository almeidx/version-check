import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/client.ts", "src/cli.ts"],
	format: "esm",
	dts: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	deps: {
		neverBundle: [
			"next",
			"react",
			"@almeidx/version-check",
			"@almeidx/version-check/cli",
			"@almeidx/version-check-react",
			"node:fs/promises",
			"node:path",
		],
	},
});
