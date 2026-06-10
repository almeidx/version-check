import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createVersionFileContent, writeVersionFile } from "../src/build-id.js";
import { runCli } from "../src/cli.js";

describe("writeVersionFile", () => {
	let tmp: string;

	beforeEach(async () => {
		tmp = await mkdtemp(join(tmpdir(), "version-check-cli-"));
	});

	afterEach(async () => {
		await rm(tmp, { recursive: true, force: true });
	});

	test("writes version.json inside a directory output", async () => {
		const result = await writeVersionFile({ output: tmp, buildId: "b1", env: {} });

		expect(result).toBe(join(tmp, "version.json"));
		const content = await readFile(join(tmp, "version.json"), "utf8");
		expect(content).toBe(createVersionFileContent("b1"));
	});

	test("writes to an explicit .json path, creating nested directories", async () => {
		const customPath = join(tmp, "nested/dir/custom.json");
		const result = await writeVersionFile({ output: customPath, buildId: "nested-build", env: {} });

		expect(result).toBe(customPath);
		const content = await readFile(customPath, "utf8");
		expect(content).toBe(createVersionFileContent("nested-build"));
	});

	test("falls back to local-dev when env is empty and no buildId provided", async () => {
		const result = await writeVersionFile({ output: tmp, env: {} });

		expect(result).toBe(join(tmp, "version.json"));
		const content = await readFile(join(tmp, "version.json"), "utf8");
		expect(content).toContain('"local-dev"');
	});
});

describe("createVersionFileContent", () => {
	test("produces tab-indented JSON with a trailing newline", () => {
		expect(createVersionFileContent("x")).toBe('{\n\t"buildId": "x"\n}\n');
	});
});

describe("runCli", () => {
	let tmp: string;
	let log: ReturnType<typeof vi.spyOn>;
	let error: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		tmp = await mkdtemp(join(tmpdir(), "version-check-cli-"));
		log = vi.spyOn(console, "log").mockImplementation(() => {});
		error = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await rm(tmp, { recursive: true, force: true });
	});

	test("--help returns 0 and prints usage", async () => {
		const code = await runCli(["--help"]);

		expect(code).toBe(0);
		expect(log).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
	});

	test("-h returns 0 and prints usage", async () => {
		const code = await runCli(["-h"]);

		expect(code).toBe(0);
		expect(log).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
	});

	test("generate with explicit directory output and --build-id writes the file", async () => {
		const outDir = join(tmp, "out");
		const code = await runCli(["generate", outDir, "--build-id", "cli-build"]);

		expect(code).toBe(0);
		const outFile = join(outDir, "version.json");
		const content = await readFile(outFile, "utf8");
		expect(content).toBe(createVersionFileContent("cli-build"));
		expect(log).toHaveBeenCalledWith(`Wrote ${outFile}`);
	});

	test("optional generate command word: output without 'generate' prefix writes the file", async () => {
		const outDir = join(tmp, "out2");
		const code = await runCli([outDir, "--build-id", "x"]);

		expect(code).toBe(0);
		const outFile = join(outDir, "version.json");
		const content = await readFile(outFile, "utf8");
		expect(content).toBe(createVersionFileContent("x"));
	});

	test("too many positionals returns 1 and prints error + usage", async () => {
		const code = await runCli(["generate", "a", "b"]);

		expect(code).toBe(1);
		expect(error).toHaveBeenCalledWith(expect.stringContaining("Unexpected positional arguments"));
		expect(error).toHaveBeenCalledWith(expect.stringContaining("Usage:"));
	});

	test("unknown flag returns 1 and prints an error", async () => {
		const code = await runCli(["--bogus"]);

		expect(code).toBe(1);
		expect(error).toHaveBeenCalled();
	});
});
