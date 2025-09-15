"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderContext {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = React.createContext<
	ThemeProviderContext | undefined
>(undefined);

interface ThemeProviderProps {
	children: React.ReactNode;
	attribute?: string;
	defaultTheme?: Theme;
	enableSystem?: boolean;
	disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
	children,
	attribute = "class",
	defaultTheme = "system",
	enableSystem = true,
	disableTransitionOnChange = false,
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = React.useState<Theme>(defaultTheme);

	React.useEffect(() => {
		const storedTheme = localStorage.getItem("theme") as Theme;
		if (storedTheme) {
			setTheme(storedTheme);
		}
	}, []);

	React.useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "system" && enableSystem) {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";
			root.classList.add(systemTheme);
		} else {
			root.classList.add(theme);
		}

		localStorage.setItem("theme", theme);
	}, [theme, enableSystem]);

	const value = {
		theme,
		setTheme,
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = React.useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
