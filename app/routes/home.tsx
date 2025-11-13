import { Flame, Layers } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CategoryFilter } from "~/components/category-filter";
import { Header } from "~/components/layout/header";
import { ToolCard } from "~/components/tool-card";
import { useSearch } from "~/hooks/use-search";
import { useToolsInit } from "~/hooks/use-tools-query";
import { recordToolUsage } from "~/lib/api";
import { useToolsStore } from "~/store/tools-store";
import type { Tool } from "~/types/tool";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "研发平台工具站 | DevTools Platform" },
		{
			name: "description",
			content: "内部工具收拢平台，提供常用开发工具的统一入口",
		},
	];
}

export default function Home() {
	const { tools, toolCategories, usageStats, _hasHydrated } = useToolsStore();
	useToolsInit(); // Trigger background update
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

	const {
		query,
		setQuery,
		filters,
		updateFilters,
		searchResults,
		suggestions,
		searchHistory,
		performSearch,
	} = useSearch(tools);

	// 确保搜索钩子中的分类筛选器与当前选中的分类保持同步
	useEffect(() => {
		if (selectedCategory !== filters.category) {
			updateFilters({ category: selectedCategory || undefined });
		}
	}, [selectedCategory, filters.category, updateFilters]);

	// 计算每个分类的工具数量
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

	const recommendedTools = useMemo(() => {
		if (usageStats.length > 0) {
			const withUsage = usageStats
				.map((usage) => {
					const tool = toolMap.get(usage.toolId);
					if (!tool || tool.status !== "active") return null;
					return { tool, usageCount: usage.usageCount };
				})
				.filter(
					(item): item is { tool: Tool; usageCount: number } => item !== null,
				)
				.slice(0, 4);
			if (withUsage.length > 0) {
				return withUsage;
			}
		}

		const fallback = [...tools]
			.sort((a, b) => {
				const aUpdated = Date.parse(a.lastUpdated) || 0;
				const bUpdated = Date.parse(b.lastUpdated) || 0;
				const aScore = (a.isInternal ? 1 : 0) * 100 + aUpdated;
				const bScore = (b.isInternal ? 1 : 0) * 100 + bUpdated;
				return bScore - aScore;
			})
			.slice(0, 4)
			.map((tool) => ({ tool, usageCount: 0 }));

		return fallback;
	}, [tools, usageStats, toolMap]);

	const handleViewDetails = (tool: Tool) => {
		const url = tool.environments[0].url;
		recordToolUsage(tool.id);
		window.open(url, "_blank");
	};

	const handleCategoryChange = (categoryId: string | null) => {
		setSelectedCategory(categoryId);
		updateFilters({ category: categoryId || undefined });
	};

	// Don't render until hydration is complete to avoid flash
	if (!_hasHydrated) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header
				searchValue={query}
				onSearchChange={setQuery}
				onSearch={performSearch}
				searchSuggestions={suggestions}
				searchHistory={searchHistory}
			/>
			<main className="container mx-auto px-4 py-8">
				{recommendedTools.length > 0 && (
					<section className="mb-12">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h2 className="text-2xl font-semibold flex items-center gap-2">
									<Flame className="h-5 w-5 text-primary" />
									常用工具推荐
								</h2>
								<p className="text-sm text-muted-foreground">
									一键直达高频使用的工具
								</p>
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							{recommendedTools.map(({ tool, usageCount }) => (
								<button
									key={tool.id}
									type="button"
									onClick={() => handleViewDetails(tool)}
									className="group cursor-pointer flex items-center gap-3 rounded-lg border bg-card/70 p-3 text-left shadow-sm transition hover:border-primary/60 hover:bg-primary/5"
								>
									<div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
										{tool.icon ? (
											<img
												src={tool.icon}
												alt={tool.name}
												className="h-7 w-7 object-contain"
												loading="lazy"
											/>
										) : (
											<Layers className="h-5 w-5 text-primary" />
										)}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground group-hover:text-primary">
											{tool.name}
										</p>
										<p className="text-xs text-muted-foreground line-clamp-2">
											{usageCount > 0
												? `最近使用 ${usageCount} 次`
												: tool.description}
										</p>
									</div>
								</button>
							))}
						</div>
					</section>
				)}

				<CategoryFilter
					categories={toolCategories}
					selectedCategory={selectedCategory}
					onCategoryChange={handleCategoryChange}
					toolCounts={toolCounts}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{searchResults.tools.map((tool) => (
						<ToolCard
							key={tool.id}
							tool={tool}
							onViewDetails={handleViewDetails}
						/>
					))}
				</div>

				{searchResults.tools.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground">该分类下暂无工具</p>
					</div>
				)}
			</main>
		</div>
	);
}
