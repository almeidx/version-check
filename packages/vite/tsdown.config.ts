import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/virtual.ts"],
	format: "esm",
	dts: true,
	sourcemap: true,
	clean: true,
	target: "es2022",
	copy: [{ from: "src/virtual.d.ts", flatten: true }],
	deps: {
		neverBundle: ["vite", "@almeidx/version-check", "@almeidx/version-check/build", /^node:/],
	},
});
