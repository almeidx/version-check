import { isUpdateAvailable, type VersionComparator } from "./compare.js";
import { defaultPollIntervalMs, defaultVersionEndpoint } from "./constants.js";
import { fetchJsonVersion, type VersionFetcher } from "./fetch-json-version.js";
import type { VersionPayload } from "./version-payload.js";

/**
 * Lifecycle status of a {@link VersionChecker}:
 *
 * - `idle` — created but not yet checked (or reset after stopping before any result).
 * - `checking` — a check is in flight.
 * - `current` — the latest check matched the current version.
 * - `update-available` — the latest check differs from the current version.
 * - `error` — the latest check threw; see {@link VersionCheckState.error}.
 */
export type VersionCheckStatus = "idle" | "checking" | "current" | "update-available" | "error";

/**
 * An immutable snapshot of a {@link VersionChecker}, delivered to {@link VersionCheckListener}s.
 */
export interface VersionCheckState<TLatest extends VersionPayload = VersionPayload> {
	/**
	 * Current lifecycle status.
	 */
	readonly status: VersionCheckStatus;
	/**
	 * The version that rendered the current page.
	 */
	readonly currentVersion: VersionPayload;
	/**
	 * The most recent version returned by the fetcher, once a check has succeeded.
	 */
	readonly latestVersion?: TLatest | undefined;
	/**
	 * Whether {@link latestVersion} is considered an update over {@link currentVersion}.
	 */
	readonly updateAvailable: boolean;
	/**
	 * The error from the most recent failed check, when {@link status} is `"error"`.
	 */
	readonly error?: unknown | undefined;
	/**
	 * Epoch milliseconds of the last completed check (success or error).
	 */
	readonly lastCheckedAt?: number | undefined;
}

/**
 * Subscriber notified with a fresh {@link VersionCheckState} whenever it changes.
 */
export type VersionCheckListener<TLatest extends VersionPayload = VersionPayload> = (
	state: VersionCheckState<TLatest>,
) => void;

/**
 * Options for {@link createVersionChecker}.
 */
export interface VersionCheckOptions<TLatest extends VersionPayload = VersionPayload> {
	/**
	 * The version that rendered the current page. Compared against the fetched version to detect updates.
	 */
	readonly currentVersion: VersionPayload;
	/**
	 * Endpoint polled for the latest version.
	 *
	 * @defaultValue {@link defaultVersionEndpoint} (`"/version.json"`)
	 */
	readonly endpoint?: string | URL | undefined;
	/**
	 * Polling interval in milliseconds. Set to `0` to disable interval polling and rely only on
	 * lifecycle triggers and manual {@link VersionChecker.check} calls.
	 *
	 * @defaultValue {@link defaultPollIntervalMs} (30 minutes)
	 */
	readonly intervalMs?: number | undefined;
	/**
	 * Minimum time between checks triggered by lifecycle events (focus/online/visibility). Bursts of
	 * such events arriving within this window trigger only a single check. The in-flight guard
	 * prevents overlapping lifecycle checks regardless of this value.
	 *
	 * @defaultValue `0`
	 */
	readonly minIntervalMs?: number | undefined;
	/**
	 * Custom fetcher for the latest version.
	 *
	 * @defaultValue {@link fetchJsonVersion}
	 */
	readonly fetcher?: VersionFetcher<TLatest> | undefined;
	/**
	 * Custom update policy. Return `true` when an update is available.
	 *
	 * @defaultValue Compares the resolved ids of the current and latest versions for inequality.
	 */
	readonly compare?: VersionComparator<TLatest> | undefined;
	/**
	 * Extra options merged into the fetch request. `signal` is always overridden; `cache` defaults to `"no-store"`.
	 */
	readonly requestInit?: RequestInit | undefined;
	/**
	 * Start polling as soon as the checker is created, instead of waiting for {@link VersionChecker.start}.
	 *
	 * @defaultValue `false`
	 */
	readonly autoStart?: boolean | undefined;
	/**
	 * Run a check immediately when the checker starts.
	 *
	 * @defaultValue `true`
	 */
	readonly checkImmediately?: boolean | undefined;
	/**
	 * Re-check when the window regains focus.
	 *
	 * @defaultValue `true`
	 */
	readonly refetchOnWindowFocus?: boolean | undefined;
	/**
	 * Re-check when the document becomes visible.
	 *
	 * @defaultValue `true`
	 */
	readonly refetchOnVisibilityChange?: boolean | undefined;
	/**
	 * Re-check when the browser comes back online.
	 *
	 * @defaultValue `true`
	 */
	readonly refetchOnReconnect?: boolean | undefined;
	/**
	 * Pause interval polling while the document is hidden, resuming (and checking) when it becomes visible.
	 *
	 * @defaultValue `true`
	 */
	readonly pauseWhenHidden?: boolean | undefined;
	/**
	 * `fetch` implementation to use.
	 *
	 * @defaultValue `globalThis.fetch`
	 */
	readonly fetch?: typeof fetch | undefined;
	/**
	 * Resolves the `Window` to attach lifecycle listeners to. Mainly for testing.
	 *
	 * @defaultValue The global `window` object, if present.
	 */
	readonly getWindow?: (() => Window | undefined) | undefined;
	/**
	 * Clock for {@link VersionCheckState.lastCheckedAt} and throttling. Mainly for testing.
	 *
	 * @defaultValue `Date.now`
	 */
	readonly now?: (() => number) | undefined;
}

/**
 * Controls a version-checking lifecycle. Created by {@link createVersionChecker}.
 */
export interface VersionChecker<TLatest extends VersionPayload = VersionPayload> {
	/**
	 * Start interval polling and attach browser lifecycle listeners. No-op if already running.
	 */
	start(): void;
	/**
	 * Stop polling, detach listeners, and abort any in-flight check.
	 */
	stop(): void;
	/**
	 * Run a check now, bypassing throttling. Resolves with the resulting state and never rejects.
	 */
	check(): Promise<VersionCheckState<TLatest>>;
	/**
	 * Subscribe to state changes. Returns a function that removes the listener.
	 */
	subscribe(listener: VersionCheckListener<TLatest>): () => void;
	/**
	 * Return the current state snapshot.
	 */
	getState(): VersionCheckState<TLatest>;
	/**
	 * Whether the checker is currently running.
	 */
	isRunning(): boolean;
}

/**
 * Creates a headless version checker that polls an endpoint and reports when the deployed version
 * differs from the one that rendered the current page.
 *
 * The returned {@link VersionChecker} is inert until {@link VersionChecker.start} is called, unless
 * {@link VersionCheckOptions.autoStart} is set. Subscribe with {@link VersionChecker.subscribe} to
 * react to {@link VersionCheckState} changes.
 *
 * @example
 * ```ts
 * const checker = createVersionChecker({
 * 	currentVersion: window.__BUILD_ID__,
 * 	intervalMs: 30 * 60 * 1000,
 * });
 *
 * checker.subscribe((state) => {
 * 	if (state.updateAvailable) showRefreshBanner();
 * });
 *
 * checker.start();
 * ```
 */
export function createVersionChecker<TLatest extends VersionPayload = VersionPayload>(
	options: VersionCheckOptions<TLatest>,
): VersionChecker<TLatest> {
	const endpoint = options.endpoint ?? defaultVersionEndpoint;
	const intervalMs = options.intervalMs ?? defaultPollIntervalMs;
	const minIntervalMs = options.minIntervalMs ?? 0;
	const pauseWhenHidden = options.pauseWhenHidden !== false;
	const now = options.now ?? Date.now;
	const listeners = new Set<VersionCheckListener<TLatest>>();
	const disposeBrowserListeners = new Set<() => void>();

	let timer: ReturnType<typeof setInterval> | undefined;
	let running = false;
	let abortController: AbortController | undefined;
	let lastCheckStartedAt: number | undefined;
	let currentWindow: Window | undefined;
	let state: VersionCheckState<TLatest> = {
		status: "idle",
		currentVersion: options.currentVersion,
		updateAvailable: false,
	};

	function emit(nextState: VersionCheckState<TLatest>): void {
		state = nextState;

		for (const listener of listeners) {
			try {
				listener(state);
			} catch (error) {
				// A subscriber threw: don't let it stop delivery to the others or get misattributed
				// to a failed check (this runs inside check()'s try). Surface it out of band instead.
				reportListenerError(error);
			}
		}
	}

	function setState(patch: Partial<VersionCheckState<TLatest>>): void {
		emit({ ...state, ...patch });
	}

	function settledStatus(): VersionCheckStatus {
		if (state.latestVersion === undefined) return "idle";
		return state.updateAvailable ? "update-available" : "current";
	}

	async function check(): Promise<VersionCheckState<TLatest>> {
		abortController?.abort();

		const ownController = new AbortController();
		abortController = ownController;
		lastCheckStartedAt = now();
		setState({ status: "checking", error: undefined });

		try {
			const fetcher = options.fetcher ?? fetchJsonVersion<TLatest>;
			const latestVersion = await fetcher({
				endpoint,
				signal: ownController.signal,
				requestInit: options.requestInit,
				fetch: options.fetch,
			});

			// A newer check() (or stop()) superseded this one. The latest check owns the state, so
			// returning without touching it avoids emitting a stale, out-of-order intermediate state.
			if (ownController.signal.aborted) return state;

			const updateAvailable = isUpdateAvailable(options.currentVersion, latestVersion, options.compare);

			setState({
				status: updateAvailable ? "update-available" : "current",
				latestVersion,
				updateAvailable,
				error: undefined,
				lastCheckedAt: now(),
			});
		} catch (error) {
			if (ownController.signal.aborted) return state;

			setState({
				status: "error",
				error,
				lastCheckedAt: now(),
			});
		} finally {
			if (abortController === ownController) {
				abortController = undefined;
			}
		}

		return state;
	}

	function checkFromLifecycle(): void {
		// Collapse bursts of lifecycle events (focus + online + visibilitychange often fire together,
		// e.g. when resuming from sleep) rather than starting overlapping checks that abort each other.
		if (state.status === "checking") return;
		if (minIntervalMs > 0 && lastCheckStartedAt !== undefined && now() - lastCheckStartedAt < minIntervalMs) {
			return;
		}

		void check();
	}

	function startTimer(): void {
		if (intervalMs > 0 && timer === undefined) {
			timer = setInterval(() => {
				void check();
			}, intervalMs);
		}
	}

	function stopTimer(): void {
		if (timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}
	}

	function addEventListener(target: EventTarget | undefined, eventName: string, listener: EventListener): void {
		if (target === undefined) return;

		target.addEventListener(eventName, listener);
		disposeBrowserListeners.add(() => target.removeEventListener(eventName, listener));
	}

	function isHidden(): boolean {
		return currentWindow?.document?.visibilityState === "hidden";
	}

	function addBrowserListeners(): void {
		if (currentWindow === undefined) return;

		if (options.refetchOnWindowFocus !== false) {
			addEventListener(currentWindow, "focus", () => checkFromLifecycle());
		}

		if (options.refetchOnReconnect !== false) {
			addEventListener(currentWindow, "online", () => checkFromLifecycle());
		}

		const refetchOnVisible = options.refetchOnVisibilityChange !== false;
		const currentDocument = currentWindow.document;

		if ((refetchOnVisible || pauseWhenHidden) && currentDocument !== undefined) {
			addEventListener(currentDocument, "visibilitychange", () => {
				if (currentDocument.visibilityState === "hidden") {
					if (pauseWhenHidden) stopTimer();
					return;
				}

				if (pauseWhenHidden) startTimer();
				if (refetchOnVisible) checkFromLifecycle();
			});
		}
	}

	function start(): void {
		if (running) return;

		running = true;
		currentWindow = options.getWindow?.() ?? getGlobalWindow();
		addBrowserListeners();

		// While hidden (and pausing is enabled) defer the timer and the initial check until the
		// document becomes visible, instead of polling a backgrounded tab.
		if (!(pauseWhenHidden && isHidden())) {
			startTimer();

			if (options.checkImmediately !== false) {
				void check();
			}
		}
	}

	function stop(): void {
		running = false;
		stopTimer();

		for (const dispose of disposeBrowserListeners) {
			dispose();
		}
		disposeBrowserListeners.clear();

		abortController?.abort();
		abortController = undefined;
		currentWindow = undefined;

		// Aborting an in-flight check above leaves the status stuck on "checking"; settle it back.
		if (state.status === "checking") {
			setState({ status: settledStatus(), error: undefined });
		}
	}

	function subscribe(listener: VersionCheckListener<TLatest>): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	const checker: VersionChecker<TLatest> = {
		start,
		stop,
		check,
		subscribe,
		getState: () => state,
		isRunning: () => running,
	};

	if (options.autoStart === true) {
		checker.start();
	}

	return checker;
}

function getGlobalWindow(): Window | undefined {
	return typeof window === "undefined" ? undefined : window;
}

function reportListenerError(error: unknown): void {
	if (typeof reportError === "function") {
		reportError(error);
	} else {
		console.error(error);
	}
}
