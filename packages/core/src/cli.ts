import { parseArgs as parseNodeArgs } from "node:util";
import { writeVersionFile, type WriteVersionFileOptions } from "./build-id.js";
import { versionFileName } from "./version-file.js";

const usage = `Usage:
  version-check generate [output]

Options:
  --build-id <id>  Use an explicit build id instead of deployment environment metadata.
  -h, --help       Show this help message.

The output defaults to public/${versionFileName}. If output is a directory, ${versionFileName} is written inside it.`;

function parseCliArgs(args: readonly string[]): WriteVersionFileOptions | "help" {
	const { positionals, values } = parseNodeArgs({
		args,
		allowPositionals: true,
		options: {
			"build-id": {
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

	const operands = positionals[0] === "generate" ? positionals.slice(1) : positionals;
	if (operands.length > 1) {
		throw new Error(`Unexpected positional arguments: ${operands.join(" ")}`);
	}

	return {
		output: operands[0] ?? "public",
		buildId: values["build-id"],
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
