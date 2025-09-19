import { Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createTool, deleteTool, getTools, getToolCategories, updateTool } from "~/lib/api";
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

	// 根据 isInternal 分类工具
	const internalTools = tools.filter((tool) => tool.isInternal);
	const externalTools = tools.filter((tool) => !tool.isInternal);

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

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">{tools.length}</CardTitle>
								<CardDescription>总工具数</CardDescription>
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
						<TabsList>
							<TabsTrigger value="all">所有工具</TabsTrigger>
							<TabsTrigger value="internal">内部工具</TabsTrigger>
							<TabsTrigger value="external">外部工具</TabsTrigger>
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
		</div>
	);
}
