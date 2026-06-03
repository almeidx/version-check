import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type MaybePromise<T> = T | Promise<T>;

/** Environment variables consulted by {@link resolveBuildId}. */
export type BuildIdEnvironment = {
	readonly VERSION_CHECK_BUILD_ID?: string | undefined;
	readonly SOURCE_COMMIT?: string | undefined;
	readonly VERCEL_GIT_COMMIT_SHA?: string | undefined;
	readonly GITHUB_SHA?: string | undefined;
};

/** Options for resolving the current deployment build id. */
export type ResolveBuildIdOptions = {
	/** Explicit build id override. */
	readonly buildId?: string | undefined;
	/**
	 * Directory used for git/package.json fallback resolution.
	 *
	 * @defaultValue `process.cwd()`
	 */
	readonly cwd?: string | undefined;
	/**
	 * Environment source.
	 *
	 * @defaultValue `process.env`
	 */
	readonly env?: BuildIdEnvironment | undefined;
	/**
	 * Git commit reader. It is injectable so callers can test fallback behavior without shelling out.
	 *
	 * @defaultValue `git rev-parse HEAD`
	 */
	readonly readGitCommit?: ((cwd: string) => MaybePromise<string | undefined>) | undefined;
	/**
	 * package.json version reader. It is injectable so callers can test fallback behavior without touching disk.
	 *
	 * @defaultValue reads `package.json` in {@link cwd}
	 */
	readonly readPackageVersion?: ((cwd: string) => MaybePromise<string | undefined>) | undefined;
};

/** Options for writing a `version.json` file. */
export type WriteVersionFileOptions = ResolveBuildIdOptions & {
	/** Output JSON path, or a directory where `version.json` should be written. */
	readonly output: string;
};

async function readPackageVersionFromPackageJson(cwd: string): Promise<string | undefined> {
	try {
		const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf8")) as { version?: unknown };
		return typeof packageJson.version === "string" ? packageJson.version : undefined;
	} catch {
		return undefined;
	}
}

async function readGitCommitFromGit(cwd: string): Promise<string | undefined> {
	const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd });
	return stdout;
}

function normalizeBuildId(candidate: string | undefined): string | undefined {
	const normalized = candidate?.trim();
	return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

async function tryResolve(candidate: () => MaybePromise<string | undefined>): Promise<string | undefined> {
	try {
		return normalizeBuildId(await candidate());
	} catch {
		return undefined;
	}
}

/**
 * Resolves the current deployment build id.
 *
 * Precedence: explicit `buildId`, `VERSION_CHECK_BUILD_ID`, `SOURCE_COMMIT`,
 * `VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA`, `git rev-parse HEAD`, package.json version,
 * then `"local-dev"`.
 */
export async function resolveBuildId(options: ResolveBuildIdOptions = {}): Promise<string> {
	const cwd = options.cwd ?? process.cwd();
	const env = options.env ?? process.env;
	const readGitCommit = options.readGitCommit ?? readGitCommitFromGit;
	const readPackageVersion = options.readPackageVersion ?? readPackageVersionFromPackageJson;
	const directBuildId = [
		options.buildId,
		env.VERSION_CHECK_BUILD_ID,
		env.SOURCE_COMMIT,
		env.VERCEL_GIT_COMMIT_SHA,
		env.GITHUB_SHA,
	].find((candidate) => normalizeBuildId(candidate) !== undefined);

	if (directBuildId !== undefined) {
		return normalizeBuildId(directBuildId)!;
	}

	const gitCommit = await tryResolve(() => readGitCommit(cwd));
	if (gitCommit !== undefined) return gitCommit;

	const packageVersion = await tryResolve(() => readPackageVersion(cwd));
	if (packageVersion !== undefined) return packageVersion;

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
