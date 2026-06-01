import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	format: "esm",
	dts: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	deps: {
		neverBundle: ["vue", "@almeidx/version-check", "@almeidx/version-check/cli"],
	},
});
