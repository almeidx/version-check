import {
	createVersionChecker,
	type VersionCheckOptions,
	type VersionCheckState,
	type VersionPayload,
} from "@almeidx/version-check";
import { getCurrentScope, onScopeDispose, readonly, shallowRef, type DeepReadonly, type Ref } from "vue";

export type UseVersionCheckOptions<TLatest extends VersionPayload = VersionPayload> = Omit<
	VersionCheckOptions<TLatest>,
	"autoStart"
>;

export type UseVersionCheckResult<TLatest extends VersionPayload = VersionPayload> = DeepReadonly<
	Ref<VersionCheckState<TLatest>>
>;

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

	checker.start();

	function dispose(): void {
		unsubscribe();
		checker.stop();
	}

	if (getCurrentScope() !== undefined) {
		onScopeDispose(dispose);
	}

	return readonly(state);
}
