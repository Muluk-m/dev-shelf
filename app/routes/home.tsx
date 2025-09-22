import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { CategoryFilter } from "~/components/category-filter";
import { CommandPanel } from "~/components/command-panel/command-panel";
import { Header } from "~/components/layout/header";
import { ToolCard } from "~/components/tool-card";
import { useCommandPanel } from "~/hooks/use-command-panel";
import { useSearch } from "~/hooks/use-search";
import type { Tool } from "~/types/tool";
import type { Route } from "./+types/home";

export async function loader(ctx: Route.LoaderArgs) {
	try {
		const toolsDb = await import("../../lib/database/tools");
		const db = ctx.context.cloudflare.env.DB;
		const [tools, toolCategories] = await Promise.all([
			toolsDb.getTools(db),
			toolsDb.getToolCategories(db),
		]);
		return { tools, toolCategories };
	} catch (error) {
		console.error("Failed to load data:", error);
		return { tools: [], toolCategories: [] };
	}
}

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
	const { tools, toolCategories } = useLoaderData<typeof loader>();
	const navigate = useNavigate();
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

	const {
		isOpen: isCommandPanelOpen,
		query: commandQuery,
		setQuery: setCommandQuery,
		selectedIndex: commandSelectedIndex,
		setSelectedIndex: setCommandSelectedIndex,
		groupedCommands,
		openPanel: openCommandPanel,
		closePanel: closeCommandPanel,
		executeCommand,
	} = useCommandPanel(tools);

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

	const handleViewDetails = (tool: Tool) => {
		navigate(`/tools/${tool.id}`);
	};

	const handleCategoryChange = (categoryId: string | null) => {
		setSelectedCategory(categoryId);
		updateFilters({ category: categoryId || undefined });
	};

	return (
		<div className="min-h-screen bg-background">
			<Header
				searchValue={query}
				onSearchChange={setQuery}
				onSearch={performSearch}
				searchSuggestions={suggestions}
				searchHistory={searchHistory}
				onOpenCommandPanel={openCommandPanel}
			/>
			<main className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4 mb-12">
					<h1 className="text-4xl font-bold tracking-tight">研发平台工具站</h1>
					<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
						统一管理和访问常用的内部开发工具，提升团队协作效率
					</p>
					<div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
						<span>共 {tools.length} 个工具</span>
						<span>•</span>
						<span>{toolCategories.length} 个分类</span>
						<span>•</span>
						<span>
							{tools.filter((t) => t.status === "active").length} 个可用
						</span>
					</div>
				</div>

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

			<CommandPanel
				isOpen={isCommandPanelOpen}
				onClose={closeCommandPanel}
				query={commandQuery}
				onQueryChange={setCommandQuery}
				selectedIndex={commandSelectedIndex}
				onSelectedIndexChange={setCommandSelectedIndex}
				groupedCommands={groupedCommands}
				onExecuteCommand={executeCommand}
			/>
		</div>
	);
}
