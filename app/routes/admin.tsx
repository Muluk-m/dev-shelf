import { Plus, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { CategoryForm } from "~/components/admin/category-form";
import { CategoryList } from "~/components/admin/category-list";
import { ToolForm } from "~/components/admin/tool-form";
import { ToolList } from "~/components/admin/tool-list";
import { Header } from "~/components/layout/header";
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
import { createTool, deleteTool, getTools, getToolCategories, updateTool, createCategory, updateCategory, deleteCategory } from "~/lib/api";
import type { Tool, ToolCategory } from "~/types/tool";
import type { Route } from "./+types/admin";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "工具管理 | 研发平台工具站" },
		{ name: "description", content: "管理和配置平台工具，支持添加自定义工具" },
	];
}

export default function AdminPage() {
	const [tools, setTools] = useState<Tool[]>([]);
	const [categories, setCategories] = useState<ToolCategory[]>([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingTool, setEditingTool] = useState<Tool | null>(null);
	const [loading, setLoading] = useState(true);
	const [formLoading, setFormLoading] = useState(false);
	const [deletingToolId, setDeletingToolId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | Tool["status"]>("all");

	// 分类管理状态
	const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<ToolCategory | null>(null);
	const [categoryFormLoading, setCategoryFormLoading] = useState(false);
	const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

	// 加载工具数据
	useEffect(() => {
		const loadData = async () => {
			try {
				const [allTools, toolCategories] = await Promise.all([
					getTools(),
					getToolCategories(),
				]);
				setCategories(toolCategories);
				setTools(allTools);
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
			// Reload tools after successful creation
			const [updatedTools, toolCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);
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
			// 所有工具都通过 API 更新
			await updateTool(editingTool.id, toolData);
			// Reload tools after successful update
			const [updatedTools, toolCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);

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
			// 所有工具都通过 API 删除
			await deleteTool(toolId);
			// Reload tools after successful deletion
			const [updatedTools, toolCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setCategories(toolCategories);
			setTools(updatedTools);
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
			// Reload data after successful creation
			const [updatedTools, updatedCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setTools(updatedTools);
			setCategories(updatedCategories);
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

	const handleUpdateCategory = async (categoryData: Omit<ToolCategory, "id">) => {
		if (!editingCategory) return;

		setCategoryFormLoading(true);
		try {
			await updateCategory(editingCategory.id, categoryData);
			// Reload data after successful update
			const [updatedTools, updatedCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setTools(updatedTools);
			setCategories(updatedCategories);
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
			// Reload data after successful deletion
			const [updatedTools, updatedCategories] = await Promise.all([
				getTools(),
				getToolCategories(),
			]);
			setTools(updatedTools);
			setCategories(updatedCategories);
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

	const statusOptions: Array<{ value: "all" | Tool["status"]; label: string }> = [
		{ value: "all", label: "全部" },
		{ value: "active", label: "正常" },
		{ value: "maintenance", label: "维护中" },
		{ value: "deprecated", label: "已废弃" },
	];

	const handleStatusToggle = (value: "all" | Tool["status"]) => {
		setStatusFilter((prev) => (prev === value ? "all" : value));
	};

	// 根据 isInternal 分类工具
	const internalTools = tools.filter((tool) => tool.isInternal);
	const externalTools = tools.filter((tool) => !tool.isInternal);

	// 计算每个分类的工具数量
	const toolCountsByCategory = tools.reduce((acc, tool) => {
		acc[tool.category] = (acc[tool.category] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="space-y-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
								<Settings className="h-8 w-8" />
								工具管理
							</h1>
							<p className="text-muted-foreground mt-2">
								管理和配置平台工具，支持添加自定义工具
							</p>
						</div>
						<Button onClick={() => setIsFormOpen(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							添加工具
						</Button>
					</div>

					<div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
						<div className="relative w-full md:max-w-md">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder="搜索工具名称、标签或描述"
								className="pl-9"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-xs uppercase tracking-wide text-muted-foreground">状态筛选</span>
							{statusOptions.map((option) => (
								<Button
									key={option.value}
									variant={statusFilter === option.value ? "default" : "outline"}
									size="sm"
									onClick={() => handleStatusToggle(option.value)}
									className={
										statusFilter === option.value ? "shadow-sm" : "bg-transparent"
									}
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">{tools.length}</CardTitle>
								<CardDescription>总工具数</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">{categories.length}</CardTitle>
								<CardDescription>分类数</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">{internalTools.length}</CardTitle>
								<CardDescription>内部工具</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">{externalTools.length}</CardTitle>
								<CardDescription>外部工具</CardDescription>
							</CardHeader>
						</Card>
					</div>

					<Tabs defaultValue="all" className="space-y-6">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="all">所有工具</TabsTrigger>
							<TabsTrigger value="internal">内部工具</TabsTrigger>
							<TabsTrigger value="external">外部工具</TabsTrigger>
							<TabsTrigger value="categories">分类管理</TabsTrigger>
						</TabsList>

						<TabsContent value="all" className="space-y-4">
							<ToolList
								tools={tools}
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

						<TabsContent value="internal" className="space-y-4">
							<ToolList
								tools={internalTools}
								categories={categories}
								onEdit={handleEditTool}
								onDelete={handleDeleteTool}
								showActions={true}
								loading={loading}
								deleting={deletingToolId}
								searchTerm={searchTerm}
								statusFilter={statusFilter}
							/>
							{!loading && internalTools.length === 0 && (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-12">
										<p className="text-muted-foreground mb-4">
											还没有内部工具
										</p>
										<Button
											onClick={() => setIsFormOpen(true)}
											className="gap-2"
										>
											<Plus className="h-4 w-4" />
											添加第一个内部工具
										</Button>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="external" className="space-y-4">
							<ToolList
								tools={externalTools}
								categories={categories}
								onEdit={handleEditTool}
								onDelete={handleDeleteTool}
								showActions={true}
								loading={loading}
								deleting={deletingToolId}
								searchTerm={searchTerm}
								statusFilter={statusFilter}
							/>
							{!loading && externalTools.length === 0 && (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-12">
										<p className="text-muted-foreground mb-4">
											还没有外部工具
										</p>
										<Button
											onClick={() => setIsFormOpen(true)}
											className="gap-2"
										>
											<Plus className="h-4 w-4" />
											添加第一个外部工具
										</Button>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="categories" className="space-y-4">
							<div className="flex justify-between items-center">
								<div>
									<h3 className="text-lg font-medium">分类管理</h3>
									<p className="text-sm text-muted-foreground">
										管理工具分类，用于组织和筛选工具
									</p>
								</div>
								<Button onClick={() => setIsCategoryFormOpen(true)} className="gap-2">
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
			</main>

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
		</div>
	);
}
