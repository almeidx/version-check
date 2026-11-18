import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { createVersionFileContent, versionFileName } from "./version-file.js";

/** Environment variables consulted by {@link resolveBuildId}, in precedence order. */
export const buildIdEnvironmentKeys = [
	"VERSION_CHECK_BUILD_ID",
	"SOURCE_COMMIT",
	"VERCEL_GIT_COMMIT_SHA",
	"CI_COMMIT_SHA",
	"GITHUB_SHA",
] as const;

/** Environment variables consulted by {@link resolveBuildId}. */
export type BuildIdEnvironment = {
	readonly [Key in (typeof buildIdEnvironmentKeys)[number]]?: string | undefined;
};

/** Options for resolving the current deployment build id. */
export type ResolveBuildIdOptions = {
	/** Explicit build id override. */
	readonly buildId?: string | undefined;
	/**
	 * Environment source.
	 *
	 * @defaultValue `process.env`
	 */
	readonly env?: BuildIdEnvironment | undefined;
};

/** Options for writing a `version.json` file. */
export type WriteVersionFileOptions = ResolveBuildIdOptions & {
	/** Output JSON path, or a directory where `version.json` should be written. */
	readonly output: string;
};

/** Normalizes a candidate build id: trims it, mapping missing or blank values to `undefined`. */
export function normalizeBuildId(candidate: string | undefined): string | undefined {
	const normalized = candidate?.trim();
	return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

/**
 * Resolves the current deployment build id.
 *
 * Precedence: explicit `buildId`, then {@link buildIdEnvironmentKeys} in order, then `"local-dev"`.
 */
export async function resolveBuildId(options: ResolveBuildIdOptions = {}): Promise<string> {
	const env = options.env ?? process.env;

	for (const candidate of [options.buildId, ...buildIdEnvironmentKeys.map((key) => env[key])]) {
		const buildId = normalizeBuildId(candidate);
		if (buildId !== undefined) return buildId;
	}

	return "local-dev";
}

/**
 * Writes a `version.json` file containing the resolved build id.
 *
 * @returns The file path that was written.
 */
export async function writeVersionFile(options: WriteVersionFileOptions): Promise<string> {
	const outputFile = extname(options.output) === ".json" ? options.output : join(options.output, versionFileName);
	const buildId = await resolveBuildId(options);

	await mkdir(dirname(outputFile), { recursive: true });
	await writeFile(outputFile, createVersionFileContent(buildId));

	return outputFile;
}
