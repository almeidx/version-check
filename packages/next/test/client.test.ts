/**
 * @vitest-environment happy-dom
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useNextVersionCheck } from "../src/client.js";

async function requestedEndpoint(endpoint: string | undefined): Promise<string | undefined> {
	let requested: string | undefined;

	const { unmount } = renderHook(() =>
		useNextVersionCheck({
			currentVersion: "1",
			endpoint,
			intervalMs: 0,
			fetcher: async (context) => {
				requested = String(context.endpoint);
				return { buildId: "1" };
			},
		}),
	);
	await act(async () => {});
	unmount();

	return requested;
}

describe("useNextVersionCheck", () => {
	test("polls /api/version by default", async () => {
		await expect(requestedEndpoint(undefined)).resolves.toBe("/api/version");
	});

	test("polls an explicit endpoint", async () => {
		await expect(requestedEndpoint("/custom")).resolves.toBe("/custom");
	});
});
