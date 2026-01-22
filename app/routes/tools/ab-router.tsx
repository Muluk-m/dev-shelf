import {
	AlertCircle,
	ArrowRight,
	Check,
	ChevronRight,
	Copy,
	ExternalLink,
	Globe2,
	Laptop2,
	Link2,
	List,
	Monitor,
	Plus,
	RefreshCcw,
	Search,
	Server,
	Settings,
	Shield,
	Smartphone,
	Trash2,
	Wifi,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	EmptyState,
	ErrorState,
	LinkFormDialog,
	LinkTable,
	LogTable,
	LogTableFilter,
} from "~/components/ab-router";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	AB_ROUTER_UPSTREAM_URL,
	deleteABRouterLink,
	getABRouterLinks,
	previewABRouterLink,
	queryABRouterLogs,
	saveABRouterLink,
} from "~/lib/api";
import type {
	AccessLog,
	LinkConfig,
	LogQueryParams,
	PreviewResult,
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
	const [activeTab, setActiveTab] = useState("links");

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

	// 日志状态
	const [logs, setLogs] = useState<AccessLog[]>([]);
	const [logsLoading, setLogsLoading] = useState(false);
	const [logsError, setLogsError] = useState<string | null>(null);
	const [logFilter, setLogFilter] = useState<LogQueryParams>({
		page: 1,
		limit: 20,
	});
	const [logsTotal, setLogsTotal] = useState(0);

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

	// 加载日志列表
	const loadLogs = useCallback(async () => {
		try {
			setLogsLoading(true);
			setLogsError(null);
			const response = await queryABRouterLogs(logFilter);
			setLogs(response.data);
			setLogsTotal(response.total);
		} catch (err) {
			setLogsError(err instanceof Error ? err.message : "加载日志失败");
		} finally {
			setLogsLoading(false);
		}
	}, [logFilter]);

	// 处理分页变化
	const handlePageChange = useCallback((newPage: number) => {
		setLogFilter((prev) => ({ ...prev, page: newPage }));
	}, []);

	// 当筛选条件变化时自动加载（分页变化时）
	useEffect(() => {
		if (logFilter.page && logFilter.page > 1) {
			loadLogs();
		}
	}, [logFilter.page, loadLogs]);

	// 当切换到日志 tab 且有 linkId 筛选条件时自动加载
	useEffect(() => {
		if (activeTab === "logs" && logFilter.linkId && logs.length === 0) {
			loadLogs();
		}
	}, [activeTab, logFilter.linkId, logs.length, loadLogs]);

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

	// 查看日志
	const handleViewLogs = useCallback((linkId: string) => {
		// 设置日志筛选条件
		setLogFilter({ page: 1, limit: 20, linkId });
		// 切换到日志 tab
		setActiveTab("logs");
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto px-4 max-w-7xl">
				{/* 页面头部 */}
				<ToolPageHeader
					icon={<Link2 className="h-5 w-5" />}
					title="A/B Router 管理"
					description="管理链接路由配置，根据多维度规则智能路由访问者"
					showBackButton={false}
				/>

				{/* 主要内容 */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
					<div className="flex items-center justify-between gap-4 mb-6">
						<TabsList className="bg-muted/60 p-1">
							<TabsTrigger value="links" className="gap-2 px-4">
								<Link2 className="h-4 w-4" />
								链接配置
							</TabsTrigger>
							<TabsTrigger
								value="logs"
								className="gap-2 px-4"
								onClick={() => {
									if (logs.length === 0 && !logsLoading) {
										loadLogs();
									}
								}}
							>
								<List className="h-4 w-4" />
								访问日志
							</TabsTrigger>
							<TabsTrigger value="settings" className="gap-2 px-4">
								<Settings className="h-4 w-4" />
								服务设置
							</TabsTrigger>
						</TabsList>

						{/* 工具栏 */}
						<div className="flex items-center gap-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="搜索链路..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 w-60 h-9 bg-muted/50 border-0 focus-visible:ring-1"
								/>
							</div>
							<Button
								variant="outline"
								size="icon"
								onClick={loadLinks}
								disabled={loading}
								className="h-9 w-9 shrink-0"
							>
								<RefreshCcw
									className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
								/>
							</Button>
							<Button onClick={handleCreate} className="gap-2 h-9 shrink-0">
								<Plus className="h-4 w-4" />
								新建链接
							</Button>
						</div>
					</div>

					<TabsContent value="links" className="mt-0">
						{/* 错误状态 */}
						{error && (
							<div className="mb-6">
								<ErrorState
									error={error}
									onRetry={loadLinks}
									onDismiss={() => setError(null)}
								/>
							</div>
						)}

						{/* 链接列表 */}
						{loading && links.length === 0 ? (
							<Card className="border-border/60">
								<CardContent className="p-6">
									<div className="space-y-3">
										{[...Array(5)].map((_, i) => (
											<Skeleton key={i} className="h-12 w-full" />
										))}
									</div>
								</CardContent>
							</Card>
						) : filteredLinks.length === 0 ? (
							<EmptyState
								searchQuery={searchQuery}
								onCreateClick={handleCreate}
							/>
						) : (
							<LinkTable
								links={filteredLinks}
								copiedId={copiedId}
								onCopy={handleCopy}
								onEdit={handleEdit}
								onPreview={handlePreview}
								onDelete={(link) => {
									setDeletingLink(link);
									setIsDeleteOpen(true);
								}}
								onViewLogs={handleViewLogs}
							/>
						)}
					</TabsContent>

					<TabsContent value="logs" className="mt-0">
						<div className="space-y-4">
							{/* 筛选器 */}
							<LogTableFilter
								links={links}
								filter={logFilter}
								onFilterChange={(newFilter) => {
									setLogFilter(newFilter);
								}}
								onSearch={loadLogs}
							/>

							{/* 日志表格 */}
							<LogTable
								logs={logs}
								total={logsTotal}
								loading={logsLoading}
								error={logsError}
								pagination={{
									page: logFilter.page || 1,
									limit: logFilter.limit || 20,
									hasMore: logs.length === (logFilter.limit || 20),
								}}
								onPageChange={handlePageChange}
								onRefresh={loadLogs}
								onDismissError={() => setLogsError(null)}
							/>
						</div>
					</TabsContent>

					<TabsContent value="settings" className="mt-0">
						<div className="grid gap-6 lg:grid-cols-2">
							{/* API 信息卡片 */}
							<Card className="border-border/60 shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
											<Server className="h-5 w-5 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-foreground">
												API 服务
											</h3>
											<p className="text-sm text-muted-foreground">
												AB Router 后端服务地址
											</p>
										</div>
									</div>

									<div className="space-y-4">
										<div>
											<Label className="text-xs text-muted-foreground mb-2 block">
												服务地址
											</Label>
											<div className="flex items-center gap-2">
												<Input
													value={AB_ROUTER_UPSTREAM_URL}
													readOnly
													className="font-mono text-sm bg-muted/50 border-border/60"
												/>
												<Button
													variant="outline"
													size="icon"
													onClick={() =>
														handleCopy(AB_ROUTER_UPSTREAM_URL, "api-url")
													}
													className="shrink-0"
												>
													{copiedId === "api-url" ? (
														<Check className="h-4 w-4 text-emerald-600" />
													) : (
														<Copy className="h-4 w-4" />
													)}
												</Button>
											</div>
										</div>

										<Separator />

										<div>
											<Label className="text-xs text-muted-foreground mb-2 block">
												跳转链接格式
											</Label>
											<div className="p-3 rounded-lg bg-muted/50 font-mono text-sm">
												{AB_ROUTER_UPSTREAM_URL}/go/
												<span className="text-primary">{"{linkId}"}</span>
											</div>
											<p className="text-xs text-muted-foreground mt-2">
												将{" "}
												<code className="px-1 py-0.5 rounded bg-muted">
													{"{linkId}"}
												</code>{" "}
												替换为实际的链路 ID
											</p>
										</div>
									</div>

									<div className="mt-6 pt-4 border-t border-border/50">
										<Button variant="outline" asChild className="w-full gap-2">
											<a
												href={AB_ROUTER_UPSTREAM_URL}
												target="_blank"
												rel="noopener noreferrer"
											>
												<ExternalLink className="h-4 w-4" />
												访问 API 服务
												<ArrowRight className="h-4 w-4 ml-auto" />
											</a>
										</Button>
									</div>
								</CardContent>
							</Card>

							{/* 功能说明卡片 */}
							<Card className="border-border/60 shadow-sm">
								<CardContent className="p-6">
									<div className="flex items-center gap-3 mb-6">
										<div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
											<Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
										</div>
										<div>
											<h3 className="font-semibold text-foreground">
												路由规则
											</h3>
											<p className="text-sm text-muted-foreground">
												决策优先级说明
											</p>
										</div>
									</div>

									<div className="space-y-2">
										{[
											{
												icon: Shield,
												label: "蜘蛛白名单",
												desc: "搜索引擎爬虫优先放行",
											},
											{
												icon: Globe2,
												label: "投放国家",
												desc: "根据 IP 地理位置判断",
											},
											{
												icon: AlertCircle,
												label: "空语言检查",
												desc: "阻止无语言标识的请求",
											},
											{
												icon: Monitor,
												label: "PC 设备检测",
												desc: "区分桌面端和移动端",
											},
											{ icon: Wifi, label: "代理检测", desc: "识别代理和 VPN" },
										].map((item, index) => (
											<div
												key={index}
												className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
											>
												<div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-muted-foreground text-sm font-medium shrink-0">
													{index + 1}
												</div>
												<item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-foreground">
														{item.label}
													</p>
													<p className="text-xs text-muted-foreground">
														{item.desc}
													</p>
												</div>
												<ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</main>

			{/* 创建/编辑对话框 */}
			<LinkFormDialog
				open={isFormOpen}
				onOpenChange={setIsFormOpen}
				editingLink={editingLink}
				formData={formData}
				setFormData={setFormData}
				formError={formError}
				saving={saving}
				onSave={handleSave}
			/>

			{/* 删除确认对话框 */}
			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
								<Trash2 className="h-5 w-5 text-destructive" />
							</div>
							确认删除
						</DialogTitle>
						<DialogDescription className="pt-3">
							确定要删除链接配置{" "}
							<span className="font-medium text-foreground">
								"{deletingLink?.name}"
							</span>{" "}
							吗？
							<br />
							<span className="text-xs">此操作无法撤销。</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0 mt-4">
						<Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							className="gap-2"
						>
							<Trash2 className="h-4 w-4" />
							确认删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 预览对话框 */}
			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>决策预览</DialogTitle>
						<DialogDescription>
							模拟当前浏览器访问 "{previewingLink?.name}" 的路由决策
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						{previewing ? (
							<div className="flex flex-col items-center justify-center py-8">
								<RefreshCcw className="h-8 w-8 text-primary animate-spin mb-4" />
								<p className="text-sm text-muted-foreground">正在分析...</p>
							</div>
						) : previewResult ? (
							<div className="space-y-4">
								<div
									className={`p-4 rounded-xl ${
										previewResult.decision === "real"
											? "bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30"
											: "bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30"
									}`}
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-10 h-10 rounded-full flex items-center justify-center ${
												previewResult.decision === "real"
													? "bg-emerald-200 dark:bg-emerald-500/30"
													: "bg-amber-200 dark:bg-amber-500/30"
											}`}
										>
											{previewResult.decision === "real" ? (
												<Smartphone className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
											) : (
												<Laptop2 className="h-5 w-5 text-amber-700 dark:text-amber-400" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p
												className={`font-semibold ${
													previewResult.decision === "real"
														? "text-emerald-800 dark:text-emerald-300"
														: "text-amber-800 dark:text-amber-300"
												}`}
											>
												{previewResult.decision === "real"
													? "跳转真实链接"
													: "跳转审核链接"}
											</p>
											<p className="text-sm text-foreground/70 truncate">
												{previewResult.targetUrl}
											</p>
										</div>
									</div>
								</div>

								{previewResult.reasons && previewResult.reasons.length > 0 && (
									<div className="space-y-2">
										<p className="text-sm font-medium text-foreground">
											决策原因
										</p>
										<div className="space-y-1.5">
											{previewResult.reasons.map((reason, i) => (
												<div
													key={i}
													className="flex items-start gap-2 text-sm text-muted-foreground"
												>
													<ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
													{reason}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						) : null}
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
							关闭
						</Button>
						<Button
							variant="secondary"
							onClick={() => previewingLink && handlePreview(previewingLink)}
							disabled={previewing}
							className="gap-2"
						>
							<RefreshCcw
								className={`h-4 w-4 ${previewing ? "animate-spin" : ""}`}
							/>
							重新预览
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
