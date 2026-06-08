import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

/** Environment variables consulted by {@link resolveBuildId}. */
export type BuildIdEnvironment = {
	readonly VERSION_CHECK_BUILD_ID?: string | undefined;
	readonly SOURCE_COMMIT?: string | undefined;
	readonly VERCEL_GIT_COMMIT_SHA?: string | undefined;
	readonly CI_COMMIT_SHA?: string | undefined;
	readonly GITHUB_SHA?: string | undefined;
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

function normalizeBuildId(candidate: string | undefined): string | undefined {
	const normalized = candidate?.trim();
	return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

/**
 * Resolves the current deployment build id.
 *
 * Precedence: explicit `buildId`, `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`,
 * `VERCEL_GIT_COMMIT_SHA`, `CI_COMMIT_SHA`, `GITHUB_SHA`, then `"local-dev"`.
 */
export async function resolveBuildId(options: ResolveBuildIdOptions = {}): Promise<string> {
	const env = options.env ?? process.env;
	const directBuildId = [
		options.buildId,
		env.VERSION_CHECK_BUILD_ID,
		env.SOURCE_COMMIT,
		env.VERCEL_GIT_COMMIT_SHA,
		env.CI_COMMIT_SHA,
		env.GITHUB_SHA,
	].find((candidate) => normalizeBuildId(candidate) !== undefined);

	if (directBuildId !== undefined) {
		return normalizeBuildId(directBuildId)!;
	}

	return "local-dev";
}

/** Creates the JSON content written to `version.json`. */
export function createVersionFileContent(buildId: string): string {
	return `${JSON.stringify({ buildId }, null, "\t")}\n`;
}

function resolveOutputFile(output: string): string {
	return extname(output) === ".json" ? output : join(output, "version.json");
}

/**
 * Writes a `version.json` file containing the resolved build id.
 *
 * @returns The file path that was written.
 */
export async function writeVersionFile(options: WriteVersionFileOptions): Promise<string> {
	const outputFile = resolveOutputFile(options.output);
	const buildId = await resolveBuildId(options);

	await mkdir(dirname(outputFile), { recursive: true });
	await writeFile(outputFile, createVersionFileContent(buildId));

	return outputFile;
}
