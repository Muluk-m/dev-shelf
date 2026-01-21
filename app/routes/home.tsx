import * as LucideIcons from "lucide-react";
import {
	ArrowUpRight,
	Code,
	ExternalLink,
	Flame,
	LayoutGrid,
	Search,
	Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/layout/header";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { useSearch } from "~/hooks/use-search";
import { useToolsInit } from "~/hooks/use-tools-query";
import { recordToolUsage } from "~/lib/api";
import { cn } from "~/lib/utils";
import { useToolsStore } from "~/stores/tools-store";
import type { Tool, ToolEnvironment } from "~/types/tool";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "DevTools Platform | 研发工具集成平台" },
		{
			name: "description",
			content: "内部研发工具集成平台，提供常用开发工具的统一入口",
		},
	];
}

const getIconComponent = (iconName: string) => {
	const IconComponent = (LucideIcons as Record<string, any>)[iconName];
	return IconComponent || LucideIcons.Code;
};

export default function Home() {
	const { tools, toolCategories, usageStats, _hasHydrated } = useToolsStore();
	useToolsInit();
	const navigate = useNavigate();
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const { query, setQuery, updateFilters, searchResults } = useSearch(tools);

	// 当分类变化时更新筛选器
	useEffect(() => {
		updateFilters({ category: selectedCategory || undefined });
	}, [selectedCategory, updateFilters]);

	const toolCounts = useMemo(() => {
		return tools.reduce(
			(acc, tool) => {
				acc[tool.category] = (acc[tool.category] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
	}, [tools]);

	const toolMap = useMemo(() => {
		return new Map(tools.map((tool) => [tool.id, tool]));
	}, [tools]);

	// 获取热门工具（基于使用频率）
	const hotTools = useMemo(() => {
		if (usageStats.length > 0) {
			return usageStats
				.map((usage) => {
					const tool = toolMap.get(usage.toolId);
					if (!tool || tool.status !== "active") return null;
					return { tool, usageCount: usage.usageCount };
				})
				.filter(
					(item): item is { tool: Tool; usageCount: number } => item !== null,
				)
				.slice(0, 8);
		}
		return [];
	}, [usageStats, toolMap]);

	const handleEnvClick = (tool: Tool, env: ToolEnvironment) => {
		void recordToolUsage(tool.id);
		if (tool.isInternal) {
			navigate(env.url);
		} else if (env.isExternal) {
			window.open(env.url, "_blank");
		} else {
			window.location.href = env.url;
		}
	};

	const handleCategoryChange = (categoryId: string | null) => {
		setSelectedCategory(categoryId);
	};

	if (!_hasHydrated) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-pulse flex flex-col items-center gap-4">
					<div className="h-12 w-12 rounded-2xl bg-muted" />
					<div className="h-4 w-32 rounded-lg bg-muted" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header showSearch={false} />

			<div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
				{/* Hero 区域 - 标题 + 搜索 */}
				<div className="text-center mb-8">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
						<span className="text-gradient">DevTools</span>
						<span className="text-foreground"> Platform</span>
					</h1>
					<p className="text-muted-foreground mb-6">
						统一入口，高效协作。集成{" "}
						<span className="text-foreground font-medium">{tools.length}</span>{" "}
						款常用开发工具
					</p>

					{/* 搜索框 */}
					<div className="relative max-w-2xl mx-auto">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
						<Input
							type="text"
							placeholder="搜索工具名称、描述或标签..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="h-12 pl-12 pr-4 text-base rounded-2xl bg-card border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
						/>
						<div className="absolute right-4 top-1/2 -translate-y-1/2">
							<kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border bg-muted/50 px-1.5 font-mono text-[10px] text-muted-foreground">
								<span>⌘</span>K
							</kbd>
						</div>
					</div>
				</div>

				<div className="flex gap-8">
					{/* 左侧边栏 - 分类导航 + 热门工具 */}
					<aside className="hidden lg:block w-56 flex-shrink-0">
						<div className="sticky top-24 space-y-6">
							{/* 热门工具 */}
							{hotTools.length > 0 && (
								<div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-rose-500/5 border border-orange-500/20">
									<div className="flex items-center gap-2 mb-3">
										<Flame className="h-4 w-4 text-orange-500" />
										<span className="text-xs font-semibold">热门工具</span>
									</div>
									<div className="space-y-1">
										{hotTools.slice(0, 6).map(({ tool, usageCount }, index) => (
											<button
												key={tool.id}
												type="button"
												onClick={() =>
													handleEnvClick(tool, tool.environments[0])
												}
												className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer group"
											>
												<span
													className={cn(
														"flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold flex-shrink-0",
														index === 0
															? "bg-orange-500 text-white"
															: index === 1
																? "bg-slate-400 text-white"
																: index === 2
																	? "bg-amber-600 text-white"
																	: "bg-muted/50 text-muted-foreground",
													)}
												>
													{index + 1}
												</span>
												{tool.icon ? (
													<img
														src={tool.icon}
														alt=""
														className="h-4 w-4 rounded object-contain flex-shrink-0"
													/>
												) : (
													<Code className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												)}
												<span className="flex-1 text-xs truncate text-left group-hover:text-primary transition-colors">
													{tool.name}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{usageCount}
												</span>
											</button>
										))}
									</div>
								</div>
							)}

							{/* 分类列表 */}
							<div className="space-y-1">
								<h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
									工具分类
								</h3>
								<button
									type="button"
									onClick={() => handleCategoryChange(null)}
									className={cn(
										"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
										selectedCategory === null
											? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
											: "text-foreground hover:bg-accent",
									)}
								>
									<LayoutGrid className="h-4 w-4" />
									<span className="flex-1 text-left">全部工具</span>
									<span
										className={cn(
											"text-xs px-2 py-0.5 rounded-md",
											selectedCategory === null
												? "bg-white/20"
												: "bg-muted text-muted-foreground",
										)}
									>
										{tools.length}
									</span>
								</button>

								{toolCategories.map((category) => {
									const IconComponent = getIconComponent(category.icon);
									const isSelected = selectedCategory === category.id;
									const count = toolCounts[category.id] || 0;

									return (
										<button
											key={category.id}
											type="button"
											onClick={() => handleCategoryChange(category.id)}
											className={cn(
												"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
												isSelected
													? "shadow-md"
													: "text-foreground hover:bg-accent",
											)}
											style={
												isSelected
													? {
															backgroundColor: category.color,
															color: "white",
															boxShadow: `0 4px 14px -3px ${category.color}50`,
														}
													: undefined
											}
										>
											<IconComponent
												className="h-4 w-4"
												style={{
													color: isSelected ? "white" : category.color,
												}}
											/>
											<span className="flex-1 text-left">{category.name}</span>
											<span
												className={cn(
													"text-xs px-2 py-0.5 rounded-md",
													isSelected
														? "bg-white/20"
														: "bg-muted text-muted-foreground",
												)}
											>
												{count}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</aside>

					{/* 主内容区 - 工具网格 */}
					<main className="flex-1 min-w-0">
						{/* 移动端分类选择器 */}
						<div className="lg:hidden mb-6">
							<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
								<button
									type="button"
									onClick={() => handleCategoryChange(null)}
									className={cn(
										"flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
										selectedCategory === null
											? "bg-primary text-primary-foreground"
											: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
									)}
								>
									全部 ({tools.length})
								</button>
								{toolCategories.map((category) => {
									const isSelected = selectedCategory === category.id;
									return (
										<button
											key={category.id}
											type="button"
											onClick={() => handleCategoryChange(category.id)}
											className={cn(
												"flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
												isSelected
													? "text-white"
													: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
											)}
											style={
												isSelected
													? { backgroundColor: category.color }
													: undefined
											}
										>
											{category.name} ({toolCounts[category.id] || 0})
										</button>
									);
								})}
							</div>
						</div>

						{/* 当前分类标题 */}
						{selectedCategory && (
							<div className="mb-6">
								{(() => {
									const category = toolCategories.find(
										(c) => c.id === selectedCategory,
									);
									if (!category) return null;
									const IconComponent = getIconComponent(category.icon);
									return (
										<div className="flex items-center gap-3">
											<div
												className="p-2.5 rounded-xl"
												style={{ backgroundColor: `${category.color}20` }}
											>
												<IconComponent
													className="h-5 w-5"
													style={{ color: category.color }}
												/>
											</div>
											<div>
												<h2 className="text-xl font-semibold">
													{category.name}
												</h2>
												<p className="text-sm text-muted-foreground">
													{toolCounts[category.id] || 0} 个工具
												</p>
											</div>
										</div>
									);
								})()}
							</div>
						)}

						{/* 工具卡片网格 */}
						{searchResults.tools.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
								{searchResults.tools.map((tool, index) => (
									<ToolCardCompact
										key={tool.id}
										tool={tool}
										onEnvClick={(env) => handleEnvClick(tool, env)}
										index={index}
									/>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<div className="p-4 rounded-2xl bg-muted/50 mb-4">
									<Search className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-semibold mb-2">未找到工具</h3>
								<p className="text-muted-foreground max-w-sm">
									{query
										? `没有找到与 "${query}" 相关的工具`
										: "该分类下暂无可用工具"}
								</p>
								{(query || selectedCategory) && (
									<button
										type="button"
										onClick={() => {
											setQuery("");
											handleCategoryChange(null);
										}}
										className="mt-4 text-primary hover:underline text-sm font-medium"
									>
										清除筛选条件
									</button>
								)}
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}

// 紧凑型工具卡片组件
interface ToolCardCompactProps {
	tool: Tool;
	onEnvClick: (env: ToolEnvironment) => void;
	index: number;
}

function ToolCardCompact({ tool, onEnvClick, index }: ToolCardCompactProps) {
	const hasMultipleEnvs = tool.environments.length > 1;
	const defaultEnv = tool.environments[0];
	const isExternal = !tool.isInternal && defaultEnv?.isExternal;

	// 单环境时整卡片可点击
	if (!hasMultipleEnvs) {
		return (
			<button
				type="button"
				onClick={() => onEnvClick(defaultEnv)}
				className={cn(
					"group relative flex items-start gap-4 p-4 rounded-2xl text-left w-full",
					"bg-card border border-border/50",
					"transition-all duration-200 cursor-pointer",
					"hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
				)}
				style={{ animationDelay: `${index * 30}ms` }}
			>
				{/* 图标 */}
				<div className="flex-shrink-0">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform group-hover:scale-105">
						{tool.icon ? (
							<img
								src={tool.icon}
								alt=""
								className="h-6 w-6 object-contain"
								loading="lazy"
							/>
						) : (
							<Code className="h-6 w-6 text-primary" />
						)}
					</div>
				</div>

				{/* 内容 */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
							{tool.name}
						</h3>
						{tool.isInternal && (
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
							>
								<Sparkles className="h-2.5 w-2.5 mr-0.5" />
								内部
							</Badge>
						)}
						{isExternal && (
							<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
						)}
					</div>
					<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
						{tool.description}
					</p>
					{/* 标签 */}
					{tool.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{tool.tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
								>
									{tag}
								</span>
							))}
							{tool.tags.length > 3 && (
								<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
									+{tool.tags.length - 3}
								</span>
							)}
						</div>
					)}
				</div>

				{/* 箭头指示器 */}
				<ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
			</button>
		);
	}

	// 多环境时显示环境按钮
	return (
		<div
			className={cn(
				"group relative flex flex-col p-4 rounded-2xl text-left w-full",
				"bg-card border border-border/50",
				"transition-all duration-200",
				"hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
			)}
			style={{ animationDelay: `${index * 30}ms` }}
		>
			<div className="flex items-start gap-4">
				{/* 图标 */}
				<div className="flex-shrink-0">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform group-hover:scale-105">
						{tool.icon ? (
							<img
								src={tool.icon}
								alt=""
								className="h-6 w-6 object-contain"
								loading="lazy"
							/>
						) : (
							<Code className="h-6 w-6 text-primary" />
						)}
					</div>
				</div>

				{/* 内容 */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
							{tool.name}
						</h3>
						{tool.isInternal && (
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
							>
								<Sparkles className="h-2.5 w-2.5 mr-0.5" />
								内部
							</Badge>
						)}
						{isExternal && (
							<ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
						)}
					</div>
					<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
						{tool.description}
					</p>
					{/* 标签 */}
					{tool.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{tool.tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
								>
									{tag}
								</span>
							))}
							{tool.tags.length > 3 && (
								<span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
									+{tool.tags.length - 3}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{/* 环境选择按钮 */}
			<div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
				{tool.environments.map((env) => (
					<button
						key={env.name}
						type="button"
						onClick={() => onEnvClick(env)}
						className={cn(
							"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
							"transition-all duration-150 cursor-pointer",
							env.name === "production"
								? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
								: env.name === "test" || env.name === "staging"
									? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
									: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
						)}
					>
						{env.isExternal && (
							<ExternalLink className="h-3 w-3" />
						)}
						{env.label}
					</button>
				))}
			</div>
		</div>
	);
}
