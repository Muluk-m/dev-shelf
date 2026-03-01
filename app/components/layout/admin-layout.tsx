import { ChevronLeft, ChevronRight, Home, Shield, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { UserProfile } from "~/components/user-profile";
import { cn } from "~/lib/utils";
import logo from "../../../public/logo.svg";

interface AdminLayoutProps {
	children: React.ReactNode;
	title: string;
	description?: string;
	actions?: React.ReactNode;
}

const sidebarNavItems = [
	{
		title: "工具管理",
		href: "/admin",
		icon: Wrench,
	},
	{
		title: "用户管理",
		href: "/admin/users",
		icon: Users,
	},
	{
		title: "权限管理",
		href: "/admin/permissions",
		icon: Shield,
	},
];

export function AdminLayout({
	children,
	title,
	description,
	actions,
}: AdminLayoutProps) {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);

	const isActive = (path: string) => {
		if (path === "/admin") {
			return location.pathname === "/admin";
		}
		return location.pathname.startsWith(path);
	};

	return (
		<TooltipProvider delayDuration={0}>
			<div className="min-h-screen bg-slate-50 dark:bg-slate-950">
				{/* 侧边栏 */}
				<aside
					className={cn(
						"fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
						"bg-slate-900 dark:bg-slate-950 border-r border-slate-800",
						collapsed ? "w-[72px]" : "w-64",
					)}
				>
					{/* Logo 区域 */}
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
								alt="DevTools"
								className="h-9 w-9 rounded-xl transition-transform group-hover:scale-105"
							/>
							{!collapsed && (
								<div className="flex flex-col">
									<span className="text-lg font-bold tracking-tight text-white">
										DevTools
									</span>
									<span className="text-[10px] text-slate-400 -mt-0.5">
										管理后台
									</span>
								</div>
							)}
						</Link>
					</div>

					{/* 导航菜单 */}
					<div className="flex flex-col h-[calc(100vh-64px)]">
						<nav className="flex-1 space-y-1 p-3">
							{/* 返回首页 */}
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
											{!collapsed && <span>返回首页</span>}
										</Button>
									</Link>
								</TooltipTrigger>
								{collapsed && (
									<TooltipContent side="right">返回首页</TooltipContent>
								)}
							</Tooltip>

							<div className="pt-4 pb-2">
								{!collapsed && (
									<p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
										管理
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

						{/* 底部区域 */}
						<div className="border-t border-slate-800 p-3 space-y-2">
							{/* 折叠按钮 */}
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
										<span>收起菜单</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</aside>

				{/* 主内容区 */}
				<div
					className={cn(
						"min-h-screen transition-all duration-300 ease-in-out",
						collapsed ? "pl-[72px]" : "pl-64",
					)}
				>
					{/* 顶部导航栏 */}
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
									<ThemeToggle />
									<UserProfile />
								</div>
							</div>
						</div>
					</header>

					{/* 页面内容 */}
					<main className="p-6">{children}</main>
				</div>
			</div>
		</TooltipProvider>
	);
}
