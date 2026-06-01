#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs as parseNodeArgs } from "node:util";

type GenerateOptions = {
	readonly output: string;
	readonly buildId?: string;
	readonly cwd: string;
};

const usage = `Usage:
  version-check generate [output]

Options:
  --build-id <id>  Use an explicit build id instead of environment/package metadata.
  --cwd <path>     Read package.json from this directory when falling back to package version.
  -h, --help       Show this help message.

The output defaults to public/version.json. If output is a directory, version.json is written inside it.`;

function parseCliArgs(args: readonly string[]): GenerateOptions | "help" {
	const { positionals, values } = parseNodeArgs({
		args,
		allowPositionals: true,
		options: {
			"build-id": {
				type: "string",
			},
			cwd: {
				type: "string",
			},
			help: {
				type: "boolean",
				short: "h",
			},
		},
	});

	if (values.help === true) {
		return "help";
	}

	const [commandOrOutput, maybeOutput, ...extraPositionals] = positionals;
	const hasCommand = commandOrOutput === "generate" || commandOrOutput === "write";
	if (extraPositionals.length > 0 || (maybeOutput !== undefined && !hasCommand)) {
		throw new Error(`Unexpected positional arguments: ${positionals.join(" ")}`);
	}

	const buildId = values["build-id"];

	return {
		output: hasCommand ? (maybeOutput ?? "public") : (commandOrOutput ?? "public"),
		cwd: values.cwd ?? process.cwd(),
		...(buildId === undefined ? {} : { buildId }),
	};
}

async function readPackageVersion(cwd: string): Promise<string | undefined> {
	try {
		const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf8")) as { version?: unknown };
		return typeof packageJson.version === "string" && packageJson.version.trim().length > 0
			? packageJson.version.trim()
			: undefined;
	} catch {
		return undefined;
	}
}

async function resolveBuildId(options: GenerateOptions): Promise<string> {
	const candidates = [
		options.buildId,
		process.env.VERSION_CHECK_BUILD_ID,
		process.env.VERCEL_GIT_COMMIT_SHA,
		process.env.GITHUB_SHA,
		await readPackageVersion(options.cwd),
		"local-dev",
	];

	for (const candidate of candidates) {
		if (typeof candidate === "string" && candidate.trim().length > 0) {
			return candidate.trim();
		}
	}

	return "local-dev";
}

function resolveOutputFile(output: string): string {
	return extname(output) === ".json" ? output : join(output, "version.json");
}

async function generateVersionFile(options: GenerateOptions): Promise<string> {
	const outputFile = resolveOutputFile(options.output);
	const buildId = await resolveBuildId(options);

	await mkdir(dirname(outputFile), { recursive: true });
	await writeFile(outputFile, `${JSON.stringify({ buildId }, null, "\t")}\n`);

	return outputFile;
}

export async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<number> {
	try {
		const options = parseCliArgs(args);

		if (options === "help") {
			console.log(usage);
			return 0;
		}

		const outputFile = await generateVersionFile(options);
		console.log(`Wrote ${outputFile}`);
		return 0;
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		console.error();
		console.error(usage);
		return 1;
	}
}

function isDirectlyExecuted(): boolean {
	const entrypoint = process.argv[1];
	return entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href;
}

if (isDirectlyExecuted()) {
	process.exitCode = await runCli();
}
