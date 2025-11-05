import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
	useNavigate,
} from "react-router";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { CommandPanelProvider } from "~/context/command-panel-context";
import { useSetupStatus } from "~/hooks/use-setup-status";
import { useToolsInit } from "~/hooks/use-tools-query";
import { useToolsStore } from "~/stores/tools-store";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="generator" content="v0.app" />
				<Meta />
				<Links />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									var theme = localStorage.getItem('theme');
									var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
									var appliedTheme = theme === 'system' || !theme ? systemTheme : theme;
									document.documentElement.classList.add(appliedTheme);
								} catch (e) {}
							})();
						`,
					}}
				/>
			</head>
			<body className="font-sans antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Toaster position="top-right" />
					{children}
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

/**
 * Guard that redirects to /setup when the system has no users,
 * and redirects away from /setup when already initialized.
 */
function SetupGuard({ children }: { children: React.ReactNode }) {
	const { needsSetup, loading } = useSetupStatus();
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (loading || needsSetup === null) return;

		const isSetupPage = location.pathname === "/setup";

		if (needsSetup && !isSetupPage) {
			navigate("/setup", { replace: true });
		} else if (!needsSetup && isSetupPage) {
			navigate("/", { replace: true });
		}
	}, [needsSetup, loading, location.pathname, navigate]);

	return <>{children}</>;
}

function AppContent() {
	const { tools } = useToolsStore();
	useToolsInit();

	// Use cached tools immediately, query will update in background
	return (
		<CommandPanelProvider tools={tools}>
			<SetupGuard>
				<Outlet />
			</SetupGuard>
		</CommandPanelProvider>
	);
}

export default function App() {
	// Create a client instance per request to avoid sharing state
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute default
						retry: 2,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<AppContent />
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
