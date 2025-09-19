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
				const [systemTools, toolCategories] = await Promise.all([
					getTools(),
					getToolCategories(),
				]);
				setCategories(toolCategories);

				const savedTools = localStorage.getItem("custom-tools");
				if (savedTools) {
					try {
						const customTools = JSON.parse(savedTools);
						setTools([...systemTools, ...customTools]);
					} catch {
						setTools(systemTools);
					}
				} else {
					setTools(systemTools);
				}
			} catch (error) {
				console.error("Failed to load data:", error);
				setTools([]);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, []);

	// 保存自定义工具到本地存储
	const saveCustomTools = async (allTools: Tool[]) => {
		try {
			const systemTools = await getTools();
			const customTools = allTools.filter(
				(tool) => !systemTools.find((systemTool) => systemTool.id === tool.id),
			);
			localStorage.setItem("custom-tools", JSON.stringify(customTools));
		} catch (error) {
			console.error("Failed to save custom tools:", error);
		}
	};

	const handleAddTool = async (toolData: Omit<Tool, "id">) => {
		setFormLoading(true);
		try {
			await createTool(toolData);
			// Reload tools after successful creation
			const updatedTools = await getTools();
			const savedTools = localStorage.getItem("custom-tools");
			let customTools = [];
			if (savedTools) {
				try {
					customTools = JSON.parse(savedTools);
				} catch {
					customTools = [];
				}
			}
			setTools([...updatedTools, ...customTools]);
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
			// Check if it's a system tool or custom tool
			const isCustomTool = editingTool.id.startsWith("custom-");

			if (isCustomTool) {
				// Handle custom tool update with localStorage
				const updatedTools = tools.map((tool) =>
					tool.id === editingTool.id
						? { ...toolData, id: editingTool.id }
						: tool,
				);
				setTools(updatedTools);
				saveCustomTools(updatedTools);
			} else {
				// Handle system tool update with API
				await updateTool(editingTool.id, toolData);
				// Reload tools after successful update
				const updatedSystemTools = await getTools();
				const savedTools = localStorage.getItem("custom-tools");
				let customTools = [];
				if (savedTools) {
					try {
						customTools = JSON.parse(savedTools);
					} catch {
						customTools = [];
					}
				}
				setTools([...updatedSystemTools, ...customTools]);
			}

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
			const isCustomTool = toolId.startsWith("custom-");

			if (isCustomTool) {
				// Handle custom tool deletion with localStorage
				const updatedTools = tools.filter((tool) => tool.id !== toolId);
				setTools(updatedTools);
				saveCustomTools(updatedTools);
			} else {
				// Handle system tool deletion with API
				await deleteTool(toolId);
				// Reload tools after successful deletion
				const updatedSystemTools = await getTools();
				const savedTools = localStorage.getItem("custom-tools");
				let customTools = [];
				if (savedTools) {
					try {
						customTools = JSON.parse(savedTools);
					} catch {
						customTools = [];
					}
				}
				setTools([...updatedSystemTools, ...customTools]);
			}
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

	const [systemTools, setSystemTools] = useState<Tool[]>([]);

	// 加载系统工具用于区分
	useEffect(() => {
		const loadSystemTools = async () => {
			try {
				const tools = await getTools();
				setSystemTools(tools);
			} catch (error) {
				console.error("Failed to load system tools:", error);
			}
		};
		loadSystemTools();
	}, []);

	const customTools = tools.filter(
		(tool) => !systemTools.find((systemTool) => systemTool.id === tool.id),
	);

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
								<CardTitle className="text-2xl">{customTools.length}</CardTitle>
								<CardDescription>自定义工具</CardDescription>
							</CardHeader>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-2xl">
									{tools.filter((t) => t.status === "active").length}
								</CardTitle>
								<CardDescription>可用工具</CardDescription>
							</CardHeader>
						</Card>
					</div>

					<Tabs defaultValue="all" className="space-y-6">
						<TabsList>
							<TabsTrigger value="all">所有工具</TabsTrigger>
							<TabsTrigger value="custom">自定义工具</TabsTrigger>
							<TabsTrigger value="system">系统工具</TabsTrigger>
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

						<TabsContent value="custom" className="space-y-4">
							<ToolList
								tools={customTools}
								categories={categories}
								onEdit={handleEditTool}
								onDelete={handleDeleteTool}
								showActions={true}
								loading={loading}
								deleting={deletingToolId}
							/>
							{customTools.length === 0 && (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-12">
										<p className="text-muted-foreground mb-4">
											还没有自定义工具
										</p>
										<Button
											onClick={() => setIsFormOpen(true)}
											className="gap-2"
										>
											<Plus className="h-4 w-4" />
											添加第一个工具
										</Button>
									</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="system" className="space-y-4">
							<ToolList
								tools={systemTools}
								categories={categories}
								onEdit={handleEditTool}
								onDelete={handleDeleteTool}
								showActions={false}
								loading={loading}
								deleting={deletingToolId}
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
		</div>
	);
}
