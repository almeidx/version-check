import babel from "@rolldown/plugin-babel";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
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
		neverBundle: ["react", "@almeidx/version-check"],
	},
});
