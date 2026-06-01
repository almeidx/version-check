import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDir = process.argv[2] || "public";
const outputFile = join(outputDir, "version.json");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

const buildId =
	process.env.VERSION_CHECK_BUILD_ID ||
	process.env.VERCEL_GIT_COMMIT_SHA ||
	process.env.GITHUB_SHA ||
	packageJson.version ||
	"local-dev";

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify({ buildId }, null, "\t")}\n`);

console.log(`Wrote ${outputFile}`);
