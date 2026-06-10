import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createNextVersionHandler, createNextVersionPayload, getNextBuildId } from "../src/index.js";

const tmpdirs: string[] = [];

async function makeTmpdir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "version-check-next-"));
	tmpdirs.push(dir);
	return dir;
}

afterEach(async () => {
	for (const dir of tmpdirs.splice(0)) {
		await rm(dir, { recursive: true, force: true });
	}
});

describe("getNextBuildId", () => {
	test("reads and trims .next/BUILD_ID", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, ".next"));
		await writeFile(join(tmp, ".next", "BUILD_ID"), "  build-123\n");

		await expect(getNextBuildId({ cwd: tmp })).resolves.toBe("build-123");
	});

	test("falls back to 'dev' when file is missing", async () => {
		const tmp = await makeTmpdir();

		await expect(getNextBuildId({ cwd: tmp })).resolves.toBe("dev");
	});

	test("falls back to custom fallback value when file is missing", async () => {
		const tmp = await makeTmpdir();

		await expect(getNextBuildId({ cwd: tmp, fallback: "custom" })).resolves.toBe("custom");
	});

	test("caches per file path by default", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, ".next"));
		await writeFile(join(tmp, ".next", "BUILD_ID"), "first");

		await expect(getNextBuildId({ cwd: tmp })).resolves.toBe("first");

		await writeFile(join(tmp, ".next", "BUILD_ID"), "second");

		await expect(getNextBuildId({ cwd: tmp })).resolves.toBe("first");
	});

	test("re-reads when cache is false", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, ".next"));
		await writeFile(join(tmp, ".next", "BUILD_ID"), "first");

		await expect(getNextBuildId({ cwd: tmp, cache: false })).resolves.toBe("first");

		await writeFile(join(tmp, ".next", "BUILD_ID"), "second");

		await expect(getNextBuildId({ cwd: tmp, cache: false })).resolves.toBe("second");
	});

	test("resolves relative custom buildIdFile against cwd", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, "custom"));
		await writeFile(join(tmp, "custom", "ID"), "rel-build");

		await expect(getNextBuildId({ cwd: tmp, buildIdFile: "custom/ID" })).resolves.toBe("rel-build");
	});

	test("accepts an absolute buildIdFile path", async () => {
		const tmp = await makeTmpdir();
		await writeFile(join(tmp, "abs-id"), "abs-build");

		await expect(getNextBuildId({ buildIdFile: join(tmp, "abs-id") })).resolves.toBe("abs-build");
	});
});

describe("createNextVersionPayload", () => {
	test("returns an object with the given buildId", () => {
		expect(createNextVersionPayload("x")).toEqual({ buildId: "x" });
	});
});

describe("createNextVersionHandler", () => {
	test("response has no-cache headers and correct JSON body", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, ".next"));
		await writeFile(join(tmp, ".next", "BUILD_ID"), "handler-build");

		const GET = createNextVersionHandler({ cwd: tmp });
		const response = await GET();

		expect(response.headers.get("cache-control")).toBe("no-store, no-cache, must-revalidate");
		await expect(response.json()).resolves.toEqual({ buildId: "handler-build" });
	});

	test("custom headers merge over defaults", async () => {
		const tmp = await makeTmpdir();
		await mkdir(join(tmp, ".next"));
		await writeFile(join(tmp, ".next", "BUILD_ID"), "handler-build-2");

		const GET = createNextVersionHandler({
			cwd: tmp,
			headers: { "Cache-Control": "no-store", "X-Custom": "1" },
		});
		const response = await GET();

		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get("x-custom")).toBe("1");
	});
});
