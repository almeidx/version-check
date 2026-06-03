import { useVersionCheck } from "@almeidx/version-check-vue";
import currentVersion from "virtual:version-check/build-id";
import { createApp, defineComponent, h } from "vue";
import "./style.css";

function refreshPage() {
	window.location.reload();
}

const App = defineComponent({
	name: "App",
	setup() {
		const { state } = useVersionCheck({
			currentVersion,
			intervalMs: 30_000,
		});

		return () =>
			h("main", [
				h("h1", "Vue Vite version check"),
				h("p", `Current build: ${currentVersion}`),
				h("p", `Status: ${state.value.status}`),
				state.value.updateAvailable
					? h("section", { role: "status", class: "update" }, [
							h("span", "New version available."),
							h("button", { type: "button", onClick: refreshPage }, "Refresh"),
						])
					: null,
			]);
	},
});

createApp(App).mount("#app");
