import { ChevronLeft, ChevronRight, Home, Shield, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { LanguageToggle } from "~/components/language-toggle";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { UserProfile } from "~/components/user-profile";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import logo from "../../../public/logo.svg";

interface AdminLayoutProps {
	children: React.ReactNode;
	title: string;
	description?: string;
	actions?: React.ReactNode;
}

export function AdminLayout({
	children,
	title,
	description,
	actions,
}: AdminLayoutProps) {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);
	const { t } = useI18n();

	const sidebarNavItems = [
		{ title: t("admin.tools"), href: "/admin", icon: Wrench },
		{ title: t("admin.users"), href: "/admin/users", icon: Users },
		{ title: t("admin.permissions"), href: "/admin/permissions", icon: Shield },
	];

	const isActive = (path: string) => {
		if (path === "/admin") {
			return location.pathname === "/admin";
		}
		return location.pathname.startsWith(path);
	};

	return (
		<TooltipProvider delayDuration={0}>
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950">
				{/* Sidebar */}
				<aside
					className={cn(
						"fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
						"bg-slate-900 dark:bg-slate-950 border-r border-slate-800",
						collapsed ? "w-[72px]" : "w-64",
					)}
				>
					{/* Logo area */}
					<div
						className={cn(
							"flex h-16 items-center border-b border-slate-800 px-4",
							collapsed ? "justify-center" : "justify-between",
						)}
					>
						<Link
							to="/"
							className="flex items-center gap-3 group transition-all duration-200"
						>
							<img
								src={logo}
								alt="DevShelf"
								className="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
							/>
							{!collapsed && (
								<div className="flex flex-col">
									<span className="text-lg font-bold tracking-tight text-white">
										{t("brand.name")}
									</span>
									<span className="text-[10px] text-slate-400 -mt-0.5">
										{t("brand.adminSubtitle")}
									</span>
								</div>
							)}
						</Link>
					</div>

					{/* Navigation */}
					<div className="flex flex-col h-[calc(100vh-64px)]">
						<nav className="flex-1 space-y-1 p-3">
							{/* Back to home */}
							<Tooltip>
								<TooltipTrigger asChild>
									<Link to="/">
										<Button
											variant="ghost"
											className={cn(
												"w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200",
												collapsed && "justify-center px-2",
											)}
										>
											<Home className="h-5 w-5 flex-shrink-0" />
											{!collapsed && <span>{t("admin.backToHome")}</span>}
										</Button>
									</Link>
								</TooltipTrigger>
								{collapsed && (
									<TooltipContent side="right">{t("admin.backToHome")}</TooltipContent>
								)}
							</Tooltip>

							<div className="pt-4 pb-2">
								{!collapsed && (
									<p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
										{t("admin.manage")}
									</p>
								)}
							</div>

							{sidebarNavItems.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.href);
								return (
									<Tooltip key={item.href}>
										<TooltipTrigger asChild>
											<Link to={item.href}>
												<Button
													variant="ghost"
													className={cn(
														"w-full justify-start gap-3 transition-all duration-200",
														collapsed && "justify-center px-2",
														active
															? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
															: "text-slate-400 hover:text-white hover:bg-slate-800/80",
													)}
												>
													<Icon className="h-5 w-5 flex-shrink-0" />
													{!collapsed && <span>{item.title}</span>}
												</Button>
											</Link>
										</TooltipTrigger>
										{collapsed && (
											<TooltipContent side="right">{item.title}</TooltipContent>
										)}
									</Tooltip>
								);
							})}
						</nav>

						{/* Bottom area */}
						<div className="border-t border-slate-800 p-3 space-y-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setCollapsed(!collapsed)}
								className={cn(
									"w-full justify-center text-slate-400 hover:text-white hover:bg-slate-800/80",
								)}
							>
								{collapsed ? (
									<ChevronRight className="h-5 w-5" />
								) : (
									<>
										<ChevronLeft className="h-5 w-5 mr-2" />
										<span>{t("admin.collapse")}</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</aside>

				{/* Main content */}
				<div
					className={cn(
						"min-h-screen transition-all duration-300 ease-in-out",
						collapsed ? "pl-[72px]" : "pl-64",
					)}
				>
					{/* Top navbar */}
					<header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
						<div className="flex h-full items-center justify-between px-6">
							<div>
								<h1 className="text-xl font-semibold text-slate-900 dark:text-white">
									{title}
								</h1>
								{description && (
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{description}
									</p>
								)}
							</div>
							<div className="flex items-center gap-4">
								{actions}
								<div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
									<LanguageToggle />
									<ThemeToggle />
									<UserProfile />
								</div>
							</div>
						</div>
					</header>

					{/* Page content */}
					<main className="p-6">{children}</main>
				</div>
			</div>
		</TooltipProvider>
	);
}
