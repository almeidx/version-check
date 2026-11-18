import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/client.ts"],
	format: "esm",
	dts: { tsconfig: "./tsconfig.build.json" },
	sourcemap: true,
	clean: true,
	target: "es2022",
});
