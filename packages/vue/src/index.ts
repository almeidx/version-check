import {
	createVersionChecker,
	reloadPage,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionChecker,
	type VersionPayload,
} from "@almeidx/version-check";
import { getCurrentScope, onScopeDispose, readonly, shallowRef, type DeepReadonly, type Ref } from "vue";

export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = VersionCheckOptions<TLatest>;

export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = {
	readonly state: DeepReadonly<Ref<VersionCheckState<TLatest>>>;
	readonly checker: VersionChecker<TLatest>;
	readonly check: () => Promise<VersionCheckState<TLatest>>;
	readonly start: () => void;
	readonly stop: () => void;
	readonly reload: () => void;
	readonly dispose: () => void;
};

export function useVersionCheck<TLatest extends VersionPayload = VersionPayload>(
	options: UseVersionCheckOptions<TLatest>,
): UseVersionCheckResult<TLatest> {
	const checker = createVersionChecker<TLatest>({
		...options,
		autoStart: false,
	});
	const state = shallowRef(checker.getState()) as Ref<VersionCheckState<TLatest>>;
	const unsubscribe = checker.subscribe((nextState) => {
		state.value = nextState;
	});

	if (options.autoStart !== false) {
		checker.start();
	}

	function dispose(): void {
		unsubscribe();
		checker.stop();
	}

	if (getCurrentScope() !== undefined) {
		onScopeDispose(dispose);
	}

	return {
		state: readonly(state),
		checker,
		check: checker.check,
		start: checker.start,
		stop: checker.stop,
		reload: reloadPage,
		dispose,
	};
}
