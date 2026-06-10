import type { UseVersionCheckResult } from "@almeidx/version-check-react";
import { useVersionCheck } from "@almeidx/version-check-react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useNextVersionCheck } from "../src/client.js";

const reactMocks = vi.hoisted(() => ({
	useVersionCheck: vi.fn<typeof useVersionCheck>(),
}));

vi.mock("@almeidx/version-check-react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@almeidx/version-check-react")>();

	return {
		...actual,
		useVersionCheck: reactMocks.useVersionCheck,
	};
});

const stubResult: UseVersionCheckResult = {
	status: "idle",
	currentVersion: "current",
	updateAvailable: false,
	check: async () => ({ status: "idle", currentVersion: "current", updateAvailable: false }),
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("useNextVersionCheck", () => {
	test("defaults the endpoint to /api/version", () => {
		reactMocks.useVersionCheck.mockReturnValue(stubResult);

		useNextVersionCheck({ currentVersion: "1" });

		expect(reactMocks.useVersionCheck).toHaveBeenCalledOnce();
		expect(reactMocks.useVersionCheck).toHaveBeenCalledWith(
			expect.objectContaining({ endpoint: "/api/version", currentVersion: "1" }),
		);
	});

	test("endpoint override wins over the default", () => {
		reactMocks.useVersionCheck.mockReturnValue(stubResult);

		useNextVersionCheck({ currentVersion: "1", endpoint: "/custom" });

		expect(reactMocks.useVersionCheck).toHaveBeenCalledOnce();
		expect(reactMocks.useVersionCheck).toHaveBeenCalledWith(expect.objectContaining({ endpoint: "/custom" }));
	});

	test("passes extra options through unchanged", () => {
		reactMocks.useVersionCheck.mockReturnValue(stubResult);

		useNextVersionCheck({ currentVersion: "1", intervalMs: 5000 });

		expect(reactMocks.useVersionCheck).toHaveBeenCalledWith(expect.objectContaining({ intervalMs: 5000 }));
	});

	test("returns the inner hook's result", () => {
		reactMocks.useVersionCheck.mockReturnValue(stubResult);

		const result = useNextVersionCheck({ currentVersion: "1" });

		expect(result).toBe(stubResult);
	});
});
