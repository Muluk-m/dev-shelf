"use client";

import { Command } from "lucide-react";
import { SearchInput } from "~/components/search/search-input";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";

interface HeaderProps {
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	onSearch?: (query: string) => void;
	searchSuggestions?: string[];
	searchHistory?: string[];
	onOpenCommandPanel?: () => void;
}

export function Header({
	searchValue = "",
	onSearchChange,
	onSearch,
	searchSuggestions = [],
	searchHistory = [],
	onOpenCommandPanel,
}: HeaderProps) {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
							<Command className="h-4 w-4 text-primary-foreground" />
						</div>
						<h1 className="text-xl font-bold">DevTools Platform</h1>
					</div>
					<nav className="hidden md:flex items-center gap-4">
						<Button variant="ghost" size="sm" asChild>
							<a href="/">首页</a>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<a href="/admin">管理</a>
						</Button>
					</nav>
				</div>

				<div className="flex items-center gap-4">
					<SearchInput
						value={searchValue}
						onChange={onSearchChange || (() => {})}
						onSearch={onSearch || (() => {})}
						suggestions={searchSuggestions}
						searchHistory={searchHistory}
						className="w-64"
					/>

					<Button
						variant="outline"
						size="sm"
						className="gap-2 bg-transparent"
						onClick={onOpenCommandPanel}
					>
						<Command className="h-4 w-4" />
						<span className="hidden sm:inline">命令面板</span>
						<kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
							<span className="text-xs">⌘</span>K
						</kbd>
					</Button>

					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
