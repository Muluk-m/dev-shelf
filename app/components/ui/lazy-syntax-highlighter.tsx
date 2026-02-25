import { useEffect, useState } from "react";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

interface LazySyntaxHighlighterProps
	extends Omit<SyntaxHighlighterProps, "children"> {
	children: string;
	language?: string;
}

export function LazySyntaxHighlighter({
	children,
	language = "json",
	...props
}: LazySyntaxHighlighterProps) {
	const [Component, setComponent] =
		useState<React.ComponentType<SyntaxHighlighterProps> | null>(null);

	useEffect(() => {
		Promise.all([
			import("react-syntax-highlighter").then((mod) => mod.Prism),
			import("react-syntax-highlighter/dist/esm/styles/prism").then(
				(mod) => mod.vscDarkPlus,
			),
		]).then(([Highlighter, style]) => {
			const StyledHighlighter = (p: SyntaxHighlighterProps) => (
				<Highlighter style={style} {...p} />
			);
			setComponent(
				() => StyledHighlighter as React.ComponentType<SyntaxHighlighterProps>,
			);
		});
	}, []);

	if (!Component) {
		return (
			<pre className="text-sm font-mono whitespace-pre-wrap p-4 bg-muted/30 rounded-md">
				{children}
			</pre>
		);
	}

	return (
		<Component language={language} {...props}>
			{children}
		</Component>
	);
}
