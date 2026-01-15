import {
	AlertCircle,
	Check,
	ExternalLink,
	FileText,
	Globe,
	Image,
	Key,
	Layers,
	Link2,
	Plus,
	Server,
	Settings2,
	Sparkles,
	Tag,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { cn } from "~/lib/utils";
import type { Tool, ToolCategory, ToolEnvironment } from "~/types/tool";

interface Permission {
	id: string;
	resource: string;
	action: string;
	description?: string;
}

interface ToolFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (tool: Omit<Tool, "id">) => void;
	initialData?: Tool | null;
	title: string;
	loading?: boolean;
}

// 状态选项配置
const statusOptions = [
	{
		value: "active",
		label: "正常运行",
		color: "bg-emerald-500",
		bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
		textColor: "text-emerald-700 dark:text-emerald-300",
	},
	{
		value: "maintenance",
		label: "维护中",
		color: "bg-amber-500",
		bgColor: "bg-amber-50 dark:bg-amber-950/30",
		textColor: "text-amber-700 dark:text-amber-300",
	},
	{
		value: "deprecated",
		label: "已废弃",
		color: "bg-rose-500",
		bgColor: "bg-rose-50 dark:bg-rose-950/30",
		textColor: "text-rose-700 dark:text-rose-300",
	},
];

export function ToolForm({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	title,
	loading = false,
}: ToolFormProps) {
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
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [formData, setFormData] = useState<Omit<Tool, "id">>(() =>
		initializeFormData(),
	);

	const [newTag, setNewTag] = useState("");
	const [testEnvironments, setTestEnvironments] = useState<ToolEnvironment[]>(
		[],
	);
	const [activeTab, setActiveTab] = useState("basic");
	const isInternalTool = formData.isInternal;

	// Load tool categories and permissions
	useEffect(() => {
		const loadCategories = async () => {
			try {
				const categories = await getToolCategories();
				setToolCategories(categories);
			} catch (error) {
				console.error("Failed to load categories:", error);
			}
		};
		const loadPermissions = async () => {
			try {
				const response = await fetch("/api/permissions/permissions");
				const data: { code: number; data: Permission[] } =
					await response.json();
				if (data.code === 0) {
					setPermissions(data.data);
				}
			} catch (error) {
				console.error("Failed to load permissions:", error);
			}
		};
		loadCategories();
		loadPermissions();
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
		setActiveTab("basic");
	}, [initialData, isOpen]);

	useEffect(() => {
		if (isInternalTool && testEnvironments.length > 0) {
			setTestEnvironments([]);
		}
	}, [isInternalTool, testEnvironments.length]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const productionEnv = getProductionEnv();
		const allEnvironments = isInternalTool
			? [productionEnv]
			: [productionEnv, ...testEnvironments];

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

	// 检查表单是否完整
	const isBasicComplete =
		formData.name && formData.category && formData.description;
	const isEnvComplete = getProductionEnv().url;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
				{/* Header */}
				<DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
							{initialData ? (
								<Settings2 className="h-5 w-5" />
							) : (
								<Plus className="h-5 w-5" />
							)}
						</div>
						<div>
							<DialogTitle className="text-lg">{title}</DialogTitle>
							<DialogDescription className="text-sm">
								{initialData
									? "修改工具的基本信息和配置"
									: "创建新的工具，配置访问环境"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="flex flex-col flex-1 overflow-hidden"
				>
					{/* Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex flex-col flex-1 overflow-hidden"
					>
						<div className="px-6 pt-4 pb-0">
							<TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800/50 p-1 h-auto rounded-xl">
								<TabsTrigger
									value="basic"
									className={cn(
										"flex items-center gap-2 py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow-sm",
									)}
								>
									<FileText className="h-4 w-4" />
									<span>基本信息</span>
									{isBasicComplete && (
										<Check className="h-3.5 w-3.5 text-emerald-500" />
									)}
								</TabsTrigger>
								<TabsTrigger
									value="environments"
									className={cn(
										"flex items-center gap-2 py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow-sm",
									)}
								>
									<Globe className="h-4 w-4" />
									<span>环境配置</span>
									{isEnvComplete && (
										<Check className="h-3.5 w-3.5 text-emerald-500" />
									)}
								</TabsTrigger>
								<TabsTrigger
									value="advanced"
									className={cn(
										"flex items-center gap-2 py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:dark:bg-slate-900 data-[state=active]:shadow-sm",
									)}
								>
									<Settings2 className="h-4 w-4" />
									<span>高级设置</span>
								</TabsTrigger>
							</TabsList>
						</div>

						{/* Tab Contents - Scrollable */}
						<div className="flex-1 overflow-y-auto px-6 py-4">
							<TabsContent value="basic" className="mt-0 space-y-5">
								{/* 工具名称和分类 */}
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label
											htmlFor="name"
											className="flex items-center gap-2 text-sm font-medium"
										>
											<Sparkles className="h-4 w-4 text-primary" />
											工具名称 <span className="text-rose-500">*</span>
										</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
											placeholder="例如: JSON 格式化工具"
											className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label className="flex items-center gap-2 text-sm font-medium">
											<Layers className="h-4 w-4 text-primary" />
											分类 <span className="text-rose-500">*</span>
										</Label>
										<Select
											value={formData.category}
											onValueChange={(value) =>
												setFormData((prev) => ({ ...prev, category: value }))
											}
										>
											<SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
												<SelectValue placeholder="选择分类" />
											</SelectTrigger>
											<SelectContent>
												{toolCategories.map((category) => (
													<SelectItem key={category.id} value={category.id}>
														<div className="flex items-center gap-2">
															<div
																className="h-2 w-2 rounded-full"
																style={{ backgroundColor: category.color }}
															/>
															{category.name}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								{/* 描述 */}
								<div className="space-y-2">
									<Label
										htmlFor="description"
										className="flex items-center gap-2 text-sm font-medium"
									>
										<FileText className="h-4 w-4 text-primary" />
										工具描述 <span className="text-rose-500">*</span>
									</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										placeholder="简要描述工具的功能和用途..."
										rows={3}
										className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 resize-none"
										required
									/>
								</div>

								{/* 图标和状态 */}
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label
											htmlFor="icon"
											className="flex items-center gap-2 text-sm font-medium"
										>
											<Image className="h-4 w-4 text-primary" />
											图标 URL
										</Label>
										<div className="flex gap-2">
											<Input
												id="icon"
												value={formData.icon}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														icon: e.target.value,
													}))
												}
												placeholder="https://example.com/icon.png"
												className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
											/>
											{formData.icon && (
												<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
													<img
														src={formData.icon}
														alt="预览"
														className="h-5 w-5 object-contain"
														onError={(e) => {
															(e.target as HTMLImageElement).style.display =
																"none";
														}}
													/>
												</div>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label className="flex items-center gap-2 text-sm font-medium">
											<AlertCircle className="h-4 w-4 text-primary" />
											运行状态
										</Label>
										<Select
											value={formData.status}
											onValueChange={(
												value: "active" | "maintenance" | "deprecated",
											) => setFormData((prev) => ({ ...prev, status: value }))}
										>
											<SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{statusOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														<div className="flex items-center gap-2">
															<div
																className={cn(
																	"h-2 w-2 rounded-full",
																	option.color,
																)}
															/>
															{option.label}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="environments" className="mt-0 space-y-5">
								{/* 生产环境 */}
								<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
									<div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
										<div className="flex items-center gap-2">
											<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
												<Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
											</div>
											<div>
												<h4 className="font-medium text-sm">
													生产环境 <span className="text-rose-500">*</span>
												</h4>
												<p className="text-xs text-slate-500">
													用户访问的主要入口
												</p>
											</div>
										</div>
									</div>
									<div className="p-4 space-y-4">
										<div className="space-y-2">
											<Label className="text-sm">访问类型</Label>
											<div className="grid grid-cols-2 gap-2">
												<button
													type="button"
													onClick={() => {
														updateProductionEnvironment("isExternal", false);
														updateProductionEnvironment("url", "/tools/");
													}}
													className={cn(
														"flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
														!getProductionEnv().isExternal
															? "border-primary bg-primary/5"
															: "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
													)}
												>
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-lg",
															!getProductionEnv().isExternal
																? "bg-primary text-white"
																: "bg-slate-100 dark:bg-slate-800 text-slate-500",
														)}
													>
														<Link2 className="h-4 w-4" />
													</div>
													<div className="text-left">
														<p className="font-medium text-sm">内部路由</p>
														<p className="text-xs text-slate-500">
															站内工具页面
														</p>
													</div>
												</button>
												<button
													type="button"
													onClick={() => {
														updateProductionEnvironment("isExternal", true);
														updateProductionEnvironment("url", "");
													}}
													className={cn(
														"flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer",
														getProductionEnv().isExternal
															? "border-primary bg-primary/5"
															: "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
													)}
												>
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-lg",
															getProductionEnv().isExternal
																? "bg-primary text-white"
																: "bg-slate-100 dark:bg-slate-800 text-slate-500",
														)}
													>
														<ExternalLink className="h-4 w-4" />
													</div>
													<div className="text-left">
														<p className="font-medium text-sm">外部链接</p>
														<p className="text-xs text-slate-500">
															跳转外部站点
														</p>
													</div>
												</button>
											</div>
										</div>
										<div className="space-y-2">
											<Label className="text-sm">
												{getProductionEnv().isExternal
													? "访问链接"
													: "路由路径"}
											</Label>
											{getProductionEnv().isExternal ? (
												<Input
													value={getProductionEnv().url}
													onChange={(e) =>
														updateProductionEnvironment("url", e.target.value)
													}
													placeholder="https://example.com"
													className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
													required
												/>
											) : (
												<div className="flex items-center">
													<span className="flex h-9 items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-sm text-slate-500">
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
														placeholder="your-tool-slug"
														className="rounded-l-none bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
														required
													/>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* 测试环境 */}
								{isInternalTool ? (
									<div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
										<AlertCircle className="h-5 w-5 text-slate-400" />
										<p className="text-sm text-slate-500">
											内部工具仅支持生产环境，无需配置测试环境
										</p>
									</div>
								) : (
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
													<Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
												</div>
												<div>
													<h4 className="font-medium text-sm">测试环境</h4>
													<p className="text-xs text-slate-500">
														可选的开发/测试环境
													</p>
												</div>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={addTestEnvironment}
												className="gap-2"
											>
												<Plus className="h-4 w-4" />
												添加环境
											</Button>
										</div>

										{testEnvironments.length === 0 ? (
											<div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
												<Globe className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
												<p className="text-sm text-slate-500">暂无测试环境</p>
												<p className="text-xs text-slate-400">
													点击上方按钮添加
												</p>
											</div>
										) : (
											<div className="space-y-3">
												{testEnvironments.map((env, index) => (
													<div
														key={index}
														className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
													>
														<div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
															<span className="text-sm font-medium">
																测试环境 {index + 1}
															</span>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onClick={() => removeTestEnvironment(index)}
																className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
															>
																<X className="h-4 w-4" />
															</Button>
														</div>
														<div className="p-4 space-y-3">
															<div className="grid grid-cols-2 gap-3">
																<div className="space-y-1.5">
																	<Label className="text-xs">环境标识</Label>
																	<Input
																		value={env.name}
																		onChange={(e) =>
																			updateTestEnvironment(
																				index,
																				"name",
																				e.target.value,
																			)
																		}
																		placeholder="test, staging..."
																		className="h-8 text-sm bg-slate-50 dark:bg-slate-800"
																	/>
																</div>
																<div className="space-y-1.5">
																	<Label className="text-xs">显示名称</Label>
																	<Input
																		value={env.label}
																		onChange={(e) =>
																			updateTestEnvironment(
																				index,
																				"label",
																				e.target.value,
																			)
																		}
																		placeholder="测试环境"
																		className="h-8 text-sm bg-slate-50 dark:bg-slate-800"
																	/>
																</div>
															</div>
															<div className="space-y-1.5">
																<Label className="text-xs">访问链接</Label>
																<Input
																	value={env.url}
																	onChange={(e) =>
																		updateTestEnvironment(
																			index,
																			"url",
																			e.target.value,
																		)
																	}
																	placeholder="https://test.example.com"
																	className="h-8 text-sm bg-slate-50 dark:bg-slate-800"
																/>
															</div>
														</div>
													</div>
												))}
											</div>
										)}
									</div>
								)}
							</TabsContent>

							<TabsContent value="advanced" className="mt-0 space-y-5">
								{/* 标签管理 */}
								<div className="space-y-3">
									<Label className="flex items-center gap-2 text-sm font-medium">
										<Tag className="h-4 w-4 text-primary" />
										工具标签
									</Label>
									<div className="flex gap-2">
										<Input
											value={newTag}
											onChange={(e) => setNewTag(e.target.value)}
											placeholder="输入标签名称..."
											className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddTag();
												}
											}}
										/>
										<Button
											type="button"
											onClick={handleAddTag}
											variant="outline"
											className="flex-shrink-0"
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
									<div className="flex flex-wrap gap-2 min-h-[32px]">
										{formData.tags.length === 0 ? (
											<p className="text-sm text-slate-400">
												暂无标签，添加标签帮助用户更快找到工具
											</p>
										) : (
											formData.tags.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
												>
													{tag}
													<button
														type="button"
														onClick={() => handleRemoveTag(tag)}
														className="rounded-full p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
													>
														<X className="h-3 w-3" />
													</button>
												</Badge>
											))
										)}
									</div>
								</div>

								{/* 权限控制 */}
								<div className="space-y-3">
									<Label className="flex items-center gap-2 text-sm font-medium">
										<Key className="h-4 w-4 text-primary" />
										访问权限
									</Label>
									<Select
										value={formData.permissionId || "none"}
										onValueChange={(value) =>
											setFormData((prev) => ({
												...prev,
												permissionId: value === "none" ? undefined : value,
											}))
										}
									>
										<SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
											<SelectValue placeholder="选择权限要求" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">
												<div className="flex items-center gap-2">
													<div className="h-2 w-2 rounded-full bg-emerald-500" />
													公开访问（无需权限）
												</div>
											</SelectItem>
											{permissions.map((perm) => (
												<SelectItem key={perm.id} value={perm.id}>
													<div className="flex items-center gap-2">
														<div className="h-2 w-2 rounded-full bg-amber-500" />
														{perm.resource}:{perm.action}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-slate-500 flex items-start gap-2">
										<AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
										<span>
											设置访问权限后，只有拥有对应权限的用户才能使用此工具
										</span>
									</p>
								</div>
							</TabsContent>
						</div>
					</Tabs>

					{/* Footer */}
					<div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
						<div className="text-xs text-slate-500">
							<span className="text-rose-500">*</span> 为必填项
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={loading}
							>
								取消
							</Button>
							<Button
								type="submit"
								disabled={loading}
								className="gap-2 shadow-lg shadow-primary/25 min-w-[100px]"
							>
								{loading ? (
									<>
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
										{initialData ? "更新中..." : "添加中..."}
									</>
								) : (
									<>
										<Check className="h-4 w-4" />
										{initialData ? "更新工具" : "添加工具"}
									</>
								)}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
