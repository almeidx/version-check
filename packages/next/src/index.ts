import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

export type NextVersionPayload = {
	readonly buildId: string;
};

export type GetNextBuildIdOptions = {
	readonly cwd?: string;
	readonly buildIdFile?: string;
	readonly fallback?: string;
	readonly cache?: boolean;
};

export type CreateNextVersionHandlerOptions = GetNextBuildIdOptions & {
	readonly headers?: HeadersInit;
};

const buildIdCache = new Map<string, string>();

export async function getNextBuildId(options: GetNextBuildIdOptions = {}): Promise<string> {
	const cwd = options.cwd ?? process.cwd();
	const buildIdFile = options.buildIdFile ?? ".next/BUILD_ID";
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

export function createNextVersionPayload(buildId: string): NextVersionPayload {
	return { buildId };
}

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
