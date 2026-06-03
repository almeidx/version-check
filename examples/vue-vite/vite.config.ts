import { versionCheck } from "@almeidx/version-check-vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [vue(), versionCheck()],
});
