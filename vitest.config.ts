import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// Resolve the workspace package to its source so cross-package tests run without a build.
			"@almeidx/version-check": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
		},
	},
	test: {
		coverage: {
			provider: "v8",
		},
		include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
	},
});
