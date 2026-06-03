export * from "@almeidx/version-check";

import { resolve as resolvePath } from "node:path";
import { createVersionFileContent, resolveBuildId } from "@almeidx/version-check/build";
import type { Plugin, UserConfig } from "vite";

const defaultFileName = "version.json";
const defaultDefineName = "__VERSION_CHECK_BUILD_ID__";
const virtualModuleId = "virtual:version-check/build-id";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

/** Options for {@link versionCheck}. */
export type VersionCheckViteOptions = {
	/**
	 * Explicit build id override.
	 *
	 * @defaultValue resolved from deployment env, git, package.json, then `"local-dev"`
	 */
	readonly buildId?: string | undefined;
	/**
	 * Emitted/served version asset name.
	 *
	 * @defaultValue `"version.json"`
	 */
	readonly fileName?: string | undefined;
	/**
	 * Global constant to inject with Vite define semantics. Pass `false` to disable it.
	 *
	 * @defaultValue `"__VERSION_CHECK_BUILD_ID__"`
	 */
	readonly define?: string | false | undefined;
};

function normalizeFileName(fileName: string | undefined): string {
	const normalized = (fileName ?? defaultFileName).replace(/^\/+/, "");
	if (normalized.length === 0) {
		throw new Error("[version-check] fileName must not be empty.");
	}

	return normalized;
}

function resolveDefineName(define: VersionCheckViteOptions["define"]): string | undefined {
	return define === false ? undefined : (define ?? defaultDefineName);
}

/**
 * Vite plugin that resolves one build id, injects it into client code, and emits/serves the matching
 * version JSON endpoint.
 */
export function versionCheck(options: VersionCheckViteOptions = {}): Plugin {
	const fileName = normalizeFileName(options.fileName);
	const defineName = resolveDefineName(options.define);
	const versionPath = `/${fileName}`;
	let buildIdPromise: Promise<string> | undefined;
	let buildId: string | undefined;

	function resolveBuildIdOnce(cwd: string): Promise<string> {
		buildIdPromise ??= resolveBuildId({
			buildId: options.buildId,
			cwd,
		});

		return buildIdPromise;
	}

	function getBuildId(): string {
		if (buildId === undefined) {
			throw new Error("[version-check] build id was requested before Vite config was resolved.");
		}

		return buildId;
	}

	return {
		name: "@almeidx/version-check-vite",
		async config(config): Promise<UserConfig | undefined> {
			if (defineName === undefined) return undefined;

			const root = typeof config.root === "string" ? resolvePath(config.root) : process.cwd();
			const resolvedBuildId = await resolveBuildIdOnce(root);

			return {
				define: {
					[defineName]: JSON.stringify(resolvedBuildId),
				},
			};
		},
		async configResolved(config) {
			buildId = await resolveBuildIdOnce(config.root);
		},
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				if (request.method !== "GET" && request.method !== "HEAD") {
					next();
					return;
				}

				const pathname = new URL(request.url ?? "/", "http://version-check.local").pathname;
				if (pathname !== versionPath) {
					next();
					return;
				}

				response.statusCode = 200;
				response.setHeader("Content-Type", "application/json; charset=utf-8");
				response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
				response.end(request.method === "HEAD" ? undefined : createVersionFileContent(getBuildId()));
			});
		},
		resolveId(id) {
			return id === virtualModuleId ? resolvedVirtualModuleId : undefined;
		},
		load(id) {
			if (id !== resolvedVirtualModuleId) return undefined;

			return [
				`const buildId = ${JSON.stringify(getBuildId())};`,
				"export { buildId };",
				"export default buildId;",
				"",
			].join("\n");
		},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName,
				source: createVersionFileContent(getBuildId()),
			});
		},
	};
}
