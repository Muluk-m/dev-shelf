import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	Download,
	ExternalLink,
	Flame,
	FolderOpen,
	Layers,
	Plus,
	Search,
	TrendingUp,
	Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CategoryForm } from "~/components/admin/category-form";
import { CategoryList } from "~/components/admin/category-list";
import { ToolForm } from "~/components/admin/tool-form";
import { ToolList } from "~/components/admin/tool-list";
import { AdminLayout } from "~/components/layout/admin-layout";
import { ProtectedRoute } from "~/components/protected-route";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	createCategory,
	createTool,
	deleteCategory,
	deleteTool,
	getExportUrl,
	getToolCategories,
	getTools,
	getToolUsageStats,
	type ToolUsageStat,
	updateCategory,
	updateTool,
} from "~/lib/api";
import { cn } from "~/lib/utils";
import type { Tool, ToolCategory } from "~/types/tool";
import type { Route } from "./+types/admin";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "工具管理 | 研发平台工具站" },
		{ name: "description", content: "管理和配置平台工具，支持添加自定义工具" },
	];
}

// 统计卡片组件
interface StatCardProps {
	title: string;
	value: number;
	icon: React.ReactNode;
	trend?: number;
	color: "blue" | "purple" | "emerald" | "amber";
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
	const colorStyles = {
		blue: {
			bg: "bg-blue-50 dark:bg-blue-950/30",
			border: "border-blue-100 dark:border-blue-900/50",
			iconBg: "bg-blue-500",
			text: "text-blue-600 dark:text-blue-400",
		},
		purple: {
			bg: "bg-purple-50 dark:bg-purple-950/30",
			border: "border-purple-100 dark:border-purple-900/50",
			iconBg: "bg-purple-500",
			text: "text-purple-600 dark:text-purple-400",
		},
		emerald: {
			bg: "bg-emerald-50 dark:bg-emerald-950/30",
			border: "border-emerald-100 dark:border-emerald-900/50",
			iconBg: "bg-emerald-500",
			text: "text-emerald-600 dark:text-emerald-400",
		},
		amber: {
			bg: "bg-amber-50 dark:bg-amber-950/30",
			border: "border-amber-100 dark:border-amber-900/50",
			iconBg: "bg-amber-500",
			text: "text-amber-600 dark:text-amber-400",
		},
	};

	const styles = colorStyles[color];

	return (
		<Card
			className={cn(
				"relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
				styles.bg,
				styles.border,
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardDescription className="text-slate-600 dark:text-slate-400 font-medium">
							{title}
						</CardDescription>
						<CardTitle className="text-3xl font-bold tabular-nums">
							{value.toLocaleString()}
						</CardTitle>
					</div>
					<div
						className={cn(
							"flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg",
							styles.iconBg,
						)}
					>
						{icon}
					</div>
				</div>
				{trend !== undefined && (
					<div className="flex items-center gap-1 pt-2">
						{trend >= 0 ? (
							<ArrowUpRight className="h-4 w-4 text-emerald-500" />
						) : (
							<ArrowDownRight className="h-4 w-4 text-rose-500" />
						)}
						<span
							className={cn(
								"text-sm font-medium",
								trend >= 0 ? "text-emerald-600" : "text-rose-600",
							)}
						>
							{Math.abs(trend)}%
						</span>
						<span className="text-sm text-slate-500">较上周</span>
					</div>
				)}
			</CardHeader>
			{/* 装饰背景 */}
			<div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
		</Card>
	);
}

export default function AdminPage() {
	const [tools, setTools] = useState<Tool[]>([]);
	const [categories, setCategories] = useState<ToolCategory[]>([]);
	const [usageStats, setUsageStats] = useState<ToolUsageStat[]>([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTool, setEditingTool] = useState<Tool | null>(null);
	const [loading, setLoading] = useState(true);
	const [formLoading, setFormLoading] = useState(false);
	const [deletingToolId, setDeletingToolId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | Tool["status"]>(
		"all",
	);
	const [toolView, setToolView] = useState<"all" | "internal" | "external">(
		"all",
	);

	// 分类管理状态
	const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(
		null,
	);
	const [categoryFormLoading, setCategoryFormLoading] = useState(false);
	const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
		null,
	);

	// 加载工具数据
	useEffect(() => {
		const loadData = async () => {
			try {
				const [allTools, toolCategories, usageSummary] = await Promise.all([
					getTools(),
					getToolCategories(),
					getToolUsageStats(16),
				]);
				setCategories(toolCategories);
				setTools(allTools);
				setUsageStats(usageSummary);
			} catch (error) {
				console.error("Failed to load data:", error);
				setTools([]);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	const handleAddTool = async (toolData: Omit<Tool, "id">) => {
		setFormLoading(true);
		try {
			await createTool(toolData);
			const [updatedTools, toolCategories, usageSummary] = await Promise.all([
				getTools(),
				getToolCategories(),
				getToolUsageStats(16),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);
			setUsageStats(usageSummary);
			setIsFormOpen(false);
		} catch (error) {
			console.error("Failed to create tool:", error);
			alert(`Failed to create tool: ${(error as Error).message}`);
		} finally {
			setFormLoading(false);
		}
	};

	const handleEditTool = (tool: Tool) => {
		setEditingTool(tool);
		setIsFormOpen(true);
	};

	const handleUpdateTool = async (toolData: Omit<Tool, "id">) => {
		if (!editingTool) return;

		setFormLoading(true);
		try {
			await updateTool(editingTool.id, toolData);
			const [updatedTools, toolCategories, usageSummary] = await Promise.all([
				getTools(),
				getToolCategories(),
				getToolUsageStats(16),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);
			setUsageStats(usageSummary);

			setEditingTool(null);
			setIsFormOpen(false);
		} catch (error) {
			console.error("Failed to update tool:", error);
			alert(`Failed to update tool: ${(error as Error).message}`);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteTool = async (toolId: string) => {
		setDeletingToolId(toolId);
		try {
			await deleteTool(toolId);
			const [updatedTools, toolCategories, usageSummary] = await Promise.all([
				getTools(),
				getToolCategories(),
				getToolUsageStats(16),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);
			setUsageStats(usageSummary);
		} catch (error) {
			console.error("Failed to delete tool:", error);
			alert(`Failed to delete tool: ${(error as Error).message}`);
		} finally {
			setDeletingToolId(null);
		}
	};

	const handleFormClose = () => {
		setIsFormOpen(false);
		setEditingTool(null);
	};

	// 分类管理处理函数
	const handleAddCategory = async (categoryData: Omit<ToolCategory, "id">) => {
		setCategoryFormLoading(true);
		try {
			await createCategory(categoryData);
			const [updatedTools, updatedCategories, usageSummary] = await Promise.all(
				[getTools(), getToolCategories(), getToolUsageStats(16)],
			);
			setTools(updatedTools);
			setCategories(updatedCategories);
			setUsageStats(usageSummary);
			setIsCategoryFormOpen(false);
		} catch (error) {
			console.error("Failed to create category:", error);
			alert(`Failed to create category: ${(error as Error).message}`);
		} finally {
			setCategoryFormLoading(false);
		}
	};

	const handleEditCategory = (category: ToolCategory) => {
		setEditingCategory(category);
		setIsCategoryFormOpen(true);
	};

	const handleUpdateCategory = async (
		categoryData: Omit<ToolCategory, "id">,
	) => {
		if (!editingCategory) return;

		setCategoryFormLoading(true);
		try {
			await updateCategory(editingCategory.id, categoryData);
			const [updatedTools, updatedCategories, usageSummary] = await Promise.all(
				[getTools(), getToolCategories(), getToolUsageStats(16)],
			);
			setTools(updatedTools);
			setCategories(updatedCategories);
			setUsageStats(usageSummary);
			setEditingCategory(null);
			setIsCategoryFormOpen(false);
		} catch (error) {
			console.error("Failed to update category:", error);
			alert(`Failed to update category: ${(error as Error).message}`);
		} finally {
			setCategoryFormLoading(false);
		}
	};

	const handleDeleteCategory = async (categoryId: string) => {
		setDeletingCategoryId(categoryId);
		try {
			await deleteCategory(categoryId);
			const [updatedTools, updatedCategories, usageSummary] = await Promise.all(
				[getTools(), getToolCategories(), getToolUsageStats(16)],
			);
			setTools(updatedTools);
			setCategories(updatedCategories);
			setUsageStats(usageSummary);
		} catch (error) {
			console.error("Failed to delete category:", error);
			alert(`Failed to delete category: ${(error as Error).message}`);
		} finally {
			setDeletingCategoryId(null);
		}
	};

	const handleCategoryFormClose = () => {
		setIsCategoryFormOpen(false);
		setEditingCategory(null);
	};

	const statusOptions: Array<{ value: "all" | Tool["status"]; label: string }> =
		[
			{ value: "all", label: "全部" },
			{ value: "active", label: "正常" },
			{ value: "maintenance", label: "维护中" },
			{ value: "deprecated", label: "已废弃" },
		];

	const handleStatusToggle = (value: "all" | Tool["status"]) => {
		setStatusFilter((prev) => (prev === value ? "all" : value));
	};

	const handleToolViewChange = (value: "all" | "internal" | "external") => {
		setToolView(value);
	};

	// 根据 isInternal 分类工具
	const internalTools = tools.filter((tool) => tool.isInternal);
	const externalTools = tools.filter((tool) => !tool.isInternal);

	// 计算每个分类的工具数量
	const toolCountsByCategory = tools.reduce(
		(acc, tool) => {
			acc[tool.category] = (acc[tool.category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const viewFilteredTools = useMemo(() => {
		if (toolView === "internal") return internalTools;
		if (toolView === "external") return externalTools;
		return tools;
	}, [toolView, tools, internalTools, externalTools]);

	const viewOptions = useMemo(
		() => [
			{ value: "all" as const, label: "全部工具", count: tools.length },
			{
				value: "internal" as const,
				label: "内部工具",
				count: internalTools.length,
			},
			{
				value: "external" as const,
				label: "外部工具",
				count: externalTools.length,
			},
		],
		[tools.length, internalTools.length, externalTools.length],
	);

	return (
		<ProtectedRoute requiredRoles="developer">
			<AdminLayout
				title="工具管理"
				description="管理和配置平台工具，支持添加自定义工具"
				actions={
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => {
								window.location.href = getExportUrl();
							}}
							className="gap-2"
						>
							<Download className="h-4 w-4" />
							导出数据
						</Button>
						<Button
							onClick={() => setIsFormOpen(true)}
							className="gap-2 shadow-lg shadow-primary/25"
						>
							<Plus className="h-4 w-4" />
							添加工具
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* 统计卡片 */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<StatCard
							title="总工具数"
							value={tools.length}
							icon={<Layers className="h-6 w-6" />}
							color="blue"
						/>
						<StatCard
							title="分类数"
							value={categories.length}
							icon={<FolderOpen className="h-6 w-6" />}
							color="purple"
						/>
						<StatCard
							title="内部工具"
							value={internalTools.length}
							icon={<Wrench className="h-6 w-6" />}
							color="emerald"
						/>
						<StatCard
							title="外部工具"
							value={externalTools.length}
							icon={<ExternalLink className="h-6 w-6" />}
							color="amber"
						/>
					</div>

					{/* 标签页内容 */}
					<Tabs defaultValue="tools" className="space-y-6">
						<TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 h-auto">
							<TabsTrigger
								value="tools"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<Wrench className="h-4 w-4 mr-2" />
								工具管理
							</TabsTrigger>
							<TabsTrigger
								value="usage"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<TrendingUp className="h-4 w-4 mr-2" />
								使用看板
							</TabsTrigger>
							<TabsTrigger
								value="categories"
								className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2"
							>
								<FolderOpen className="h-4 w-4 mr-2" />
								分类管理
							</TabsTrigger>
						</TabsList>

						<TabsContent value="tools" className="space-y-4 mt-6">
							{/* 搜索和筛选区域 */}
							<Card className="border-slate-200 dark:border-slate-800">
								<CardContent className="p-4 space-y-4">
									<div className="relative w-full md:max-w-lg">
										<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
										<Input
											value={searchTerm}
											onChange={(event) => setSearchTerm(event.target.value)}
											placeholder="搜索工具名称、标签或描述..."
											className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
										/>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-xs uppercase tracking-wide text-slate-500 font-medium">
											状态筛选
										</span>
										{statusOptions.map((option) => (
											<Button
												key={option.value}
												variant={
													statusFilter === option.value ? "default" : "outline"
												}
												size="sm"
												onClick={() => handleStatusToggle(option.value)}
												className={cn(
													"transition-all duration-200",
													statusFilter === option.value
														? "shadow-sm"
														: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800",
												)}
											>
												{option.label}
											</Button>
										))}
									</div>
								</CardContent>
							</Card>

							{/* 视图切换 */}
							<div className="flex flex-wrap items-center gap-2">
								{viewOptions.map((option) => (
									<Button
										key={option.value}
										variant={toolView === option.value ? "default" : "outline"}
										size="sm"
										onClick={() => handleToolViewChange(option.value)}
										className={cn(
											"gap-2 transition-all duration-200",
											toolView === option.value &&
												"shadow-lg shadow-primary/25",
										)}
									>
										{option.label}
										<Badge
											variant={
												toolView === option.value ? "secondary" : "outline"
											}
											className={cn(
												"ml-1 font-mono",
												toolView === option.value
													? "bg-white/20 text-white"
													: "",
											)}
										>
											{option.count}
										</Badge>
									</Button>
								))}
							</div>

							<ToolList
								tools={viewFilteredTools}
								categories={categories}
								onEdit={handleEditTool}
								onDelete={handleDeleteTool}
								showActions={true}
								loading={loading}
								deleting={deletingToolId}
								searchTerm={searchTerm}
								statusFilter={statusFilter}
							/>
						</TabsContent>

						<TabsContent value="usage" className="space-y-4 mt-6">
							{usageStats.length === 0 ? (
								<Card className="border-dashed border-slate-300 dark:border-slate-700">
									<CardContent className="py-16 text-center">
										<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
											<Activity className="h-6 w-6 text-slate-400" />
										</div>
										<p className="text-slate-500">暂无使用记录</p>
									</CardContent>
								</Card>
							) : (
								<Card className="border-slate-200 dark:border-slate-800">
									<CardHeader className="pb-4">
										<div className="flex items-center gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25">
												<Flame className="h-5 w-5" />
											</div>
											<div>
												<CardTitle className="text-lg">最近使用热点</CardTitle>
												<CardDescription>
													关注调用次数较多的工具，及时评估容量与支持
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="space-y-2">
										{usageStats.map((stat, index) => (
											<div
												key={stat.toolId}
												className={cn(
													"flex flex-col gap-2 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between",
													"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
													"transition-all duration-200 hover:shadow-md hover:border-primary/30",
												)}
											>
												<div className="flex items-center gap-3">
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white",
															index === 0
																? "bg-gradient-to-br from-orange-500 to-rose-500"
																: index === 1
																	? "bg-gradient-to-br from-slate-400 to-slate-500"
																	: index === 2
																		? "bg-gradient-to-br from-amber-500 to-orange-500"
																		: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
														)}
													>
														{index + 1}
													</div>
													<div>
														<p className="text-sm font-medium">{stat.name}</p>
														<p className="text-xs text-slate-500">
															{stat.usageCount} 次使用 ·{" "}
															{stat.isInternal ? "内部" : "外部"}
														</p>
													</div>
												</div>
												<div className="text-xs text-slate-500">
													最后使用：
													{stat.lastUsed
														? stat.lastUsed.replace("T", " ")
														: "--"}
												</div>
											</div>
										))}
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="categories" className="space-y-4 mt-6">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-lg font-semibold">分类管理</h3>
									<p className="text-sm text-slate-500">
										管理工具分类，用于组织和筛选工具
									</p>
								</div>
								<Button
									onClick={() => setIsCategoryFormOpen(true)}
									className="gap-2 shadow-lg shadow-primary/25"
								>
									<Plus className="h-4 w-4" />
									添加分类
								</Button>
							</div>
							<CategoryList
								categories={categories}
								onEdit={handleEditCategory}
								onDelete={handleDeleteCategory}
								loading={loading}
								deleting={deletingCategoryId}
								toolCounts={toolCountsByCategory}
							/>
						</TabsContent>
					</Tabs>
				</div>

				<ToolForm
					isOpen={isFormOpen}
					onClose={handleFormClose}
					onSubmit={editingTool ? handleUpdateTool : handleAddTool}
					initialData={editingTool}
					title={editingTool ? "编辑工具" : "添加工具"}
					loading={formLoading}
				/>

				<CategoryForm
					isOpen={isCategoryFormOpen}
					onClose={handleCategoryFormClose}
					onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
					initialData={editingCategory}
					title={editingCategory ? "编辑分类" : "添加分类"}
					loading={categoryFormLoading}
				/>
			</AdminLayout>
		</ProtectedRoute>
	);
}
