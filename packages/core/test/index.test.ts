import { describe, expect, test, vi } from "vitest";
import {
	VersionCheckError,
	createVersionChecker,
	fetchJsonVersion,
	isUpdateAvailable,
	resolveVersionId,
} from "../src/index.js";

class FakeEventTarget {
	private readonly listeners = new Map<string, Set<EventListener>>();

	addEventListener(eventName: string, listener: EventListener): void {
		const listeners = this.listeners.get(eventName) ?? new Set<EventListener>();
		listeners.add(listener);
		this.listeners.set(eventName, listeners);
	}

	removeEventListener(eventName: string, listener: EventListener): void {
		this.listeners.get(eventName)?.delete(listener);
	}

	dispatch(eventName: string): void {
		for (const listener of this.listeners.get(eventName) ?? []) {
			listener(new Event(eventName));
		}
	}

	listenerCount(eventName: string): number {
		return this.listeners.get(eventName)?.size ?? 0;
	}
}

class FakeDocument extends FakeEventTarget {
	visibilityState: DocumentVisibilityState = "visible";
}

class FakeWindow extends FakeEventTarget {
	readonly document = new FakeDocument();
}

async function flushMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("version comparison", () => {
	test("resolves common version payload shapes", () => {
		expect(resolveVersionId(" build-1 ")).toBe("build-1");
		expect(resolveVersionId({ version: "1.2.3" })).toBe("1.2.3");
		expect(resolveVersionId({ buildId: "next-build" })).toBe("next-build");
		expect(resolveVersionId({ id: "deploy-id" })).toBe("deploy-id");
		expect(resolveVersionId({ sha: "abc123" })).toBe("abc123");
	});

	test("rejects empty or unsupported payloads", () => {
		expect(() => resolveVersionId("")).toThrow(TypeError);
		expect(() => resolveVersionId({ tag: "1.0.0" })).toThrow(TypeError);
	});

	test("detects changed deployed identity by default", () => {
		expect(isUpdateAvailable("1.0.0", { version: "1.0.1" })).toBe(true);
		expect(isUpdateAvailable({ buildId: "a" }, { buildId: "a" })).toBe(false);
	});

	test("allows custom comparison logic", () => {
		expect(
			isUpdateAvailable("2.0.0", "1.0.0", ({ currentVersion, latestVersion }) => {
				return String(latestVersion) > String(currentVersion);
			}),
		).toBe(false);
	});
});

describe("createVersionChecker", () => {
	test("polls on the configured interval and stops cleanly", async () => {
		vi.useFakeTimers();

		let latestVersion = "1";
		const checker = createVersionChecker({
			currentVersion: "1",
			intervalMs: 1000,
			checkImmediately: false,
			fetcher: async () => latestVersion,
		});

		checker.start();
		expect(checker.isRunning()).toBe(true);

		await vi.advanceTimersByTimeAsync(1000);
		expect(checker.getState()).toMatchObject({
			status: "current",
			updateAvailable: false,
			latestVersion: "1",
		});

		latestVersion = "2";
		await vi.advanceTimersByTimeAsync(1000);
		expect(checker.getState()).toMatchObject({
			status: "update-available",
			updateAvailable: true,
			latestVersion: "2",
		});

		checker.stop();
		expect(checker.isRunning()).toBe(false);

		latestVersion = "3";
		await vi.advanceTimersByTimeAsync(1000);
		expect(checker.getState().latestVersion).toBe("2");

		vi.useRealTimers();
	});

	test("subscribes and unsubscribes listeners", async () => {
		const checker = createVersionChecker({
			currentVersion: "1",
			fetcher: async () => "2",
		});
		const seenStatuses: string[] = [];

		const unsubscribe = checker.subscribe((state) => {
			seenStatuses.push(state.status);
		});

		await checker.check();
		expect(seenStatuses).toEqual(["checking", "update-available"]);

		unsubscribe();
		await checker.check();
		expect(seenStatuses).toEqual(["checking", "update-available"]);
	});

	test("checks again from browser lifecycle events and removes listeners on stop", async () => {
		const fakeWindow = new FakeWindow();
		let checks = 0;
		const checker = createVersionChecker({
			currentVersion: "1",
			intervalMs: 0,
			checkImmediately: false,
			getWindow: () => fakeWindow as unknown as Window,
			fetcher: async () => {
				checks += 1;
				return checks > 1 ? "2" : "1";
			},
		});

		checker.start();
		expect(fakeWindow.listenerCount("focus")).toBe(1);
		expect(fakeWindow.listenerCount("online")).toBe(1);
		expect(fakeWindow.document.listenerCount("visibilitychange")).toBe(1);

		fakeWindow.dispatch("focus");
		await flushMicrotasks();
		expect(checks).toBe(1);
		expect(checker.getState().status).toBe("current");

		fakeWindow.document.visibilityState = "hidden";
		fakeWindow.document.dispatch("visibilitychange");
		await flushMicrotasks();
		expect(checks).toBe(1);

		fakeWindow.document.visibilityState = "visible";
		fakeWindow.document.dispatch("visibilitychange");
		await flushMicrotasks();
		expect(checks).toBe(2);
		expect(checker.getState().updateAvailable).toBe(true);

		checker.stop();
		expect(fakeWindow.listenerCount("focus")).toBe(0);
		expect(fakeWindow.listenerCount("online")).toBe(0);
		expect(fakeWindow.document.listenerCount("visibilitychange")).toBe(0);

		fakeWindow.dispatch("online");
		await flushMicrotasks();
		expect(checks).toBe(2);
	});

	test("captures fetcher errors without throwing from check", async () => {
		const error = new Error("network down");
		const checker = createVersionChecker({
			currentVersion: "1",
			fetcher: async () => {
				throw error;
			},
		});

		await expect(checker.check()).resolves.toMatchObject({
			status: "error",
			error,
			updateAvailable: false,
		});
	});
});

describe("fetchJsonVersion", () => {
	test("throws VersionCheckError for non-2xx responses", async () => {
		const response = new Response("nope", { status: 500 });
		const fetchMock = vi.fn<typeof fetch>(async () => response);

		await expect(
			fetchJsonVersion({
				endpoint: "/version.json",
				signal: new AbortController().signal,
				fetch: fetchMock,
			}),
		).rejects.toBeInstanceOf(VersionCheckError);
		expect(fetchMock).toHaveBeenCalledWith("/version.json", {
			cache: "no-store",
			signal: expect.any(AbortSignal),
		});
	});
});
