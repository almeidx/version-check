export * from "@almeidx/version-check";

import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

/** Version payload served by {@link createNextVersionHandler}. */
export type NextVersionPayload = {
	/** The Next.js build id (contents of `.next/BUILD_ID`). */
	readonly buildId: string;
};

/** Options for {@link getNextBuildId}. */
export type GetNextBuildIdOptions = {
	/**
	 * Directory to resolve {@link buildIdFile} against.
	 *
	 * @defaultValue `process.cwd()`
	 */
	readonly cwd?: string | undefined;
	/**
	 * Path to the build id file, absolute or relative to {@link cwd}.
	 *
	 * @defaultValue `".next/BUILD_ID"`
	 */
	readonly buildIdFile?: string | undefined;
	/**
	 * Value returned when the build id file cannot be read (e.g. during development).
	 *
	 * @defaultValue `"dev"`
	 */
	readonly fallback?: string | undefined;
	/**
	 * Cache the resolved build id per file path for the lifetime of the process.
	 *
	 * @defaultValue `true`
	 */
	readonly cache?: boolean | undefined;
};

/** Options for {@link createNextVersionHandler}. */
export type CreateNextVersionHandlerOptions = GetNextBuildIdOptions & {
	/** Extra response headers, merged over the default no-cache headers. */
	readonly headers?: HeadersInit | undefined;
};

const buildIdCache = new Map<string, string>();

/**
 * Reads the current Next.js build id from `.next/BUILD_ID`, falling back to
 * {@link GetNextBuildIdOptions.fallback} (`"dev"`) when the file is unavailable.
 *
 * @returns The resolved build id.
 */
export async function getNextBuildId(options: GetNextBuildIdOptions = {}): Promise<string> {
	const cwd = options.cwd ?? process.cwd();
	const buildIdFile = options.buildIdFile ?? ".next/BUILD_ID";
	// The turbopackIgnore hint stops Next/Turbopack from tracing this dynamic path and warning that
	// it traced the whole project
	const filePath = isAbsolute(buildIdFile) ? buildIdFile : join(/* turbopackIgnore: true */ cwd, buildIdFile);
	const cache = options.cache !== false;

	if (cache) {
		const cachedBuildId = buildIdCache.get(filePath);
		if (cachedBuildId !== undefined) return cachedBuildId;
	}

	let buildId: string;

	try {
		buildId = (await readFile(filePath, "utf8")).trim();
	} catch {
		buildId = options.fallback ?? "dev";
	}

	if (cache) {
		buildIdCache.set(filePath, buildId);
	}

	return buildId;
}

/** Wraps a build id in a {@link NextVersionPayload}. */
export function createNextVersionPayload(buildId: string): NextVersionPayload {
	return { buildId };
}

/**
 * Creates a Next.js App Router route handler that serves the current build id as JSON with no-cache
 * headers. Pair it with {@link useNextVersionCheck} on the client.
 *
 * @example
 * ```ts
 * // app/api/version/route.ts
 * export const GET = createNextVersionHandler();
 * ```
 */
export function createNextVersionHandler(options: CreateNextVersionHandlerOptions = {}) {
	return async function GET(): Promise<Response> {
		const buildId = await getNextBuildId(options);

		return Response.json(createNextVersionPayload(buildId), {
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate",
				...options.headers,
			},
		});
	};
}
