import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { ThemeProvider } from "~/components/theme-provider";
import { CommandPanelProvider } from "~/context/command-panel-context";
import type { Route } from "./+types/root";
import "./app.css";

export async function loader({ context }: Route.LoaderArgs) {
  try {
    const toolsDb = await import("../lib/database/tools");
    const db = context.cloudflare.env.DB;
    const [tools, toolCategories, usageStats] = await Promise.all([
      toolsDb.getTools(db),
      toolsDb.getToolCategories(db),
      toolsDb.getToolUsageStats(db, 12),
    ]);

    return { tools, toolCategories, usageStats };
  } catch (error) {
    console.error("Failed to load global data:", error);
    return { tools: [], toolCategories: [], usageStats: [] };
  }
}

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
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { tools } = useLoaderData<typeof loader>();
  return (
    <CommandPanelProvider tools={tools}>
      <Outlet />
    </CommandPanelProvider>
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
