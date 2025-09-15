import { useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { CategoryFilter } from "~/components/category-filter";
import { CommandPanel } from "~/components/command-panel/command-panel";
import { Header } from "~/components/layout/header";
import { SearchFiltersComponent } from "~/components/search/search-filters";
import { SearchResults } from "~/components/search/search-results";
import { ToolCard } from "~/components/tool-card";
import { useCommandPanel } from "~/hooks/use-command-panel";
import { useSearch } from "~/hooks/use-search";
import { getToolCategories, getTools } from "~/lib/api";
import type { Tool, ToolCategory } from "~/types/tool";
import type { Route } from "./+types/home";

export async function loader() {
	try {
		const [tools, toolCategories] = await Promise.all([
			getTools(),
			getToolCategories(),
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
		clearFilters,
		searchResults,
		suggestions,
		searchHistory,
		performSearch,
	} = useSearch(tools);

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

	// 根据选中的分类过滤工具
	const filteredTools = useMemo(() => {
		let tools = searchResults.tools;
		if (selectedCategory) {
			tools = tools.filter((tool) => tool.category === selectedCategory);
		}
		return tools;
	}, [searchResults.tools, selectedCategory]);

	const handleViewDetails = (tool: Tool) => {
		navigate(`/tools/${tool.id}`);
	};

	const handleCategoryChange = (categoryId: string | null) => {
		setSelectedCategory(categoryId);
		updateFilters({ category: categoryId || undefined });
	};

	const isSearching =
		query.trim().length > 0 || Object.keys(filters).length > 0;

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
				{!isSearching ? (
					<>
						<div className="text-center space-y-4 mb-12">
							<h1 className="text-4xl font-bold tracking-tight">
								研发平台工具站
							</h1>
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
							{filteredTools.map((tool) => (
								<ToolCard
									key={tool.id}
									tool={tool}
									onViewDetails={handleViewDetails}
								/>
							))}
						</div>

						{filteredTools.length === 0 && (
							<div className="text-center py-12">
								<p className="text-muted-foreground">该分类下暂无工具</p>
							</div>
						)}
					</>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
						<div className="lg:col-span-1">
							<SearchFiltersComponent
								filters={filters}
								onFiltersChange={updateFilters}
								onClearFilters={clearFilters}
								resultCount={searchResults.totalCount}
							/>
						</div>
						<div className="lg:col-span-3">
							<SearchResults
								tools={filteredTools}
								query={query}
								totalCount={searchResults.totalCount}
								onViewDetails={handleViewDetails}
							/>
						</div>
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
