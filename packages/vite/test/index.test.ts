import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildIdEnvironmentKeys } from "@almeidx/version-check/build";
import { build, createServer, type Plugin } from "vite";
import { afterEach, describe, expect, test, vi } from "vitest";
import { versionCheck } from "../src/index.js";

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

const temporaryDirectories: string[] = [];

const virtualModuleEntry = [
	'import defaultBuildId, { buildId } from "virtual:version-check/build-id";',
	"export default [defaultBuildId, buildId].join('|');",
	"",
].join("\n");

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "version-check-vite-"));
	temporaryDirectories.push(directory);
	return directory;
}

async function buildProject(
	root: string,
	plugin: Plugin,
	entry: string,
	versionFileName = "version.json",
): Promise<{ readonly versionFile: unknown; readonly exported: string }> {
	await writeFile(join(root, "entry.ts"), entry);

	const result = await build({
		root,
		logLevel: "silent",
		plugins: [plugin],
		build: {
			write: false,
			lib: {
				entry: join(root, "entry.ts"),
				formats: ["es"],
				fileName: () => "bundle.mjs",
			},
		},
	});
	const { output } = (Array.isArray(result) ? result[0] : result) as { readonly output: readonly BuildOutputItem[] };

	const versionAsset = output.find((item) => item.type === "asset" && item.fileName === versionFileName);
	const bundle = output.find((item) => item.type === "chunk" && item.fileName === "bundle.mjs");
	if (versionAsset?.type !== "asset" || bundle?.type !== "chunk") {
		throw new Error("Expected a version asset and a bundle chunk.");
	}

	const modulePath = join(root, `bundle-${Date.now()}-${Math.random()}.mjs`);
	await writeFile(modulePath, bundle.code);
	const imported = (await import(pathToFileURL(modulePath).href)) as { readonly default: string };

	return { versionFile: JSON.parse(String(versionAsset.source)), exported: imported.default };
}

afterEach(async () => {
	vi.unstubAllEnvs();
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("versionCheck", () => {
	test("uses deployment environment variables by default", async () => {
		vi.stubEnv("VERSION_CHECK_BUILD_ID", " env-build ");
		const root = await createTemporaryDirectory();

		const result = await buildProject(root, versionCheck(), virtualModuleEntry);

		expect(result.versionFile).toEqual({ buildId: "env-build" });
		expect(result.exported).toBe("env-build|env-build");
	});

	test("does not fall back to package metadata by default", async () => {
		for (const key of buildIdEnvironmentKeys) vi.stubEnv(key, "");
		const root = await createTemporaryDirectory();
		await writeFile(join(root, "package.json"), JSON.stringify({ version: "9.9.9" }));

		const result = await buildProject(root, versionCheck(), virtualModuleEntry);

		expect(result.versionFile).toEqual({ buildId: "local-dev" });
		expect(result.exported).toBe("local-dev|local-dev");
	});

	test.each([false, true])("honors a custom build id resolver (define: %s)", async (define) => {
		const root = await createTemporaryDirectory();
		// Vite resolves the root through symlinks (e.g. /var -> /private/var on macOS).
		const realRoot = await realpath(root);
		const roots: string[] = [];

		const result = await buildProject(
			root,
			versionCheck({
				define,
				resolveBuildId: ({ root: resolvedRoot }) => {
					roots.push(resolvedRoot);
					return "custom-resolved";
				},
			}),
			virtualModuleEntry,
		);

		expect(roots).toEqual([realRoot]);
		expect(result.versionFile).toEqual({ buildId: "custom-resolved" });
		expect(result.exported).toBe("custom-resolved|custom-resolved");
	});

	test("emits the same build id exposed by the virtual module and define constant", async () => {
		const root = await createTemporaryDirectory();

		const result = await buildProject(
			root,
			versionCheck({ buildId: "build-from-plugin", define: true }),
			[
				'import defaultBuildId, { buildId } from "virtual:version-check/build-id";',
				"export default [defaultBuildId, buildId, __VERSION_CHECK_BUILD_ID__].join('|');",
				"",
			].join("\n"),
		);

		expect(result.versionFile).toEqual({ buildId: "build-from-plugin" });
		expect(result.exported).toBe("build-from-plugin|build-from-plugin|build-from-plugin");
	});

	test("honors fileName and buildId options", async () => {
		const root = await createTemporaryDirectory();

		const result = await buildProject(
			root,
			versionCheck({ buildId: "custom-build", fileName: "meta/version.json" }),
			virtualModuleEntry,
			"meta/version.json",
		);

		expect(result.versionFile).toEqual({ buildId: "custom-build" });
		expect(result.exported).toBe("custom-build|custom-build");
	});

	test("does not define the global constant by default", async () => {
		const root = await createTemporaryDirectory();

		const result = await buildProject(
			root,
			versionCheck({ buildId: "build" }),
			"export default typeof __VERSION_CHECK_BUILD_ID__;\n",
		);

		expect(result.exported).toBe("undefined");
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
