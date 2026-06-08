/**
 * @vitest-environment happy-dom
 */

import type {
	VersionCheckOptions,
	VersionCheckState,
	VersionChecker,
	VersionCompareContext,
	VersionPayload,
} from "@almeidx/version-check";
import { createVersionChecker } from "@almeidx/version-check";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useVersionCheck } from "../src/index.js";

const coreMocks = vi.hoisted(() => ({
	createVersionChecker: vi.fn<typeof createVersionChecker>(),
}));

vi.mock("@almeidx/version-check", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@almeidx/version-check")>();

	return {
		...actual,
		createVersionChecker: coreMocks.createVersionChecker,
	};
});

describe("useVersionCheck (react)", () => {
	const state: VersionCheckState = {
		status: "idle",
		currentVersion: "current",
		updateAvailable: false,
	};
	let checkers: VersionChecker[];

	beforeEach(() => {
		checkers = [];
		vi.mocked(createVersionChecker).mockImplementation(() => {
			const checker: VersionChecker = {
				start: vi.fn<VersionChecker["start"]>(),
				stop: vi.fn<VersionChecker["stop"]>(),
				check: vi.fn<VersionChecker["check"]>(async () => state),
				subscribe: vi.fn<VersionChecker["subscribe"]>(() => vi.fn<() => void>()),
				getState: vi.fn<VersionChecker["getState"]>(() => state),
				isRunning: vi.fn<VersionChecker["isRunning"]>(() => false),
			};

			checkers.push(checker);
			return checker;
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test("does not recreate the checker for inline fetch options", async () => {
		const fetcher = vi.fn<
			(version: string, requestInit: RequestInit | undefined, fetchedVersion: string | undefined) => Promise<string>
		>(async (version) => version);
		const compare = vi.fn<(version: string, context: VersionCompareContext<VersionPayload>) => boolean>(() => false);
		const fetch = vi.fn<(version: string) => Promise<Response>>(async (version) => Response.json({ version }));
		const now = vi.fn<(version: string) => number>((version) => (version === "first" ? 1 : 2));

		function Harness({ version }: { readonly version: string }) {
			useVersionCheck({
				currentVersion: "current",
				endpoint: "/version.json",
				intervalMs: 0,
				requestInit: { headers: { "x-version": version } },
				fetcher: async (context) => {
					const response = await context.fetch?.("/version.json");
					const payload = (await response?.json()) as { readonly version?: string } | undefined;

					return fetcher(version, context.requestInit, payload?.version);
				},
				compare: (context) => compare(version, context),
				fetch: async () => fetch(version),
				now: () => now(version),
			});

			return null;
		}

		const { rerender, unmount } = render(<Harness version="first" />);
		rerender(<Harness version="second" />);

		expect(createVersionChecker).toHaveBeenCalledTimes(1);
		expect(checkers).toHaveLength(1);
		expect(checkers[0]?.start).toHaveBeenCalledTimes(1);
		expect(checkers[0]?.stop).not.toHaveBeenCalled();

		const options = vi.mocked(createVersionChecker).mock.calls[0]?.[0] as
			| VersionCheckOptions<VersionPayload>
			| undefined;
		if (options?.fetcher === undefined || options.compare === undefined) {
			throw new Error("Expected stable fetcher and compare wrappers.");
		}

		expect(options.now?.()).toBe(2);

		const abortController = new AbortController();
		const latestVersion = await options.fetcher({
			endpoint: "/version.json",
			signal: abortController.signal,
		});
		const updateAvailable = options.compare({
			currentVersion: "current",
			latestVersion: "latest",
		});

		expect(latestVersion).toBe("second");
		expect(fetcher).toHaveBeenCalledWith("second", { headers: { "x-version": "second" } }, "second");
		expect(fetch).toHaveBeenCalledWith("second");
		expect(now).toHaveBeenCalledWith("second");
		expect(updateAvailable).toBe(false);
		expect(compare).toHaveBeenCalledWith("second", {
			currentVersion: "current",
			latestVersion: "latest",
		});

		unmount();
		expect(checkers[0]?.stop).toHaveBeenCalledTimes(1);
	});

	test("recreates the checker when lifecycle options change", () => {
		const getWindow = vi.fn<(target: string) => Window | undefined>(() => window);

		function Harness({ endpoint, target }: { readonly endpoint: string; readonly target: string }) {
			useVersionCheck({
				currentVersion: "current",
				endpoint,
				intervalMs: 0,
				requestInit: { headers: { "x-inline": endpoint } },
				getWindow: () => getWindow(target),
			});

			return null;
		}

		const { rerender, unmount } = render(<Harness endpoint="/version-a.json" target="first" />);
		rerender(<Harness endpoint="/version-b.json" target="second" />);

		expect(createVersionChecker).toHaveBeenCalledTimes(2);
		expect(checkers).toHaveLength(2);
		expect(checkers[0]?.start).toHaveBeenCalledTimes(1);
		expect(checkers[0]?.stop).toHaveBeenCalledTimes(1);
		expect(checkers[1]?.start).toHaveBeenCalledTimes(1);
		expect(checkers[1]?.stop).not.toHaveBeenCalled();
		expect(vi.mocked(createVersionChecker).mock.calls[0]?.[0].getWindow).not.toBe(
			vi.mocked(createVersionChecker).mock.calls[1]?.[0].getWindow,
		);

		vi.mocked(createVersionChecker).mock.calls[0]?.[0].getWindow?.();
		vi.mocked(createVersionChecker).mock.calls[1]?.[0].getWindow?.();
		expect(getWindow).toHaveBeenCalledWith("first");
		expect(getWindow).toHaveBeenCalledWith("second");

		unmount();
		expect(checkers[1]?.stop).toHaveBeenCalledTimes(1);
	});
});
