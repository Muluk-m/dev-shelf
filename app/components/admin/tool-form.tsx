"use client";

import { Plus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { getToolCategories } from "~/lib/api";
import type { Tool, ToolCategory, ToolEnvironment } from "~/types/tool";

interface ToolFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (tool: Omit<Tool, "id">) => void;
	initialData?: Tool | null;
	title: string;
	loading?: boolean;
}

export function ToolForm({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	title,
	loading = false,
}: ToolFormProps) {
	// Initialize form data based on Tool interface
	const initializeFormData = (): Omit<Tool, "id"> => ({
		name: "",
		description: "",
		category: "",
		status: "active",
		tags: [],
		environments: [],
		icon: "",
		isInternal: false,
		lastUpdated: new Date().toISOString().split("T")[0],
	});

	const [toolCategories, setToolCategories] = useState<ToolCategory[]>([]);
	const [formData, setFormData] = useState<Omit<Tool, "id">>(() =>
		initializeFormData(),
	);

	const [newTag, setNewTag] = useState("");
	const [testEnvironments, setTestEnvironments] = useState<ToolEnvironment[]>(
		[],
	);
	const isInternalTool = formData.isInternal;

	// Load tool categories
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const categories = await getToolCategories();
				setToolCategories(categories);
			} catch (error) {
				console.error("Failed to load categories:", error);
			}
		};
		loadCategories();
	}, []);

	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
			const testEnvs = initialData.environments.filter(
				(env) => env.name !== "production",
			);
			setTestEnvironments(initialData.isInternal ? [] : testEnvs);
		} else {
			setFormData(initializeFormData());
			setTestEnvironments([]);
		}
	}, [initialData, isOpen]);

	useEffect(() => {
		if (isInternalTool && testEnvironments.length > 0) {
			setTestEnvironments([]);
		}
	}, [isInternalTool, testEnvironments.length]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// 确保至少有生产环境
		const productionEnv = getProductionEnv();
		const allEnvironments = isInternalTool
			? [productionEnv]
			: [productionEnv, ...testEnvironments];

		// Update lastUpdated timestamp
		const submitData = {
			...formData,
			environments: allEnvironments,
			lastUpdated: new Date().toISOString().split("T")[0],
		};

		onSubmit(submitData);
	};

	const handleAddTag = () => {
		if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, newTag.trim()],
			}));
			setNewTag("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	// 生产环境管理
	const updateProductionEnvironment = (
		field: keyof ToolEnvironment,
		value: string | boolean,
	) => {
		setFormData((prev) => {
			const environments = [...prev.environments];
			const prodIndex = environments.findIndex(
				(env) => env.name === "production",
			);

			if (prodIndex >= 0) {
				environments[prodIndex] = {
					...environments[prodIndex],
					[field]: value,
				};
			} else {
				// 创建生产环境
				environments.push({
					name: "production",
					label: "生产环境",
					url: field === "url" ? (value as string) : "",
					isExternal: field === "isExternal" ? (value as boolean) : true,
				});
			}

			return {
				...prev,
				environments,
				...(field === "isExternal" ? { isInternal: !(value as boolean) } : {}),
			};
		});
	};

	const getProductionEnv = () => {
		return (
			formData.environments.find((env) => env.name === "production") || {
				name: "production",
				label: "生产环境",
				url: "",
				isExternal: true,
			}
		);
	};

	const getProductionEnvSlug = () => {
		const productionEnv = getProductionEnv();
		if (productionEnv.isExternal) {
			return productionEnv.url;
		}
		return productionEnv.url.startsWith("/tools/")
			? productionEnv.url.slice("/tools/".length)
			: productionEnv.url.replace(/^\/+/, "");
	};

	// 测试环境管理
	const addTestEnvironment = () => {
		const newEnv: ToolEnvironment = {
			name: `test${testEnvironments.length + 1}`,
			label: `测试环境${testEnvironments.length + 1}`,
			url: "",
			isExternal: true,
		};
		setTestEnvironments([...testEnvironments, newEnv]);
	};

	const updateTestEnvironment = (
		index: number,
		field: keyof ToolEnvironment,
		value: string | boolean,
	) => {
		setTestEnvironments((prev) =>
			prev.map((env, i) => (i === index ? { ...env, [field]: value } : env)),
		);
	};

	const removeTestEnvironment = (index: number) => {
		setTestEnvironments((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<Tabs defaultValue="basic" className="w-full">
						<TabsList className="grid w-full grid-cols-3 mb-4">
							<TabsTrigger value="basic">基本信息</TabsTrigger>
							<TabsTrigger value="environments">环境配置</TabsTrigger>
							<TabsTrigger value="advanced">高级设置</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">工具名称 *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder="输入工具名称"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="category">分类 *</Label>
									<Select
										value={formData.category}
										onValueChange={(value) =>
											setFormData((prev) => ({ ...prev, category: value }))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="选择分类" />
										</SelectTrigger>
										<SelectContent>
											{toolCategories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">描述 *</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="描述工具的功能和用途"
									rows={3}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="icon">图标 URL</Label>
								<Input
									id="icon"
									value={formData.icon}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, icon: e.target.value }))
									}
									placeholder="https://example.com/icon.png"
								/>
							</div>

							<div className="space-y-2">
								<Label>状态</Label>
								<Select
									value={formData.status}
									onValueChange={(
										value: "active" | "maintenance" | "deprecated",
									) => setFormData((prev) => ({ ...prev, status: value }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">正常</SelectItem>
										<SelectItem value="maintenance">维护中</SelectItem>
										<SelectItem value="deprecated">已废弃</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</TabsContent>

						<TabsContent value="environments" className="space-y-4">
							{/* 生产环境 - 固定必须 */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">生产环境 *</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label>访问类型</Label>
										<Select
											value={
												getProductionEnv().isExternal ? "external" : "internal"
											}
											onValueChange={(value: "internal" | "external") => {
												updateProductionEnvironment(
													"isExternal",
													value === "external",
												);
												if (value === "internal") {
													setTestEnvironments([]);
													updateProductionEnvironment("url", "/tools/");
												}
											}}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="internal">内部路由</SelectItem>
												<SelectItem value="external">外部链接</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>
											{getProductionEnv().isExternal ? "访问链接" : "路由路径"}{" "}
											*
										</Label>
										{getProductionEnv().isExternal ? (
											<Input
												value={getProductionEnv().url}
												onChange={(e) =>
													updateProductionEnvironment("url", e.target.value)
												}
												placeholder="https://example.com"
												required
											/>
										) : (
											<div className="flex items-center gap-2">
												<span className="text-sm text-muted-foreground">
													/tools/
												</span>
												<Input
													value={getProductionEnvSlug()}
													onChange={(e) => {
														const slug = e.target.value
															.trim()
															.replace(/^\/+/, "");
														updateProductionEnvironment(
															"url",
															`/tools/${slug}`,
														);
													}}
													placeholder="example"
													required
												/>
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* 测试环境 - 内部工具限制 */}
							{isInternalTool ? (
								<Card>
									<CardContent className="py-6 text-center text-muted-foreground">
										内部工具仅支持生产环境，无需配置测试环境。
									</CardContent>
								</Card>
							) : (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-medium">测试环境</h3>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addTestEnvironment}
											className="gap-2"
										>
											<Plus className="h-4 w-4" />
											添加测试环境
										</Button>
									</div>

									{testEnvironments.map((env, index) => (
										<Card key={index}>
											<CardHeader className="pb-3">
												<CardTitle className="flex items-center justify-between text-base">
													<span>测试环境 {index + 1}</span>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeTestEnvironment(index)}
														className="text-destructive hover:text-destructive"
													>
														<X className="h-4 w-4" />
													</Button>
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-2">
														<Label>环境名称</Label>
														<Input
															value={env.name}
															onChange={(e) =>
																updateTestEnvironment(
																	index,
																	"name",
																	e.target.value,
																)
															}
															placeholder="例如: test, uat, staging"
														/>
													</div>
													<div className="space-y-2">
														<Label>显示名称</Label>
														<Input
															value={env.label}
															onChange={(e) =>
																updateTestEnvironment(
																	index,
																	"label",
																	e.target.value,
																)
															}
															placeholder="例如: 测试环境, UAT环境"
														/>
													</div>
												</div>

												<div className="space-y-2">
													<Label>访问类型</Label>
													<Select
														value={env.isExternal ? "external" : "internal"}
														onValueChange={(value: "internal" | "external") =>
															updateTestEnvironment(
																index,
																"isExternal",
																value === "external",
															)
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="internal">内部路由</SelectItem>
															<SelectItem value="external">外部链接</SelectItem>
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-2">
													<Label>
														{env.isExternal ? "访问链接" : "路由路径"}
													</Label>
													<Input
														value={env.url}
														onChange={(e) =>
															updateTestEnvironment(
																index,
																"url",
																e.target.value,
															)
														}
														placeholder={
															env.isExternal
																? "https://test.example.com"
																: "/tools/example-test"
														}
													/>
												</div>
											</CardContent>
										</Card>
									))}

									{testEnvironments.length === 0 && (
										<div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
											<p>暂无测试环境</p>
											<p className="text-sm mt-1">点击上方按钮添加测试环境</p>
										</div>
									)}
								</div>
							)}
						</TabsContent>

						<TabsContent value="advanced" className="space-y-4">
							<div className="space-y-2">
								<Label>标签</Label>
								<div className="flex gap-2 mb-2">
									<Input
										value={newTag}
										onChange={(e) => setNewTag(e.target.value)}
										placeholder="添加标签"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTag();
											}
										}}
									/>
									<Button type="button" onClick={handleAddTag} size="sm">
										<Plus className="h-4 w-4" />
									</Button>
								</div>
								<div className="flex flex-wrap gap-2">
									{formData.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="gap-1">
											{tag}
											<button
												type="button"
												onClick={() => {
													handleRemoveTag(tag);
												}}
												className="rounded-full p-0.5 hover:bg-muted transition-colors"
											>
												<X className="h-3 w-3 cursor-pointer" />
											</button>
										</Badge>
									))}
								</div>
							</div>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						>
							取消
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									{initialData ? "更新中..." : "添加中..."}
								</>
							) : initialData ? (
								"更新工具"
							) : (
								"添加工具"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
