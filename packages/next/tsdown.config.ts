import babel from "@rolldown/plugin-babel";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/client.ts"],
	format: "esm",
	dts: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	plugins: [
		babel({
			plugins: [["babel-plugin-react-compiler", { target: "19", panicThreshold: "all_errors" }]],
		}),
	],
	deps: {
		neverBundle: [
			"next",
			"react",
			"@almeidx/version-check",
			"@almeidx/version-check-react",
			"node:fs/promises",
			"node:path",
		],
	},
});
