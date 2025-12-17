import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Code,
	Eye,
	FileText,
	Heart,
	Link,
	Loader2,
	Smartphone,
	XCircle,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import type {
	ResourceInfo,
	ResourceType,
	WebsiteCheckResult,
} from "~/types/website-check";
import type { ConfigV3Data, ConfigV3Response } from "~/types/roibest-analyzer";

const API_ENDPOINT = "https://fe-toolkit.qiliangjia.org/website-check/analyze";

const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
	document: "#3b82f6",
	stylesheet: "#8b5cf6",
	image: "#10b981",
	media: "#f59e0b",
	font: "#ef4444",
	script: "#ec4899",
	texttrack: "#14b8a6",
	xhr: "#06b6d4",
	fetch: "#0ea5e9",
	eventsource: "#6366f1",
	websocket: "#a855f7",
	manifest: "#f97316",
	other: "#6b7280",
};

export function meta() {
	return [
		{ title: "RoiBest Link Health Check | DevTools Platform" },
		{
			name: "description",
			content: "Check RoiBest link health status and business information",
		},
	];
}

export default function PwaLinkHealth() {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<WebsiteCheckResult | null>(null);
	const [sortBy, setSortBy] = useState<keyof ResourceInfo>("startTime");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [filterType, setFilterType] = useState<ResourceType | "all">("all");
	const [expandedRow, setExpandedRow] = useState<number | null>(null);

	// 需要检查的 API 端点列表
	const REQUIRED_API_ENDPOINTS = [
		"/app.webmanifest",
		"/app/setV2",
		"/init/configV3",
		"/dns.json",
		"/prefetch.json",
		"/create/uuid",
		"/create/link",
		"/event/isInstall",
	];

	// 计算健康度评分
	const calculateHealthScore = (data: WebsiteCheckResult) => {
		let score = 100;
		const issues: string[] = [];

		// 1. PWA 可安装性检查（-30 分）
		if (!data.pwa?.isInstallable) {
			score -= 30;
			issues.push("PWA 不可安装");
		}

		// 2. 页面加载状态检查（-40 分）
		if (data.status < 200 || data.status >= 300) {
			score -= 40;
			issues.push(`页面状态码异常: ${data.status}`);
		}

		// 3. 失败请求数检查（-10 分）
		if (data.failedRequests > 0) {
			score -= 10;
			issues.push(`存在 ${data.failedRequests} 个失败请求`);
		}

		// 4. 控制台错误检查（-10 分）
		const consoleErrorCount = data.console?.errorCount ?? 0;
		if (consoleErrorCount > 0) {
			score -= 10;
			issues.push(`存在 ${consoleErrorCount} 个控制台错误`);
		}

		// 5. 业务接口调用检查（-10 分）
		const apiCheckResults: Record<string, boolean> = {};
		const failedApis: string[] = [];
		const missingApis: string[] = [];

		REQUIRED_API_ENDPOINTS.forEach((endpoint) => {
			const request = data.resources?.find((r) => r.url.includes(endpoint));
			if (!request) {
				apiCheckResults[endpoint] = false;
				missingApis.push(endpoint);
			} else if (
				!request.status ||
				request.status < 200 ||
				request.status >= 300
			) {
				apiCheckResults[endpoint] = false;
				failedApis.push(`${endpoint} (${request.status || "N/A"})`);
			} else {
				apiCheckResults[endpoint] = true;
			}
		});

		if (missingApis.length > 0 || failedApis.length > 0) {
			score -= 10;
			if (missingApis.length > 0) {
				issues.push(
					`业务接口未调用: ${missingApis.slice(0, 3).join(", ")}${missingApis.length > 3 ? ` 等 ${missingApis.length} 个` : ""}`,
				);
			}
			if (failedApis.length > 0) {
				issues.push(
					`业务接口调用失败: ${failedApis.slice(0, 3).join(", ")}${failedApis.length > 3 ? ` 等 ${failedApis.length} 个` : ""}`,
				);
			}
		}

		const allApisSuccess = Object.values(apiCheckResults).every(
			(v) => v === true,
		);

		return {
			score: Math.max(0, score),
			issues,
			checks: {
				isPwaInstallable: data.pwa?.isInstallable ?? false,
				isPageStatusOk: data.status >= 200 && data.status < 300,
				hasFailedRequests: (data.failedRequests ?? 0) > 0,
				hasConsoleErrors: consoleErrorCount > 0,
				isApiCallSuccess: allApisSuccess,
				apiCheckResults,
			},
		};
	};

	const handleAnalyze = async () => {
		if (!url.trim()) {
			setError("Please enter a valid URL");
			return;
		}

		setLoading(true);
		setProgress(0);
		setError(null);
		setResult(null);

		try {
			const data = await new Promise<WebsiteCheckResult>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("POST", API_ENDPOINT);
				xhr.setRequestHeader("Content-Type", "application/json");

				xhr.upload.addEventListener("progress", (e) => {
					if (e.lengthComputable) {
						setProgress(Math.round((e.loaded / e.total) * 10));
					}
				});

				xhr.addEventListener("progress", (e) => {
					if (e.lengthComputable) {
						setProgress(Math.round(10 + (e.loaded / e.total) * 90));
					}
				});

				xhr.addEventListener("load", () => {
					try {
						const parsed = JSON.parse(xhr.responseText);
						if (xhr.status >= 200 && xhr.status < 300) {
							setProgress(100);
							resolve(parsed);
						} else {
							reject(
								new Error(
									parsed?.message ||
										parsed?.error ||
										`Failed to analyze: ${xhr.statusText}`,
								),
							);
						}
					} catch {
						reject(
							new Error(
								xhr.status >= 200 && xhr.status < 300
									? "Failed to parse response"
									: `Failed to analyze: ${xhr.statusText}`,
							),
						);
					}
				});

				xhr.addEventListener("error", () => reject(new Error("Network error")));
				xhr.addEventListener("abort", () =>
					reject(new Error("Request aborted")),
				);

				xhr.send(JSON.stringify({ url, timeout: 30000, device: "mobile" }));
			});

			setResult(data);
		} catch (err) {
			setProgress(100);
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		} finally {
			setTimeout(() => setLoading(false), 300);
		}
	};

	const handleSort = (field: keyof ResourceInfo) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	const getSortedAndFilteredResources = () => {
		if (!result) return [];

		let filtered = result.resources;
		if (filterType !== "all") {
			filtered = filtered.filter((r) => r.type === filterType);
		}

		return [...filtered].sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];

			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			if (typeof aVal === "string" && typeof bVal === "string") {
				return sortOrder === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			return sortOrder === "asc"
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
	};

	const formatBytes = (bytes: number | null) => {
		if (bytes === null || bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatTime = (ms: number | null) => {
		if (ms === null) return "N/A";
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const resolveIconUrl = (iconSrc: string, baseUrl: string) => {
		try {
			return new URL(iconSrc, baseUrl).href;
		} catch {
			return iconSrc;
		}
	};

	const formatAppVersion = (timestamp: string) => {
		try {
			const date = new Date(Number(timestamp));
			if (Number.isNaN(date.getTime())) {
				return timestamp;
			}
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			const seconds = String(date.getSeconds()).padStart(2, "0");
			return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
		} catch {
			return timestamp;
		}
	};

	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	const getHealthScoreBgColor = (score: number) => {
		if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
		if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
		return "bg-red-100 dark:bg-red-900/20";
	};

	const resourceTypeStats = useMemo(
		() =>
			result?.resourceStats.map((stat) => ({
				name: stat.type,
				count: stat.count,
				size: stat.totalSize,
				failedCount: stat.failedCount,
				color: RESOURCE_TYPE_COLORS[stat.type],
			})) || [],
		[result?.resourceStats],
	);

	const healthScore = useMemo(
		() => (result ? calculateHealthScore(result) : null),
		[result],
	);

	// 从 resources 中提取 configV3 数据
	const configV3Data = useMemo(() => {
		if (!result) return null;
		const configV3Resource = result.resources.find((r) =>
			r.url.includes("/init/configV3"),
		);
		if (!configV3Resource?.response) return null;

		try {
			// response 可能是 ConfigV3Response 格式或者直接是 ConfigV3Data
			const response = configV3Resource.response as
				| ConfigV3Response
				| ConfigV3Data;
			if ("data" in response && response.data) {
				return response.data;
			}
			if ("app_name" in response) {
				return response as ConfigV3Data;
			}
			return null;
		} catch {
			return null;
		}
	}, [result]);

	// 字段翻译映射
	const fieldTranslations: Record<keyof ConfigV3Data, string> = {
		id: "ID",
		app_name: "应用名称",
		app_icon: "应用图标",
		company_name: "公司名称",
		app_comments: "评论数",
		app_score: "应用评分",
		app_age_limit: "年龄限制",
		app_desc: "应用描述",
		pic_list: "图片列表",
		status: "状态",
		package_name: "包名",
		package_link: "包链接",
		domain: "域名",
		creator: "创建者",
		project_id: "项目ID",
		created_at: "创建时间",
		updated_at: "更新时间",
		deleted_at: "删除时间",
		version: "版本",
		notes: "备注",
		remark: "说明",
		operate_remark: "运营备注",
		package_status: "包状态",
		applicable_age: "适用年龄",
		domain_id: "域名ID",
		theme_color: "主题色",
		background_color: "背景色",
		feishu_url: "飞书链接",
		current_language_code: "当前语言代码",
		package_type: "包类型",
		telegram_url: "Telegram链接",
		screen_way: "屏幕方向",
		all_screen: "全屏",
		pre_load: "预加载",
		default_menu: "默认菜单",
		hidden: "隐藏",
		all_click: "全点击",
		app_feedback_tpl_id: "反馈模板ID",
		from_put_account_id: "投放账户ID",
		label: "标签",
		label_id: "标签ID",
		language_json: "语言配置",
		linkInfo: "链接信息",
		pixels: "像素事件",
	};

	// 要显示的字段列表（关键字段）
	const displayFields: (keyof ConfigV3Data)[] = [
		"company_name",
		"domain",
		"package_name",
		"package_link",
		"status",
		"package_status",
		"current_language_code",
		"language_json",
		"version",
		"created_at",
		"updated_at",
		"notes",
		"package_type",
		"linkInfo",
	];

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
					<Heart className="w-8 h-8" />
					RoiBest Link Health Check
				</h1>
				<p className="text-muted-foreground">
					Analyze RoiBest link health status, business information, and
					performance
				</p>
			</div>

			{/* Search Form */}
			<Card className="mb-8">
				<CardContent className="pt-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								type="url"
								placeholder="Enter RoiBest URL (e.g., https://instalar.lunarbrl.com)"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
								className="flex-1"
							/>
							<Button onClick={handleAnalyze} disabled={loading}>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analyzing...
									</>
								) : (
									"Analyze"
								)}
							</Button>
						</div>
						{loading && (
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Analyzing website...</span>
									<span>{progress}%</span>
								</div>
								<Progress value={progress} className="h-2" />
							</div>
						)}
					</div>
					{error && (
						<div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
							<AlertCircle className="w-4 h-4" />
							{error}
						</div>
					)}
				</CardContent>
			</Card>

			{result && healthScore && (
				<>
					{/* Screenshot & Summary - Combined */}
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
						{/* Screenshot - Left */}
						{result.screenshot && (
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Screenshot</CardTitle>
								</CardHeader>
								<CardContent className="p-2">
									<div className="rounded border overflow-hidden">
										<img
											src={`data:image/png;base64,${result.screenshot}`}
											alt="Screenshot"
											className="w-full h-auto"
										/>
									</div>
								</CardContent>
							</Card>
						)}

						{/* All Info - Right - Single Card - Vertical Layout */}
						<Card
							className={`${result.screenshot ? "lg:col-span-3" : "lg:col-span-4"}`}
						>
							<CardContent className="p-4">
								<div className="space-y-4">
									{/* Health Score - Top */}
									<div
										className={`p-4 rounded-lg border-2 ${getHealthScoreBgColor(healthScore.score)}`}
									>
										<div className="flex items-center justify-between">
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													Health Score
												</div>
												<div
													className={`text-3xl font-bold ${getHealthScoreColor(healthScore.score)}`}
												>
													{healthScore.score}
												</div>
											</div>
											<Heart className="h-8 w-8 opacity-50" />
										</div>
									</div>

									{/* Quick Stats */}
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Status:</span>
											<Badge
												variant={
													result.status >= 200 && result.status < 300
														? "default"
														: "destructive"
												}
											>
												{result.status}
											</Badge>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Load:</span>
											<span className="font-medium">
												{formatTime(result.loadTime)}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Requests:</span>
											<span className="font-medium">
												{result.totalRequests}
												{result.failedRequests > 0 && (
													<span className="text-destructive ml-1">
														({result.failedRequests})
													</span>
												)}
											</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Size:</span>
											<span className="font-medium">
												{formatBytes(result.totalSize)}
											</span>
										</div>
									</div>

									{/* Page Info & Performance */}
									<div className="space-y-2 pt-2 border-t">
										{result.meta?.appVersion && (
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													App Version
												</div>
												<div className="text-sm font-mono">
													{formatAppVersion(result.meta.appVersion)}
												</div>
											</div>
										)}
										{result.performance && (
											<div className="grid grid-cols-2 gap-2 text-sm">
												{result.performance.fcp !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">FCP:</span>
														<span className="font-medium">
															{formatTime(result.performance.fcp)}
														</span>
													</div>
												)}
												{result.performance.lcp !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">LCP:</span>
														<span className="font-medium">
															{formatTime(result.performance.lcp)}
														</span>
													</div>
												)}
												{result.performance.domContentLoaded !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">DCL:</span>
														<span className="font-medium">
															{formatTime(result.performance.domContentLoaded)}
														</span>
													</div>
												)}
												{result.performance.loadEvent !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">Load:</span>
														<span className="font-medium">
															{formatTime(result.performance.loadEvent)}
														</span>
													</div>
												)}
											</div>
										)}
									</div>

									{/* Health Checks & Issues */}
									<div className="space-y-2 pt-2 border-t">
										<div>
											<div className="text-xs text-muted-foreground mb-2">
												Health Checks
											</div>
											<div className="grid grid-cols-2 gap-2">
												<div className="flex items-center gap-1.5 text-sm">
													{healthScore.checks.isPwaInstallable ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<XCircle className="h-4 w-4 text-red-600" />
													)}
													<span>PWA</span>
												</div>
												<div className="flex items-center gap-1.5 text-sm">
													{healthScore.checks.isPageStatusOk ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<XCircle className="h-4 w-4 text-red-600" />
													)}
													<span>Status</span>
												</div>
												<div className="flex items-center gap-1.5 text-sm">
													{!healthScore.checks.hasFailedRequests ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<XCircle className="h-4 w-4 text-red-600" />
													)}
													<span>Requests</span>
												</div>
												<div className="flex items-center gap-1.5 text-sm">
													{!healthScore.checks.hasConsoleErrors ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<XCircle className="h-4 w-4 text-red-600" />
													)}
													<span>Console</span>
												</div>
											</div>
											<div className="mt-2 pt-2 border-t">
												<div className="text-xs text-muted-foreground mb-2">
													API Checks
												</div>
												<div className="grid grid-cols-2 gap-1.5">
													{REQUIRED_API_ENDPOINTS.map((endpoint) => (
														<div
															key={endpoint}
															className="flex items-center gap-1.5 text-xs"
														>
															{healthScore.checks.apiCheckResults?.[
																endpoint
															] ? (
																<CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
															) : (
																<XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
															)}
															<span className="truncate">{endpoint}</span>
														</div>
													))}
												</div>
											</div>
										</div>
										<div className="pt-2 border-t">
											<div className="text-xs text-muted-foreground mb-1.5">
												Issues ({healthScore.issues.length})
											</div>
											{healthScore.issues.length > 0 ? (
												<ul className="space-y-1">
													{healthScore.issues.map((issue, index) => (
														<li
															key={index}
															className="text-sm text-muted-foreground"
														>
															• {issue}
														</li>
													))}
												</ul>
											) : (
												<div className="text-sm text-green-600">No issues</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* 链接详情 */}
					{configV3Data && (
						<Card className="mb-4 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
							<CardHeader>
								<CardTitle className="text-sm flex items-center gap-2">
									<Link className="h-4 w-4 text-blue-600" />
									链接详情
								</CardTitle>
							</CardHeader>
							<CardContent className="px-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									{displayFields.map((field) => {
										const value = configV3Data[field];
										if (value === null || value === undefined || value === "") {
											return null;
										}

										let displayValue: ReactNode;

										// 特殊处理 language_json
										if (field === "language_json") {
											const languageJson = value as Record<string, unknown>;
											const languageCodes = Object.keys(languageJson);
											if (languageCodes.length === 0) {
												return null;
											}
											displayValue = languageCodes.join(", ");
										} else if (
											field === "theme_color" ||
											field === "background_color"
										) {
											displayValue = (
												<div className="flex items-center gap-2">
													<div
														className="w-6 h-6 rounded border"
														style={{ backgroundColor: String(value) }}
													/>
													<span className="font-mono text-xs">
														{String(value)}
													</span>
												</div>
											);
										} else if (
											field === "status" ||
											field === "package_status"
										) {
											const statusValue = Number(value);
											displayValue = (
												<Badge
													variant={statusValue > 0 ? "default" : "secondary"}
												>
													{String(value)}
												</Badge>
											);
										} else if (field === "package_link") {
											displayValue = (
												<a
													href={String(value)}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline break-all"
												>
													{String(value)}
												</a>
											);
										} else if (typeof value === "object") {
											// 对于其他对象类型，显示 JSON 字符串
											try {
												displayValue = JSON.stringify(value, null, 2);
											} catch {
												displayValue = String(value);
											}
										} else {
											displayValue = String(value);
										}

										return (
											<div key={field} className="space-y-1">
												<div className="text-muted-foreground text-xs">
													{fieldTranslations[field]}:
												</div>
												<div className="font-medium">
													{typeof displayValue === "string" &&
													displayValue.length > 100 ? (
														<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
															{displayValue}
														</pre>
													) : (
														displayValue
													)}
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* PWA Information */}
					{result.pwa && (
						<Card
							className={`mb-4 ${
								result.pwa.isInstallable
									? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
									: "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
							}`}
						>
							<CardHeader>
								<CardTitle className="text-sm flex items-center gap-2">
									<Smartphone
										className={`h-4 w-4 ${
											result.pwa.isInstallable
												? "text-green-600"
												: "text-yellow-600"
										}`}
									/>
									PWA
									<Badge
										className={`ml-2 text-xs ${
											result.pwa.isInstallable
												? "bg-green-600"
												: "bg-yellow-600"
										}`}
									>
										{result.pwa.isInstallable
											? "Installable"
											: "Not Installable"}
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="px-6 space-y-2">
								{/* Installability Errors */}
								{result.pwa.installabilityErrors &&
									result.pwa.installabilityErrors.length > 0 && (
										<div className="space-y-2 pb-3 border-b">
											<div className="font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
												<AlertTriangle className="h-4 w-4" />
												安装错误
											</div>
											<div className="space-y-1">
												{result.pwa.installabilityErrors.map((error, index) => (
													<div
														key={index}
														className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded"
													>
														• {error}
													</div>
												))}
											</div>
										</div>
									)}
								{result.pwa.serviceWorker && (
									<div className="space-y-2 pb-3 border-b">
										<div className="font-semibold flex items-center gap-2">
											<Code className="h-4 w-4" />
											Service Worker
										</div>
										<div className="text-sm space-y-1">
											<div className="flex items-center gap-2">
												<span className="text-muted-foreground">Status:</span>
												{result.pwa.serviceWorker.registered ? (
													<Badge className="bg-green-600">
														<CheckCircle2 className="h-3 w-3 mr-1" />
														Registered
													</Badge>
												) : (
													<Badge variant="destructive">
														<XCircle className="h-3 w-3 mr-1" />
														Not Registered
													</Badge>
												)}
											</div>
											{result.pwa.serviceWorker.scope && (
												<div>
													<span className="text-muted-foreground">Scope:</span>{" "}
													<span className="font-mono text-xs">
														{result.pwa.serviceWorker.scope}
													</span>
												</div>
											)}
										</div>
									</div>
								)}
								{result.pwa.manifest && (
									<div className="space-y-3">
										<div className="font-semibold flex items-center gap-2">
											<FileText className="h-4 w-4" />
											Manifest Information
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											{result.pwa.manifest.name && (
												<div>
													<span className="text-muted-foreground">Name:</span>{" "}
													<span className="font-medium">
														{result.pwa.manifest.name}
													</span>
												</div>
											)}
											{result.pwa.manifest.short_name && (
												<div>
													<span className="text-muted-foreground">
														Short Name:
													</span>{" "}
													<span className="font-medium">
														{result.pwa.manifest.short_name}
													</span>
												</div>
											)}
											{result.pwa.manifest.description && (
												<div className="md:col-span-2">
													<span className="text-muted-foreground">
														Description:
													</span>{" "}
													<span className="font-medium">
														{result.pwa.manifest.description}
													</span>
												</div>
											)}
											{result.pwa.manifest.start_url && (
												<div>
													<span className="text-muted-foreground">
														Start URL:
													</span>{" "}
													<span className="font-medium">
														{result.pwa.manifest.start_url}
													</span>
												</div>
											)}
											{result.pwa.manifest.display && (
												<div>
													<span className="text-muted-foreground">
														Display:
													</span>{" "}
													<span className="font-medium">
														{result.pwa.manifest.display}
													</span>
												</div>
											)}
											{result.pwa.manifest.theme_color && (
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground">
														Theme Color:
													</span>
													<div className="flex items-center gap-2">
														<div
															className="w-6 h-6 rounded border"
															style={{
																backgroundColor:
																	result.pwa.manifest.theme_color,
															}}
														/>
														<span className="font-mono text-xs">
															{result.pwa.manifest.theme_color}
														</span>
													</div>
												</div>
											)}
											{result.pwa.manifest.background_color && (
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground">
														Background Color:
													</span>
													<div className="flex items-center gap-2">
														<div
															className="w-6 h-6 rounded border"
															style={{
																backgroundColor:
																	result.pwa.manifest.background_color,
															}}
														/>
														<span className="font-mono text-xs">
															{result.pwa.manifest.background_color}
														</span>
													</div>
												</div>
											)}
										</div>
										{result.pwa.manifest.icons &&
											result.pwa.manifest.icons.length > 0 && (
												<div className="mt-3">
													<div className="text-sm text-muted-foreground mb-2">
														App Icons ({result.pwa.manifest.icons.length}):
													</div>
													<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
														{result.pwa.manifest.icons.map((icon, i) => {
															const iconUrl = resolveIconUrl(
																icon.src,
																result.url,
															);
															return (
																<div
																	key={i}
																	className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-background"
																>
																	<div className="relative w-16 h-16 flex items-center justify-center">
																		<img
																			src={iconUrl}
																			alt={`App icon ${icon.sizes}`}
																			className="max-w-full max-h-full object-contain rounded"
																			onError={(e) => {
																				if (typeof document === "undefined")
																					return;
																				const target =
																					e.target as HTMLImageElement;
																				target.style.display = "none";
																				const parent = target.parentElement;
																				if (parent) {
																					const fallback =
																						document.createElement("div");
																					fallback.className =
																						"w-16 h-16 flex items-center justify-center bg-muted rounded text-muted-foreground text-xs";
																					fallback.textContent = "No Preview";
																					parent.appendChild(fallback);
																				}
																			}}
																		/>
																	</div>
																	<div className="text-center">
																		<div className="text-xs font-medium">
																			{icon.sizes}
																		</div>
																		<div className="text-xs text-muted-foreground">
																			{icon.type}
																		</div>
																		{icon.purpose && (
																			<Badge
																				variant="outline"
																				className="text-xs mt-1"
																			>
																				{icon.purpose}
																			</Badge>
																		)}
																	</div>
																</div>
															);
														})}
													</div>
												</div>
											)}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Console Logs */}
					{result.console &&
						(result.console.errorCount > 0 ||
							result.console.warningCount > 0) && (
							<Card className="mb-4 border-red-500/100 bg-red-50/20 dark:bg-red-950/20">
								<CardHeader>
									<CardTitle className="text-sm flex items-center gap-2">
										<Code className="h-4 w-4" />
										Console
										{result.console.errorCount > 0 && (
											<Badge variant="destructive" className="ml-2 text-xs">
												{result.console.errorCount} Errors
											</Badge>
										)}
										{result.console.warningCount > 0 && (
											<Badge variant="outline" className="ml-2 text-xs">
												{result.console.warningCount} Warnings
											</Badge>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="px-6 space-y-2">
									{/* Errors */}
									{result.console.errors.length > 0 && (
										<div className="space-y-1">
											<div className="font-semibold text-xs flex items-center gap-1 text-destructive">
												<XCircle className="h-3 w-3" />
												Errors ({result.console.errors.length})
											</div>
											<div className="space-y-1 max-h-48 overflow-y-auto">
												{result.console.errors.map((error, index) => (
													<div
														key={index}
														className="p-2 bg-destructive/10 rounded text-xs border border-destructive/20"
													>
														<div className="font-mono text-xs break-all">
															{error.message}
														</div>
														{error.source && (
															<div className="text-xs text-muted-foreground mt-0.5">
																{error.source}
																{error.lineNumber && `:${error.lineNumber}`}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Warnings */}
									{result.console.warnings.length > 0 && (
										<div className="space-y-1">
											<div className="font-semibold text-xs flex items-center gap-1 text-yellow-600">
												<AlertTriangle className="h-3 w-3" />
												Warnings ({result.console.warnings.length})
											</div>
											<div className="space-y-1 max-h-48 overflow-y-auto">
												{result.console.warnings.map((warning, index) => (
													<div
														key={index}
														className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-xs border border-yellow-200 dark:border-yellow-900"
													>
														<div className="font-mono text-xs break-all">
															{warning.message}
														</div>
														{warning.source && (
															<div className="text-xs text-muted-foreground mt-0.5">
																{warning.source}
																{warning.lineNumber && `:${warning.lineNumber}`}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

					{/* Failed Requests Chart */}
					{result.failedRequests > 0 && (
						<Card className="mb-4">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm flex items-center gap-2">
									<AlertTriangle className="h-4 w-4 text-destructive" />
									Failed Requests
								</CardTitle>
							</CardHeader>
							<CardContent className="p-2">
								<ResponsiveContainer width="100%" height={200}>
									<BarChart
										data={resourceTypeStats.filter(
											(stat) => stat.failedCount > 0,
										)}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="failedCount"
											fill="#ef4444"
											name="Failed Requests"
										/>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					)}

					{/* Resources Table */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm flex items-center justify-between">
								<span>Resources</span>
								<div className="flex gap-2">
									<select
										className="text-sm border rounded px-2 py-1"
										value={filterType}
										onChange={(e) =>
											setFilterType(e.target.value as ResourceType | "all")
										}
									>
										<option value="all">All Types</option>
										{Object.keys(RESOURCE_TYPE_COLORS).map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("type")}
											>
												Type{" "}
												{sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th className="text-left p-2">URL</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("method")}
											>
												Method{" "}
												{sortBy === "method" &&
													(sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("status")}
											>
												Status{" "}
												{sortBy === "status" &&
													(sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("size")}
											>
												Size{" "}
												{sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("time")}
											>
												Time{" "}
												{sortBy === "time" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th className="text-left p-2">Response</th>
										</tr>
									</thead>
									<tbody>
										{getSortedAndFilteredResources().map((resource, index) => (
											<>
												<tr key={index} className="border-b hover:bg-muted/50">
													<td className="p-2">
														<Badge
															style={{
																backgroundColor:
																	RESOURCE_TYPE_COLORS[resource.type],
															}}
														>
															{resource.type}
														</Badge>
													</td>
													<td
														className="p-2 max-w-md truncate"
														title={resource.url}
													>
														{resource.url}
													</td>
													<td className="p-2">{resource.method}</td>
													<td className="p-2">
														<Badge
															variant={
																resource.status &&
																resource.status >= 200 &&
																resource.status < 300
																	? "default"
																	: "destructive"
															}
														>
															{resource.status || "N/A"}
														</Badge>
													</td>
													<td className="p-2">{formatBytes(resource.size)}</td>
													<td className="p-2">{formatTime(resource.time)}</td>
													<td className="p-2">
														{resource.response ? (
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	setExpandedRow(
																		expandedRow === index ? null : index,
																	)
																}
															>
																<Eye className="w-4 h-4" />
															</Button>
														) : (
															<span className="text-muted-foreground">-</span>
														)}
													</td>
												</tr>
												{expandedRow === index && resource.response && (
													<tr key={`${index}-detail`} className="bg-muted/30">
														<td colSpan={7} className="p-4">
															<div className="space-y-2">
																<div className="font-semibold text-sm">
																	Response Data:
																</div>
																<pre className="bg-background p-3 rounded-md text-xs overflow-x-auto max-h-96 border">
																	{JSON.stringify(resource.response, null, 2)}
																</pre>
															</div>
														</td>
													</tr>
												)}
											</>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
