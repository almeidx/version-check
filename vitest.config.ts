import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: [
			// Resolve workspace packages to source so cross-package tests run without a build.
			{
				find: "@almeidx/version-check/build",
				replacement: fileURLToPath(new URL("./packages/core/src/build-id.ts", import.meta.url)),
			},
			{
				find: "@almeidx/version-check",
				replacement: fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
			},
		],
	},
	test: {
		coverage: {
			provider: "v8",
		},
		include: ["packages/**/*.test.ts", "packages/**/*.test.tsx"],
	},
});
