import { versionCheck } from "@almeidx/version-check-vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), versionCheck()],
});
