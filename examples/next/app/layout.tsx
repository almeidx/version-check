import type { ReactNode } from "react";
import "./style.css";

export const metadata = {
	title: "Next version check",
	description: "Example for @almeidx/version-check-next",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
