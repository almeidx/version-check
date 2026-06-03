#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { parseArgs as parseNodeArgs } from "node:util";
import { writeVersionFile } from "./build-id.js";

type GenerateOptions = {
	readonly output: string;
	readonly buildId?: string | undefined;
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

	// `generate` is the only command, and it is optional: `version-check [generate] [output]`.
	const operands = positionals[0] === "generate" ? positionals.slice(1) : positionals;
	if (operands.length > 1) {
		throw new Error(`Unexpected positional arguments: ${operands.join(" ")}`);
	}

	const buildId = values["build-id"];

	return {
		output: operands[0] ?? "public",
		cwd: values.cwd ?? process.cwd(),
		...(buildId === undefined ? {} : { buildId }),
	};
}

/**
 * Runs the `version-check` CLI, which generates a `version.json` file containing a build id.
 *
 * @param args - CLI arguments without the leading `node` and script path.
 * @returns The process exit code: `0` on success, `1` on error.
 */
export async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<number> {
	try {
		const options = parseCliArgs(args);

		if (options === "help") {
			console.log(usage);
			return 0;
		}

		const outputFile = await writeVersionFile(options);
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
