/**
 * @vitest-environment happy-dom
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useVersionCheck } from "../src/index.js";

async function flushChecks(): Promise<void> {
	await act(async () => {});
}

describe("useVersionCheck (react)", () => {
	test("uses the latest fetch, requestInit, compare and now without restarting the checker", async () => {
		const calls: { readonly version: string; readonly headers: HeadersInit | undefined }[] = [];

		const { result, rerender, unmount } = renderHook(
			({ version }: { readonly version: string }) =>
				useVersionCheck({
					currentVersion: "1",
					intervalMs: 0,
					requestInit: { headers: { "x-version": version } },
					fetch: async (_input, init) => {
						calls.push({ version, headers: init?.headers });
						return Response.json("1");
					},
					compare: () => version === "second",
					now: () => (version === "first" ? 1 : 2),
				}),
			{ initialProps: { version: "first" } },
		);
		await flushChecks();
		expect(result.current).toMatchObject({ status: "current", lastCheckedAt: 1 });

		rerender({ version: "second" });
		await flushChecks();
		expect(calls).toHaveLength(1);

		await act(() => result.current.check());

		expect(calls).toEqual([
			{ version: "first", headers: { "x-version": "first" } },
			{ version: "second", headers: { "x-version": "second" } },
		]);
		expect(result.current).toMatchObject({ status: "update-available", updateAvailable: true, lastCheckedAt: 2 });

		unmount();
	});

	test("restarts the checker when a lifecycle option changes and stops it on unmount", async () => {
		const endpoints: string[] = [];

		const { rerender, unmount } = renderHook(
			({ endpoint }: { readonly endpoint: string }) =>
				useVersionCheck({
					currentVersion: "1",
					endpoint,
					intervalMs: 0,
					minIntervalMs: 0,
					fetcher: async (context) => {
						endpoints.push(String(context.endpoint));
						return "1";
					},
				}),
			{ initialProps: { endpoint: "/version-a.json" } },
		);
		await flushChecks();

		rerender({ endpoint: "/version-b.json" });
		await flushChecks();
		expect(endpoints).toEqual(["/version-a.json", "/version-b.json"]);

		window.dispatchEvent(new Event("focus"));
		await flushChecks();
		expect(endpoints).toEqual(["/version-a.json", "/version-b.json", "/version-b.json"]);

		unmount();
		window.dispatchEvent(new Event("focus"));
		await flushChecks();
		expect(endpoints).toHaveLength(3);
	});
});
