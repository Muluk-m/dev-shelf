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
	const [theme, setTheme] = React.useState<Theme>(() => {
		// 在服务端渲染时返回默认主题
		if (typeof window === "undefined") return defaultTheme;

		// 在客户端，从localStorage读取主题
		const storedTheme = localStorage.getItem("theme") as Theme;
		return storedTheme || defaultTheme;
	});

	React.useEffect(() => {
		const root = window.document.documentElement;

		// 移除所有主题类
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
