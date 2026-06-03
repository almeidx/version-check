import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build, createServer } from "vite";
import { afterEach, describe, expect, test } from "vitest";
import { versionCheck } from "../src/index.js";

const temporaryDirectories: string[] = [];
type BuildOutput = Awaited<ReturnType<typeof build>>;
type BuildOutputItem =
	| {
			readonly type: "asset";
			readonly fileName: string;
			readonly source: string | Uint8Array;
	  }
	| {
			readonly type: "chunk";
			readonly fileName: string;
			readonly code: string;
	  };
type RollupOutputLike = {
	readonly output: readonly BuildOutputItem[];
};
type BuildAsset = Extract<BuildOutputItem, { readonly type: "asset" }>;
type BuildChunk = Extract<BuildOutputItem, { readonly type: "chunk" }>;

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "version-check-vite-"));
	temporaryDirectories.push(directory);
	return directory;
}

async function writeProjectFile(root: string, path: string, content: string): Promise<void> {
	await writeFile(join(root, path), content);
}

function normalizeOutput(output: BuildOutput): RollupOutputLike {
	return (Array.isArray(output) ? output[0] : output) as RollupOutputLike;
}

async function importBuiltDefault(code: string, root: string): Promise<string> {
	const modulePath = join(root, `bundle-${Date.now()}-${Math.random()}.mjs`);
	await writeFile(modulePath, code);
	const imported = (await import(pathToFileURL(modulePath).href)) as { default: string };
	return imported.default;
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("versionCheck", () => {
	test("emits the same build id exposed by the virtual module and define constant", async () => {
		const root = await createTemporaryDirectory();
		await writeProjectFile(
			root,
			"entry.ts",
			[
				'import defaultBuildId, { buildId } from "virtual:version-check/build-id";',
				"export default [defaultBuildId, buildId, __VERSION_CHECK_BUILD_ID__].join('|');",
				"",
			].join("\n"),
		);

		const result = normalizeOutput(
			await build({
				root,
				logLevel: "silent",
				plugins: [versionCheck({ buildId: "build-from-plugin" })],
				build: {
					write: false,
					lib: {
						entry: join(root, "entry.ts"),
						formats: ["es"],
						fileName: () => "bundle.mjs",
					},
				},
			}),
		);

		const versionAsset = result.output.find(
			(item): item is BuildAsset => item.type === "asset" && item.fileName === "version.json",
		);
		const bundle = result.output.find(
			(item): item is BuildChunk => item.type === "chunk" && item.fileName === "bundle.mjs",
		);

		expect(versionAsset?.source).toBe(`${JSON.stringify({ buildId: "build-from-plugin" }, null, "\t")}\n`);
		expect(bundle?.type).toBe("chunk");
		await expect(importBuiltDefault(bundle!.code, root)).resolves.toBe(
			"build-from-plugin|build-from-plugin|build-from-plugin",
		);
	});

	test("honors fileName and buildId options", async () => {
		const root = await createTemporaryDirectory();
		await writeProjectFile(
			root,
			"entry.ts",
			[
				'import defaultBuildId, { buildId } from "virtual:version-check/build-id";',
				"export default [defaultBuildId, buildId].join('|');",
				"",
			].join("\n"),
		);

		const result = normalizeOutput(
			await build({
				root,
				logLevel: "silent",
				plugins: [
					versionCheck({
						buildId: "custom-build",
						fileName: "meta/version.json",
						define: false,
					}),
				],
				build: {
					write: false,
					lib: {
						entry: join(root, "entry.ts"),
						formats: ["es"],
						fileName: () => "bundle.mjs",
					},
				},
			}),
		);

		const versionAsset = result.output.find(
			(item): item is BuildAsset => item.type === "asset" && item.fileName === "meta/version.json",
		);
		const bundle = result.output.find(
			(item): item is BuildChunk => item.type === "chunk" && item.fileName === "bundle.mjs",
		);

		expect(versionAsset?.source).toBe(`${JSON.stringify({ buildId: "custom-build" }, null, "\t")}\n`);
		expect(bundle?.type).toBe("chunk");
		await expect(importBuiltDefault(bundle!.code, root)).resolves.toBe("custom-build|custom-build");
		expect(bundle!.code).not.toContain("__VERSION_CHECK_BUILD_ID__");
	});

	test("serves version.json with the same resolved id in dev", async () => {
		const root = await createTemporaryDirectory();
		const server = await createServer({
			root,
			logLevel: "silent",
			server: {
				host: "127.0.0.1",
			},
			plugins: [versionCheck({ buildId: "dev-build" })],
		});

		try {
			await server.listen(0);
			const address = server.httpServer?.address();
			if (address === null || typeof address !== "object") {
				throw new Error("Expected Vite dev server to listen on a TCP port.");
			}

			const response = await fetch(`http://127.0.0.1:${address.port}/version.json`);

			await expect(response.json()).resolves.toEqual({ buildId: "dev-build" });
			expect(response.headers.get("cache-control")).toContain("no-store");
		} finally {
			await server.close();
		}
	});
});
