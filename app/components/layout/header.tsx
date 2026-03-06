import { Command, Github, Home, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { LanguageToggle } from "~/components/language-toggle";
import { SearchInput } from "~/components/search/search-input";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { UserProfile } from "~/components/user-profile";
import { useCommandPanelContext } from "~/context/command-panel-context";
import { usePermissions } from "~/hooks/use-permissions";
import { cn } from "~/lib/utils";
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
	const location = useLocation();
	const { t } = useTranslation();
	const handleOpenCommandPanel = onOpenCommandPanel ?? commandPanel?.openPanel;

	const isActive = (path: string) => location.pathname === path;

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
			<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo & Brand */}
					<div className="flex items-center gap-8">
						<Link
							to="/"
							className="flex items-center gap-3 group transition-all duration-200"
						>
							<img
								src={logo}
								alt="DevShelf"
								className="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
							/>
							<div className="flex flex-col">
								<span className="text-lg font-bold tracking-tight">
									{t("brand.name")}
								</span>
								<span className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">
									{t("brand.subtitle")}
								</span>
							</div>
						</Link>

						{/* Navigation */}
						<nav className="hidden md:flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								asChild
								className={cn(
									"gap-2 rounded-lg transition-all duration-200",
									isActive("/") &&
										"bg-primary/10 text-primary hover:bg-primary/15",
								)}
							>
								<Link to="/">
									<Home className="h-4 w-4" />
									{t("nav.home")}
								</Link>
							</Button>
							{hasRole("admin") && (
								<Button
									variant="ghost"
									size="sm"
									asChild
									className={cn(
										"gap-2 rounded-lg transition-all duration-200",
										isActive("/admin") &&
											"bg-primary/10 text-primary hover:bg-primary/15",
									)}
								>
									<Link to="/admin">
										<Settings className="h-4 w-4" />
										{t("nav.admin")}
									</Link>
								</Button>
							)}
						</nav>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3">
						{showSearch && (
							<SearchInput
								value={searchValue}
								onChange={onSearchChange || (() => {})}
								onSearch={onSearch || (() => {})}
								suggestions={searchSuggestions}
								searchHistory={searchHistory}
								className="w-48 lg:w-64"
							/>
						)}

						<div className="hidden sm:flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 rounded-lg text-muted-foreground hover:text-foreground"
								onClick={handleOpenCommandPanel}
							>
								<Command className="h-4 w-4" />
								<kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium lg:flex">
									<span className="text-xs">⌘</span>K
								</kbd>
							</Button>
						</div>

						<div className="flex items-center gap-2 pl-2 border-l border-border/50">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								asChild
							>
								<a
									href="https://github.com/Muluk-m/dev-shelf"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Github className="h-4 w-4" />
								</a>
							</Button>
							<LanguageToggle />
							<ThemeToggle />
							<UserProfile />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
