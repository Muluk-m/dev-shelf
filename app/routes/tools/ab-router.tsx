import {
	AlertTriangle,
	Check,
	Copy,
	ExternalLink,
	Globe,
	Laptop,
	Link2,
	Monitor,
	PenSquare,
	Play,
	Plus,
	RefreshCw,
	Search,
	Settings2,
	Smartphone,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import {
	AB_ROUTER_API_URL,
	deleteABRouterLink,
	getABRouterGoUrl,
	getABRouterLinks,
	previewABRouterLink,
	saveABRouterLink,
} from "~/lib/api";
import {
	COMMON_COUNTRIES,
	LINK_MODE_OPTIONS,
	type LinkConfig,
	type LinkMode,
	type PreviewResult,
} from "~/types/ab-router";
import type { Route } from "./+types/ab-router";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "A/B Router 管理 | DevTools Platform" },
		{
			name: "description",
			content: "管理 A/B 链接路由配置，支持多维度规则和访问日志",
		},
	];
}

// 空配置模板
const emptyConfig: Omit<LinkConfig, "id"> = {
	name: "",
	realLink: "",
	reviewLink: "",
	shortLink: "",
	note: "",
	mode: "review",
	rules: {
		countries: [],
		blockEmptyLanguage: false,
		blockPC: false,
		blockProxy: false,
		spiderWhitelist: [],
	},
};

export default function ABRouterPage() {
	// 状态管理
	const [links, setLinks] = useState<LinkConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// 对话框状态
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [editingLink, setEditingLink] = useState<LinkConfig | null>(null);
	const [deletingLink, setDeletingLink] = useState<LinkConfig | null>(null);
	const [previewingLink, setPreviewingLink] = useState<LinkConfig | null>(null);

	// 表单状态
	const [formData, setFormData] = useState<
		Omit<LinkConfig, "id"> & { id: string }
	>({
		id: "",
		...emptyConfig,
	});
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// 预览状态
	const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
		null,
	);
	const [previewing, setPreviewing] = useState(false);

	// 复制成功状态
	const [copiedId, setCopiedId] = useState<string | null>(null);

	// 加载链接列表
	const loadLinks = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getABRouterLinks();
			setLinks(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "加载失败");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadLinks();
	}, [loadLinks]);

	// 搜索过滤
	const filteredLinks = links.filter(
		(link) =>
			link.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			link.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// 打开创建对话框
	const handleCreate = () => {
		setEditingLink(null);
		setFormData({ id: "", ...emptyConfig });
		setFormError(null);
		setIsFormOpen(true);
	};

	// 打开编辑对话框
	const handleEdit = (link: LinkConfig) => {
		setEditingLink(link);
		setFormData({
			id: link.id,
			name: link.name,
			realLink: link.realLink,
			reviewLink: link.reviewLink,
			shortLink: link.shortLink || "",
			note: link.note || "",
			mode: link.mode,
			rules: {
				countries: link.rules.countries || [],
				blockEmptyLanguage: link.rules.blockEmptyLanguage || false,
				blockPC: link.rules.blockPC || false,
				blockProxy: link.rules.blockProxy || false,
				spiderWhitelist: link.rules.spiderWhitelist || [],
			},
		});
		setFormError(null);
		setIsFormOpen(true);
	};

	// 保存配置
	const handleSave = async () => {
		// 验证必填字段
		if (!formData.id.trim()) {
			setFormError("请输入链路 ID");
			return;
		}
		if (!formData.name.trim()) {
			setFormError("请输入配置名称");
			return;
		}
		if (!formData.realLink.trim()) {
			setFormError("请输入真实链接");
			return;
		}
		if (!formData.reviewLink.trim()) {
			setFormError("请输入审核链接");
			return;
		}

		// 验证 URL 格式
		try {
			new URL(formData.realLink);
		} catch {
			setFormError("真实链接格式不正确");
			return;
		}
		try {
			new URL(formData.reviewLink);
		} catch {
			setFormError("审核链接格式不正确");
			return;
		}

		try {
			setSaving(true);
			setFormError(null);
			const { id, ...config } = formData;
			await saveABRouterLink(id, config);
			await loadLinks();
			setIsFormOpen(false);
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "保存失败");
		} finally {
			setSaving(false);
		}
	};

	// 删除配置
	const handleDelete = async () => {
		if (!deletingLink) return;
		try {
			await deleteABRouterLink(deletingLink.id);
			await loadLinks();
			setIsDeleteOpen(false);
			setDeletingLink(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "删除失败");
		}
	};

	// 预览决策
	const handlePreview = async (link: LinkConfig) => {
		setPreviewingLink(link);
		setPreviewResult(null);
		setIsPreviewOpen(true);
		try {
			setPreviewing(true);
			const result = await previewABRouterLink(link.id);
			setPreviewResult(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "预览失败");
		} finally {
			setPreviewing(false);
		}
	};

	// 复制链接
	const handleCopy = async (url: string, id: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			// 忽略复制失败
		}
	};

	// 获取模式徽章样式
	const getModeVariant = (mode: LinkMode) => {
		switch (mode) {
			case "all_open":
				return "default";
			case "review":
				return "secondary";
			case "final_link":
				return "outline";
			default:
				return "default";
		}
	};

	// 获取模式标签
	const getModeLabel = (mode: LinkMode) => {
		const option = LINK_MODE_OPTIONS.find((o) => o.value === mode);
		return option?.label || mode;
	};

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-7xl mx-auto flex flex-col h-full space-y-4">
					<ToolPageHeader
						icon={<Link2 className="h-5 w-5" />}
						title="A/B Router 管理"
						description="管理链接路由配置，根据多维度规则决定访问真实链接还是审核链接"
					/>

					<Tabs defaultValue="links" className="flex-1 flex flex-col">
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="links">链接配置</TabsTrigger>
							<TabsTrigger value="settings">服务设置</TabsTrigger>
						</TabsList>

						<TabsContent
							value="links"
							className="flex-1 flex flex-col space-y-4"
						>
							{/* 工具栏 */}
							<div className="flex items-center gap-3">
								<div className="relative flex-1 max-w-sm">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="搜索链路 ID 或名称..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
								</div>
								<Button variant="outline" size="icon" onClick={loadLinks}>
									<RefreshCw
										className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
									/>
								</Button>
								<Button onClick={handleCreate}>
									<Plus className="h-4 w-4 mr-2" />
									新建链接
								</Button>
							</div>

							{/* 错误提示 */}
							{error && (
								<div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
									<AlertTriangle className="h-4 w-4" />
									{error}
									<Button
										variant="ghost"
										size="sm"
										className="ml-auto h-6 px-2"
										onClick={() => setError(null)}
									>
										<X className="h-3 w-3" />
									</Button>
								</div>
							)}

							{/* 链接列表 */}
							{loading && links.length === 0 ? (
								<div className="flex-1 flex items-center justify-center text-muted-foreground">
									加载中...
								</div>
							) : filteredLinks.length === 0 ? (
								<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
									<Link2 className="h-12 w-12 mb-4 opacity-20" />
									<p>{searchQuery ? "没有找到匹配的链接" : "暂无链接配置"}</p>
									{!searchQuery && (
										<Button
											variant="link"
											onClick={handleCreate}
											className="mt-2"
										>
											创建第一个链接
										</Button>
									)}
								</div>
							) : (
								<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
									{filteredLinks.map((link) => (
										<Card key={link.id} className="group">
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<div className="space-y-1">
														<CardTitle className="text-base flex items-center gap-2">
															{link.name}
															<Badge variant={getModeVariant(link.mode)}>
																{getModeLabel(link.mode)}
															</Badge>
														</CardTitle>
														<CardDescription className="font-mono text-xs">
															{link.id}
														</CardDescription>
													</div>
												</div>
											</CardHeader>
											<CardContent className="space-y-3">
												{/* 规则图标 */}
												{link.mode === "review" && (
													<div className="flex flex-wrap gap-2">
														{link.rules.countries &&
															link.rules.countries.length > 0 && (
																<Badge variant="outline" className="text-xs">
																	<Globe className="h-3 w-3 mr-1" />
																	{link.rules.countries.length} 国家
																</Badge>
															)}
														{link.rules.blockPC && (
															<Badge variant="outline" className="text-xs">
																<Monitor className="h-3 w-3 mr-1" />
																屏蔽 PC
															</Badge>
														)}
														{link.rules.blockProxy && (
															<Badge variant="outline" className="text-xs">
																<AlertTriangle className="h-3 w-3 mr-1" />
																屏蔽代理
															</Badge>
														)}
														{link.rules.blockEmptyLanguage && (
															<Badge variant="outline" className="text-xs">
																空语言
															</Badge>
														)}
													</div>
												)}

												{/* 链接预览 */}
												<div className="space-y-1 text-xs text-muted-foreground">
													<div className="flex items-center gap-1 truncate">
														<span className="text-green-600">真实:</span>
														<span className="truncate">{link.realLink}</span>
													</div>
													<div className="flex items-center gap-1 truncate">
														<span className="text-orange-600">审核:</span>
														<span className="truncate">{link.reviewLink}</span>
													</div>
												</div>

												{/* 操作按钮 */}
												<div className="flex items-center gap-2 pt-2">
													<Button
														variant="outline"
														size="sm"
														className="flex-1"
														onClick={() =>
															handleCopy(getABRouterGoUrl(link.id), link.id)
														}
													>
														{copiedId === link.id ? (
															<>
																<Check className="h-3 w-3 mr-1 text-green-600" />
																已复制
															</>
														) : (
															<>
																<Copy className="h-3 w-3 mr-1" />
																复制链接
															</>
														)}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => handlePreview(link)}
													>
														<Play className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														onClick={() => handleEdit(link)}
													>
														<PenSquare className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-destructive hover:text-destructive"
														onClick={() => {
															setDeletingLink(link);
															setIsDeleteOpen(true);
														}}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value="settings" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Settings2 className="h-5 w-5" />
										服务信息
									</CardTitle>
									<CardDescription>
										AB Router 是独立部署的链接路由服务
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label>API 地址</Label>
										<div className="flex items-center gap-2">
											<Input
												value={AB_ROUTER_API_URL}
												readOnly
												className="font-mono"
											/>
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleCopy(AB_ROUTER_API_URL, "api-url")}
											>
												{copiedId === "api-url" ? (
													<Check className="h-4 w-4 text-green-600" />
												) : (
													<Copy className="h-4 w-4" />
												)}
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<Label>跳转链接格式</Label>
										<div className="flex items-center gap-2">
											<Input
												value={`${AB_ROUTER_API_URL}/go/{linkId}`}
												readOnly
												className="font-mono"
											/>
										</div>
										<p className="text-xs text-muted-foreground">
											将 {"{linkId}"} 替换为实际的链路 ID
										</p>
									</div>
									<div className="pt-4">
										<Button variant="outline" asChild>
											<a
												href={AB_ROUTER_API_URL}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ExternalLink className="h-4 w-4 mr-2" />
												打开 API 服务
											</a>
										</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>

			{/* 创建/编辑对话框 */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingLink ? "编辑链接配置" : "新建链接配置"}
						</DialogTitle>
						<DialogDescription>
							配置链接路由规则，决定访问者的跳转目标
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{formError && (
							<div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{formError}
							</div>
						)}

						{/* 基础信息 */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="link-id">链路 ID *</Label>
								<Input
									id="link-id"
									value={formData.id}
									onChange={(e) =>
										setFormData({ ...formData, id: e.target.value })
									}
									placeholder="如: link001"
									disabled={!!editingLink}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="link-name">配置名称 *</Label>
								<Input
									id="link-name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="如: 产品落地页"
								/>
							</div>
						</div>

						{/* 链接配置 */}
						<div className="space-y-2">
							<Label htmlFor="real-link">真实链接 *</Label>
							<Input
								id="real-link"
								value={formData.realLink}
								onChange={(e) =>
									setFormData({ ...formData, realLink: e.target.value })
								}
								placeholder="https://example.com/real"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="review-link">审核链接 *</Label>
							<Input
								id="review-link"
								value={formData.reviewLink}
								onChange={(e) =>
									setFormData({ ...formData, reviewLink: e.target.value })
								}
								placeholder="https://example.com/review"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="short-link">短链 (可选)</Label>
							<Input
								id="short-link"
								value={formData.shortLink}
								onChange={(e) =>
									setFormData({ ...formData, shortLink: e.target.value })
								}
								placeholder="https://short.link/abc"
							/>
						</div>

						{/* 模式选择 */}
						<div className="space-y-2">
							<Label>路由模式</Label>
							<Select
								value={formData.mode}
								onValueChange={(value: LinkMode) =>
									setFormData({ ...formData, mode: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LINK_MODE_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div className="flex flex-col">
												<span>{option.label}</span>
												<span className="text-xs text-muted-foreground">
													{option.description}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 规则配置 - 仅在 review 模式显示 */}
						{formData.mode === "review" && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">规则配置</CardTitle>
									<CardDescription className="text-xs">
										决策优先级：蜘蛛白名单 → 投放国家 → 空语言 → PC设备 → 代理
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* 投放国家 */}
									<div className="space-y-2">
										<Label>投放国家</Label>
										<Select
											value={formData.rules.countries?.join(",") || ""}
											onValueChange={(value) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														countries: value ? value.split(",") : [],
													},
												})
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="选择国家（可多选）">
													{formData.rules.countries &&
													formData.rules.countries.length > 0
														? `已选择 ${formData.rules.countries.length} 个国家`
														: "选择国家（可多选）"}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{COMMON_COUNTRIES.map((country) => (
													<SelectItem key={country.code} value={country.code}>
														{country.name} ({country.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{formData.rules.countries &&
											formData.rules.countries.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{formData.rules.countries.map((code) => {
														const country = COMMON_COUNTRIES.find(
															(c) => c.code === code,
														);
														return (
															<Badge key={code} variant="secondary">
																{country?.name || code}
																<button
																	type="button"
																	className="ml-1 hover:text-destructive"
																	onClick={() =>
																		setFormData({
																			...formData,
																			rules: {
																				...formData.rules,
																				countries:
																					formData.rules.countries?.filter(
																						(c) => c !== code,
																					) || [],
																			},
																		})
																	}
																>
																	<X className="h-3 w-3" />
																</button>
															</Badge>
														);
													})}
												</div>
											)}
									</div>

									{/* 开关选项 */}
									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="block-empty-lang"
												checked={formData.rules.blockEmptyLanguage}
												onCheckedChange={(checked) =>
													setFormData({
														...formData,
														rules: {
															...formData.rules,
															blockEmptyLanguage: checked === true,
														},
													})
												}
											/>
											<Label htmlFor="block-empty-lang" className="text-sm">
												禁止空语言
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="block-pc"
												checked={formData.rules.blockPC}
												onCheckedChange={(checked) =>
													setFormData({
														...formData,
														rules: {
															...formData.rules,
															blockPC: checked === true,
														},
													})
												}
											/>
											<Label htmlFor="block-pc" className="text-sm">
												屏蔽 PC 设备
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="block-proxy"
												checked={formData.rules.blockProxy}
												onCheckedChange={(checked) =>
													setFormData({
														...formData,
														rules: {
															...formData.rules,
															blockProxy: checked === true,
														},
													})
												}
											/>
											<Label htmlFor="block-proxy" className="text-sm">
												禁止代理
											</Label>
										</div>
									</div>

									{/* 蜘蛛白名单 */}
									<div className="space-y-2">
										<Label htmlFor="spider-whitelist">
											蜘蛛白名单 (User-Agent 关键词，每行一个)
										</Label>
										<Textarea
											id="spider-whitelist"
											value={formData.rules.spiderWhitelist?.join("\n") || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													rules: {
														...formData.rules,
														spiderWhitelist: e.target.value
															.split("\n")
															.filter(Boolean),
													},
												})
											}
											placeholder="Googlebot&#10;Bingbot&#10;Applebot"
											rows={3}
										/>
									</div>
								</CardContent>
							</Card>
						)}

						{/* 备注 */}
						<div className="space-y-2">
							<Label htmlFor="note">备注</Label>
							<Textarea
								id="note"
								value={formData.note}
								onChange={(e) =>
									setFormData({ ...formData, note: e.target.value })
								}
								placeholder="可选的备注信息"
								rows={2}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsFormOpen(false)}>
							取消
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? "保存中..." : "保存"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 删除确认对话框 */}
			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认删除</DialogTitle>
						<DialogDescription>
							确定要删除链接配置 "{deletingLink?.name}" ({deletingLink?.id})
							吗？此操作无法撤销。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
							取消
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 预览对话框 */}
			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>决策预览</DialogTitle>
						<DialogDescription>
							模拟当前浏览器访问 "{previewingLink?.name}" 的路由决策
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						{previewing ? (
							<div className="flex items-center justify-center py-8 text-muted-foreground">
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
								预览中...
							</div>
						) : previewResult ? (
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div
										className={`p-2 rounded-full ${
											previewResult.decision === "real"
												? "bg-green-100 text-green-700"
												: "bg-orange-100 text-orange-700"
										}`}
									>
										{previewResult.decision === "real" ? (
											<Smartphone className="h-5 w-5" />
										) : (
											<Laptop className="h-5 w-5" />
										)}
									</div>
									<div>
										<p className="font-medium">
											{previewResult.decision === "real"
												? "跳转真实链接"
												: "跳转审核链接"}
										</p>
										<p className="text-sm text-muted-foreground truncate max-w-sm">
											{previewResult.targetUrl}
										</p>
									</div>
								</div>
								{previewResult.reasons.length > 0 && (
									<div className="space-y-2">
										<p className="text-sm font-medium">决策原因：</p>
										<ul className="text-sm text-muted-foreground space-y-1">
											{previewResult.reasons.map((reason, i) => (
												<li key={i} className="flex items-start gap-2">
													<span className="text-muted-foreground">•</span>
													{reason}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						) : null}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
							关闭
						</Button>
						<Button
							variant="outline"
							onClick={() => previewingLink && handlePreview(previewingLink)}
							disabled={previewing}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${previewing ? "animate-spin" : ""}`}
							/>
							重新预览
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
