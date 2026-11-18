export * from "@almeidx/version-check";

import { realpath } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import {
	createVersionFileContent,
	normalizeBuildId,
	resolveBuildId as resolveCoreBuildId,
	versionCacheControl,
	versionFileName,
} from "@almeidx/version-check/build";
import { normalizePath, type Plugin, type UserConfig } from "vite";

const defaultDefineName = "__VERSION_CHECK_BUILD_ID__";
const virtualModuleId = "virtual:version-check/build-id";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
type MaybePromise<T> = T | Promise<T>;

/** Context passed to a custom Vite build-id resolver. */
export type VersionCheckViteBuildIdContext = {
	/** Project root known when Vite config hooks run. */
	readonly root: string;
};

/** Custom Vite build-id resolver. */
export type VersionCheckViteBuildIdResolver = (
	context: VersionCheckViteBuildIdContext,
) => MaybePromise<string | undefined>;

/** Options for {@link versionCheck}. */
export type VersionCheckViteOptions = {
	/**
	 * Explicit build id override.
	 *
	 * @defaultValue resolved from deployment env, then `"local-dev"`
	 */
	readonly buildId?: string | undefined;
	/**
	 * Custom build id resolver. Use this when you want a source other than the default deployment
	 * environment variables.
	 */
	readonly resolveBuildId?: VersionCheckViteBuildIdResolver | undefined;
	/**
	 * Emitted/served version asset name.
	 *
	 * @defaultValue `"version.json"`
	 */
	readonly fileName?: string | undefined;
	/**
	 * Global constant to inject with Vite define semantics. Pass `true` to use
	 * `"__VERSION_CHECK_BUILD_ID__"` or a string for a custom constant name.
	 *
	 * @defaultValue `false`
	 */
	readonly define?: string | boolean | undefined;
};

function normalizeFileName(fileName: string | undefined): string {
	const normalized = (fileName ?? versionFileName).replace(/^\/+/, "");
	if (normalized.length === 0) {
		throw new Error("[version-check] fileName must not be empty.");
	}

	return normalized;
}

function resolveDefineName(define: VersionCheckViteOptions["define"]): string | undefined {
	if (define === true) return defaultDefineName;
	return typeof define === "string" ? define : undefined;
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

	function resolveBuildIdOnce(root: string): Promise<string> {
		buildIdPromise ??= (async () =>
			resolveCoreBuildId({
				buildId: normalizeBuildId(options.buildId) ?? (await options.resolveBuildId?.({ root })),
			}))();

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

			// Same root Vite resolves for configResolved, so a custom resolver sees one root either way.
			const root = resolvePath(config.root ?? process.cwd());
			const resolvedBuildId = await resolveBuildIdOnce(
				normalizePath(config.resolve?.preserveSymlinks === true ? root : await realpath(root).catch(() => root)),
			);

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
				response.setHeader("Cache-Control", versionCacheControl);
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
