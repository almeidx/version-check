export const defaultVersionEndpoint = "/version.json";
export const defaultPollIntervalMs = 30 * 60 * 1000;

const versionIdKeys = ["version", "buildId", "id", "hash", "sha"] as const;

export type VersionObject = {
	readonly [key: string]: unknown;
};

export type VersionPayload = string | VersionObject;

export type VersionCheckStatus = "idle" | "checking" | "current" | "update-available" | "error";

export type VersionCompareContext<TLatest extends VersionPayload = VersionPayload> = {
	readonly currentVersion: VersionPayload;
	readonly latestVersion: TLatest;
};

export type VersionComparator<TLatest extends VersionPayload = VersionPayload> = (
	context: VersionCompareContext<TLatest>,
) => boolean;

export type VersionFetchContext = {
	readonly endpoint: string | URL;
	readonly signal: AbortSignal;
	readonly requestInit?: RequestInit | undefined;
	readonly fetch?: typeof fetch | undefined;
};

export type VersionFetcher<TLatest extends VersionPayload = VersionPayload> = (
	context: VersionFetchContext,
) => Promise<TLatest>;

export type VersionCheckState<TLatest extends VersionPayload = VersionPayload> = {
	readonly status: VersionCheckStatus;
	readonly currentVersion: VersionPayload;
	readonly latestVersion?: TLatest;
	readonly updateAvailable: boolean;
	readonly error?: unknown;
	readonly lastCheckedAt?: number;
};

export type VersionCheckListener<TLatest extends VersionPayload = VersionPayload> = (
	state: VersionCheckState<TLatest>,
) => void;

export type VersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = {
	readonly currentVersion: VersionPayload;
	readonly endpoint?: string | URL;
	readonly intervalMs?: number;
	readonly fetcher?: VersionFetcher<TLatest>;
	readonly compare?: VersionComparator<TLatest>;
	readonly requestInit?: RequestInit;
	readonly autoStart?: boolean;
	readonly checkImmediately?: boolean;
	readonly refetchOnWindowFocus?: boolean;
	readonly refetchOnVisibilityChange?: boolean;
	readonly refetchOnReconnect?: boolean;
	readonly fetch?: typeof fetch;
	readonly getWindow?: () => Window | undefined;
	readonly now?: () => number;
};

export type VersionChecker<TLatest extends VersionPayload = VersionPayload> = {
	start: () => void;
	stop: () => void;
	check: () => Promise<VersionCheckState<TLatest>>;
	subscribe: (listener: VersionCheckListener<TLatest>) => () => void;
	getState: () => VersionCheckState<TLatest>;
	isRunning: () => boolean;
};

export class VersionCheckError extends Error {
	readonly response: Response;

	constructor(response: Response) {
		super(`Version check failed with HTTP ${response.status}`);
		this.name = "VersionCheckError";
		this.response = response;
	}
}

export function resolveVersionId(version: VersionPayload): string {
	if (typeof version === "string") {
		const id = version.trim();
		if (id.length > 0) return id;
		throw new TypeError("Version string must not be empty.");
	}

	for (const key of versionIdKeys) {
		const value = version[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}
	}

	throw new TypeError(`Version payload must be a non-empty string or include one of: ${versionIdKeys.join(", ")}.`);
}

export function isUpdateAvailable<TLatest extends VersionPayload>(
	currentVersion: VersionPayload,
	latestVersion: TLatest,
	compare?: VersionComparator<TLatest>,
): boolean {
	if (compare !== undefined) {
		return compare({ currentVersion, latestVersion });
	}

	return resolveVersionId(currentVersion) !== resolveVersionId(latestVersion);
}

export async function fetchJsonVersion<TLatest extends VersionPayload = VersionPayload>(
	context: VersionFetchContext,
): Promise<TLatest> {
	const fetchImpl = context.fetch ?? globalThis.fetch;

	if (fetchImpl === undefined) {
		throw new TypeError("No fetch implementation is available.");
	}

	const response = await fetchImpl(context.endpoint, {
		...context.requestInit,
		cache: context.requestInit?.cache ?? "no-store",
		signal: context.signal,
	});

	if (!response.ok) {
		throw new VersionCheckError(response);
	}

	return (await response.json()) as TLatest;
}

export function createVersionChecker<TLatest extends VersionPayload = VersionPayload>(
	options: VersionCheckOptions<TLatest>,
): VersionChecker<TLatest> {
	const endpoint = options.endpoint ?? defaultVersionEndpoint;
	const intervalMs = options.intervalMs ?? defaultPollIntervalMs;
	const now = options.now ?? Date.now;
	const listeners = new Set<VersionCheckListener<TLatest>>();
	const disposeBrowserListeners = new Set<() => void>();

	let timer: ReturnType<typeof setInterval> | undefined;
	let running = false;
	let abortController: AbortController | undefined;
	let state: VersionCheckState<TLatest> = {
		status: "idle",
		currentVersion: options.currentVersion,
		updateAvailable: false,
	};

	function emit(nextState: VersionCheckState<TLatest>): void {
		state = nextState;

		for (const listener of listeners) {
			listener(state);
		}
	}

	function setState(patch: Partial<VersionCheckState<TLatest>>): void {
		emit({ ...state, ...patch });
	}

	function restoreStatusAfterAbort(): void {
		if (state.latestVersion === undefined) {
			setState({ status: "idle", error: undefined });
			return;
		}

		setState({
			status: state.updateAvailable ? "update-available" : "current",
			error: undefined,
		});
	}

	async function check(): Promise<VersionCheckState<TLatest>> {
		abortController?.abort();

		const currentAbortController = new AbortController();
		abortController = currentAbortController;
		setState({ status: "checking", error: undefined });

		try {
			const fetcher = options.fetcher ?? fetchJsonVersion<TLatest>;
			const latestVersion = await fetcher({
				endpoint,
				signal: currentAbortController.signal,
				requestInit: options.requestInit,
				fetch: options.fetch,
			});

			if (currentAbortController.signal.aborted) {
				restoreStatusAfterAbort();
				return state;
			}

			const updateAvailable = isUpdateAvailable(options.currentVersion, latestVersion, options.compare);

			setState({
				status: updateAvailable ? "update-available" : "current",
				latestVersion,
				updateAvailable,
				error: undefined,
				lastCheckedAt: now(),
			});
		} catch (error) {
			if (currentAbortController.signal.aborted) {
				restoreStatusAfterAbort();
				return state;
			}

			setState({
				status: "error",
				error,
				lastCheckedAt: now(),
			});
		} finally {
			if (abortController === currentAbortController) {
				abortController = undefined;
			}
		}

		return state;
	}

	function addEventListener(target: EventTarget | undefined, eventName: string, listener: EventListener): void {
		if (target === undefined) return;

		target.addEventListener(eventName, listener);
		disposeBrowserListeners.add(() => target.removeEventListener(eventName, listener));
	}

	function addBrowserListeners(): void {
		const currentWindow = options.getWindow?.() ?? getGlobalWindow();

		if (options.refetchOnWindowFocus !== false) {
			addEventListener(currentWindow, "focus", () => {
				void check();
			});
		}

		if (options.refetchOnReconnect !== false) {
			addEventListener(currentWindow, "online", () => {
				void check();
			});
		}

		if (options.refetchOnVisibilityChange !== false) {
			const currentDocument = currentWindow?.document;
			addEventListener(currentDocument, "visibilitychange", () => {
				if (currentDocument?.visibilityState !== "hidden") {
					void check();
				}
			});
		}
	}

	function start(): void {
		if (running) return;

		running = true;
		addBrowserListeners();

		if (intervalMs > 0) {
			timer = setInterval(() => {
				void check();
			}, intervalMs);
		}

		if (options.checkImmediately !== false) {
			void check();
		}
	}

	function stop(): void {
		running = false;

		if (timer !== undefined) {
			clearInterval(timer);
			timer = undefined;
		}

		for (const dispose of disposeBrowserListeners) {
			dispose();
		}
		disposeBrowserListeners.clear();

		abortController?.abort();
		abortController = undefined;
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

export function reloadPage(targetWindow: Pick<Window, "location"> | undefined = getGlobalWindow()): void {
	targetWindow?.location.reload();
}

function getGlobalWindow(): Window | undefined {
	return typeof window === "undefined" ? undefined : window;
}
