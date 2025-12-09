import { Command } from "lucide-react";
import { Link } from "react-router";
import { SearchInput } from "~/components/search/search-input";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { UserProfile } from "~/components/user-profile";
import { useCommandPanelContext } from "~/context/command-panel-context";
import { usePermissions } from "~/hooks/use-permissions";
import logo from "../../../public/logo.svg";

interface HeaderProps {
	searchValue?: string;
	showSearch?: boolean;
	onSearchChange?: (value: string) => void;
	onSearch?: (query: string) => void;
	searchSuggestions?: string[];
	searchHistory?: string[];
	onOpenCommandPanel?: () => void;
}

export function Header({
	searchValue = "",
	showSearch = true,
	onSearchChange,
	onSearch,
	searchSuggestions = [],
	searchHistory = [],
	onOpenCommandPanel,
}: HeaderProps) {
	const commandPanel = useCommandPanelContext();
	const { hasRole } = usePermissions();
	const handleOpenCommandPanel = onOpenCommandPanel ?? commandPanel?.openPanel;
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<img src={logo} alt="logo" className="h-8 w-8 rounded-lg" />
						<h1 className="text-xl font-bold">DevTools Platform</h1>
					</div>
					<nav className="hidden md:flex items-center gap-4">
						<Button variant="ghost" size="sm" asChild>
							<Link to="/">首页</Link>
						</Button>
						{hasRole("developer") && (
							<Button variant="ghost" size="sm" asChild>
								<Link to="/admin">管理</Link>
							</Button>
						)}
					</nav>
				</div>

				<div className="flex items-center gap-4">
					{showSearch && (
						<SearchInput
							value={searchValue}
							onChange={onSearchChange || (() => {})}
							onSearch={onSearch || (() => {})}
							suggestions={searchSuggestions}
							searchHistory={searchHistory}
							className="w-64"
						/>
					)}

					<Button
						variant="outline"
						size="sm"
						className="gap-2 bg-transparent"
						onClick={handleOpenCommandPanel}
					>
						<Command className="h-4 w-4" />
						<span className="hidden sm:inline">命令面板</span>
						<kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
							<span className="text-xs">⌘</span>K
						</kbd>
					</Button>

					<ThemeToggle />
					<UserProfile />
				</div>
			</div>
		</header>
	);
}
