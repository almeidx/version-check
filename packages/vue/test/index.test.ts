import { afterEach, describe, expect, test, vi } from "vitest";
import { effectScope } from "vue";
import { useVersionCheck } from "../src/index.js";

function fakeBrowserWindow(): Window {
	const noop = (): void => {};
	return {
		addEventListener: noop,
		removeEventListener: noop,
		document: {
			visibilityState: "visible",
			addEventListener: noop,
			removeEventListener: noop,
		},
	} as unknown as Window;
}

async function flushMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("useVersionCheck (vue)", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	test("does not start polling during SSR (no window)", async () => {
		const fetcher = vi.fn<() => Promise<string>>(async () => "1");

		// `window` is undefined in the default node test environment, simulating SSR.
		const { state } = useVersionCheck({ currentVersion: "1", intervalMs: 0, fetcher });
		await flushMicrotasks();

		expect(fetcher).not.toHaveBeenCalled();
		expect(state.value.status).toBe("idle");
	});

	test("starts on the client and stops polling when its effect scope is disposed", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", fakeBrowserWindow());
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const fetcher = vi.fn<() => Promise<string>>(async () => "1");

		const scope = effectScope();
		const result = scope.run(() => useVersionCheck({ currentVersion: "1", intervalMs: 1000, fetcher }))!;
		await flushMicrotasks();

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(result.state.value.status).toBe("current");
		expect(warn).not.toHaveBeenCalled();

		scope.stop();
		await vi.advanceTimersByTimeAsync(3000);
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	test("warns outside an effect scope and stops polling on stop()", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", fakeBrowserWindow());
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const fetcher = vi.fn<() => Promise<string>>(async () => "1");

		const { stop } = useVersionCheck({ currentVersion: "1", intervalMs: 1000, fetcher });
		expect(warn).toHaveBeenCalledOnce();

		stop();
		await vi.advanceTimersByTimeAsync(3000);
		expect(fetcher).toHaveBeenCalledTimes(1);
	});
});
