import { readFileSync } from "node:fs";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
	readonly version: string;
};

export default defineConfig({
	define: {
		__VERSION_CHECK_BUILD_ID__: JSON.stringify(process.env.VERSION_CHECK_BUILD_ID ?? packageJson.version),
	},
	plugins: [vue()],
});
