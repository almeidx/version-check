import { useVersionCheck } from "@almeidx/version-check-vue";
import { createApp, defineComponent, h } from "vue";
import "./style.css";

const currentVersion = import.meta.env.VITE_VERSION_CHECK_BUILD_ID ?? __VERSION_CHECK_BUILD_ID__;

function refreshPage() {
	window.location.reload();
}

const App = defineComponent({
	name: "App",
	setup() {
		const versionCheck = useVersionCheck({
			currentVersion,
			intervalMs: 30_000,
		});

		return () =>
			h("main", [
				h("h1", "Vue Vite version check"),
				h("p", `Current build: ${currentVersion}`),
				h("p", `Status: ${versionCheck.value.status}`),
				versionCheck.value.updateAvailable
					? h("section", { role: "status", class: "update" }, [
							h("span", "New version available."),
							h("button", { type: "button", onClick: refreshPage }, "Refresh"),
						])
					: null,
			]);
	},
});

createApp(App).mount("#app");
