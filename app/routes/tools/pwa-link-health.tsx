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
	Info,
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
import type {
	ResourceInfo,
	ResourceType,
	WebsiteCheckResult,
} from "~/types/website-check";
import type { ConfigV3Data, ConfigV3Response } from "~/types/pwa-link-health";
import {
	displayFields,
	fieldTranslations,
	filterBusinessImpactErrors,
	nestedFieldTranslations,
	packageTypeMap,
	preLoadMap,
	packageStatusMap,
	pixelTypeMap,
	importantFields,
	API_ENDPOINT,
	RESOURCE_TYPE_COLORS,
} from "~/lib/pwa-link-health";
import {
	appendTokenToUrl,
	DEFAULT_PARAM_NAME,
	DEFAULT_VALIDITY_MINUTES,
	generateWhitelistToken,
	SECRET_KEY,
} from "~/lib/whitelist-token";

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
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<WebsiteCheckResult | null>(null);
	const [sortBy, setSortBy] = useState<keyof ResourceInfo>("startTime");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [filterType, setFilterType] = useState<ResourceType | "all">("all");
	const [expandedRow, setExpandedRow] = useState<number | null>(null);
	const [linkInfoExpanded, setLinkInfoExpanded] = useState(false);
	const [installPageResult, setInstallPageResult] =
		useState<WebsiteCheckResult | null>(null);

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
	const calculateHealthScore = (
		data: WebsiteCheckResult,
		installPageResult: WebsiteCheckResult | null,
	) => {
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
		const allConsoleErrors = data.console?.errors ?? [];
		const filteredConsoleErrors = filterBusinessImpactErrors(allConsoleErrors);
		const consoleErrorCount = filteredConsoleErrors.length;
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

		// 6. 安装页可访问性检查（-10 分）
		const installPageStatus = installPageResult?.status;
		const isInstallPageAccessible =
			installPageStatus !== undefined &&
			installPageStatus >= 200 &&
			installPageStatus < 300;
		if (installPageResult && !isInstallPageAccessible) {
			score -= 10;
			issues.push(`安装页不可访问: 状态码 ${installPageStatus ?? "N/A"}`);
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
				isInstallPageAccessible: installPageResult
					? isInstallPageAccessible
					: true,
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
		setError(null);
		setResult(null);
		setInstallPageResult(null);

		// 生成 whitelist token 并追加到 URL
		let urlWithToken = url;
		let token: string | null = null;
		try {
			token = await generateWhitelistToken(
				SECRET_KEY,
				DEFAULT_VALIDITY_MINUTES,
			);
			urlWithToken = appendTokenToUrl(url, token, DEFAULT_PARAM_NAME);
		} catch (error) {
			console.warn(
				"Failed to generate whitelist token, using original URL:",
				error,
			);
			// 如果生成 token 失败，使用原始 URL
			urlWithToken = url;
		}

		// 构建安装页 URL 兼容appid和domain
		const getInstallPageUrl = (originalUrl: string): string => {
			try {
				const urlObj = new URL(originalUrl);
				const pathParts = urlObj.pathname.split("/").filter(Boolean);
				let installPageBaseUrl: string;
				if (pathParts.length > 0) {
					const appId = pathParts[0];
					installPageBaseUrl = `${urlObj.protocol}//${urlObj.host}/${appId}/index.html`;
				} else {
					installPageBaseUrl = `${urlObj.protocol}//${urlObj.host}/index.html`;
				}
				// 如果有 token，也添加到安装页 URL
				if (token) {
					return appendTokenToUrl(
						installPageBaseUrl,
						token,
						DEFAULT_PARAM_NAME,
					);
				}
				return installPageBaseUrl;
			} catch {
				return "";
			}
		};

		const installPageUrl = getInstallPageUrl(url);

		try {
			const response = await fetch(API_ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url: urlWithToken,
					timeout: 30000,
					device: "mobile",
				}),
			});

			if (!response.ok) {
				const errorData: any = await response.json().catch(() => ({}));
				throw new Error(
					errorData?.message ||
						errorData?.error ||
						`Failed to analyze: ${response.statusText}`,
				);
			}

			const data: WebsiteCheckResult = await response.json();
			setResult(data);

			// 检查安装页
			if (installPageUrl) {
				try {
					const installPageCheckResponse = await fetch(API_ENDPOINT, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							url: installPageUrl,
							timeout: 10000,
							device: "mobile",
						}),
					});

					if (installPageCheckResponse.ok) {
						const installPageData: WebsiteCheckResult =
							await installPageCheckResponse.json();
						setInstallPageResult(installPageData);
					} else {
						setInstallPageResult(null);
					}
				} catch {
					setInstallPageResult(null);
				}
			} else {
				setInstallPageResult(null);
			}
		} catch (err) {
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
		() => (result ? calculateHealthScore(result, installPageResult) : null),
		[result, installPageResult],
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

	// 渲染字段的辅助函数
	const renderField = (field: string, isPrimary: boolean) => {
		if (!configV3Data) return null;

		// 处理嵌套字段路径（如 "linkInfo.is_pixel_report"）
		let value: unknown;
		let fieldLabel: string;
		let actualField: string;

		if (field.includes(".")) {
			// 嵌套字段
			const parts = field.split(".");
			let current: any = configV3Data;
			for (const part of parts) {
				if (current && typeof current === "object" && part in current) {
					current = current[part];
				} else {
					current = undefined;
					break;
				}
			}
			value = current;
			fieldLabel = nestedFieldTranslations[field] || field;
			actualField = field;
		} else {
			// 普通字段
			value = configV3Data?.[field as keyof ConfigV3Data];
			fieldLabel = fieldTranslations[field as keyof ConfigV3Data];
			actualField = field;
		}

		if (value === null || value === undefined || value === "") {
			return null;
		}

		let displayValue: ReactNode;

		// 特殊处理 language_json
		if (actualField === "language_json") {
			const languageJson = value as Record<string, unknown>;
			const languageCodes = Object.keys(languageJson);
			if (languageCodes.length === 0) {
				return null;
			}
			displayValue = languageCodes.join(", ");
		} else if (
			actualField === "theme_color" ||
			actualField === "background_color"
		) {
			displayValue = (
				<div className="flex items-center gap-2">
					<div
						className="w-6 h-6 rounded border"
						style={{ backgroundColor: String(value) }}
					/>
					<span className="font-mono text-xs">{String(value)}</span>
				</div>
			);
		} else if (actualField === "package_status") {
			const packageStatusValue = Number(value);
			const packageStatusText =
				packageStatusMap[packageStatusValue] || String(packageStatusValue);
			displayValue = <span>{packageStatusText}</span>;
		} else if (actualField === "package_link") {
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
		} else if (actualField === "package_type") {
			const packageTypeValue = Number(value);
			const packageTypeText =
				packageTypeMap[packageTypeValue] || String(packageTypeValue);
			displayValue = <span>{packageTypeText}</span>;
		} else if (actualField === "pre_load") {
			const preLoadValue = Number(value);
			const preLoadText = preLoadMap[preLoadValue] || String(preLoadValue);
			displayValue = <span>{preLoadText}</span>;
		} else if (actualField === "linkInfo.is_pixel_report") {
			// 特殊处理 is_pixel_report: "0" = 否, "1" = 是
			const pixelReportValue = String(value);
			displayValue = <span>{pixelReportValue === "1" ? "是" : "否"}</span>;
		} else if (actualField === "linkInfo.rb_pixel_type") {
			const pixelTypeValue = Number(value);
			const pixelTypeText =
				pixelTypeMap[pixelTypeValue] || String(pixelTypeValue);
			displayValue = <span>{pixelTypeText}</span>;
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

		// 特殊处理 linkInfo - 使用折叠显示（只处理完整的 linkInfo 对象，不处理嵌套字段）
		if (actualField === "linkInfo" && !actualField.includes(".")) {
			return (
				<div key={field} className="md:col-span-2 lg:col-span-3 min-w-0 w-full">
					<div className="flex items-center gap-1.5 py-0.5 min-w-0 w-full">
						<div
							className={`text-xs flex-shrink-0 ${
								isPrimary
									? "font-semibold text-foreground"
									: "text-muted-foreground"
							}`}
						>
							{fieldLabel}:
						</div>
						<div
							className={`text-xs flex-1 min-w-0 break-words ${
								isPrimary ? "font-semibold text-foreground" : "font-medium"
							}`}
						>
							{linkInfoExpanded ? (
								<div className="space-y-1">
									<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64 border">
										{JSON.stringify(value, null, 2)}
									</pre>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setLinkInfoExpanded(false)}
										className="text-xs h-6"
									>
										收起
									</Button>
								</div>
							) : (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setLinkInfoExpanded(true)}
									className={`text-xs h-6 ${
										isPrimary ? "text-foreground" : "text-muted-foreground"
									}`}
								>
									<Eye className="w-3 h-3 mr-1" />
									点击查看详情
								</Button>
							)}
						</div>
					</div>
				</div>
			);
		}

		return (
			<div
				key={actualField}
				className="flex items-start gap-1.5 py-0.5 min-w-0 w-full"
			>
				<div
					className={`text-xs flex-shrink-0 ${
						isPrimary
							? "font-semibold text-foreground"
							: "text-muted-foreground"
					}`}
				>
					{fieldLabel}:
				</div>
				<div
					className={`text-xs flex-1 min-w-0 break-words break-all ${
						isPrimary ? "font-semibold text-foreground" : "font-medium"
					}`}
				>
					{typeof displayValue === "string" && displayValue.length > 100 ? (
						<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32 border">
							{displayValue}
						</pre>
					) : (
						displayValue
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-2">
			<div className="mb-4">
				<h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
					<Heart className="w-8 h-8" />
					RoiBest Link Health Check
				</h1>
				<p className="text-muted-foreground">
					分析 RoiBest 链接健康状态、业务信息和性能
				</p>
			</div>

			{/* Search Form */}
			<Card className="mb-4">
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
										<Loader2 className="w-4 h-4 mr-1 animate-spin" />
										<span>Analyzing...</span>
									</>
								) : (
									<span>Analyze</span>
								)}
							</Button>
						</div>
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
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-4">
						{/* Screenshot - Left */}
						{result.screenshot && (
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">页面截图</CardTitle>
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
							className={`${result.screenshot ? "lg:col-span-4" : "lg:col-span-5"} min-w-0`}
						>
							<CardContent className="p-4 min-w-0 overflow-hidden">
								<div className="space-y-4">
									{/* 健康分 */}
									{healthScore && (
										<div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
											<div className="flex items-center gap-2">
												<Heart className="h-4 w-4" />
												<span className="text-xs font-medium">健康分</span>
											</div>
											<div
												className={`text-sm font-bold ${getHealthScoreColor(
													healthScore.score,
												)}`}
											>
												{healthScore.score}
											</div>
										</div>
									)}

									{/* 链接详情 */}
									{configV3Data && (
										<div className="space-y-3">
											<div className="text-sm font-semibold mb-2 flex items-center gap-2">
												<Link className="h-4 w-4" />
												链接详情
											</div>

											{/* 重要信息 */}
											<div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 p-3">
												<div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
													重要信息
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
													{displayFields
														.filter((field) => {
															const actualField = field.includes(".")
																? field
																: field;
															return importantFields.includes(actualField);
														})
														.map((field) => renderField(field, true))
														.filter(Boolean)}
												</div>
											</div>

											{/* 次要信息 */}
											<div>
												<div className="text-xs text-muted-foreground mb-2">
													其他信息
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
													{displayFields
														.filter((field) => {
															const actualField = field.includes(".")
																? field
																: field;
															return !importantFields.includes(actualField);
														})
														.map((field) => renderField(field, false))
														.filter(Boolean)}
												</div>
											</div>
										</div>
									)}

									{/* Quick Stats */}
									<div className="space-y-2 pt-2 border-t">
										<div className="text-sm font-semibold mb-2 flex items-center gap-2">
											<Info className="h-4 w-4" />
											页面信息/性能指标
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
											<div className="flex items-start gap-1.5 py-0.5">
												<span className="text-muted-foreground text-xs flex-shrink-0">
													Status:
												</span>
												<div className="text-xs flex-1 break-words">
													<Badge
														variant={
															result.status >= 200 && result.status < 300
																? "default"
																: "destructive"
														}
														className="text-xs"
													>
														{result.status}
													</Badge>
												</div>
											</div>
											<div className="flex items-start gap-1.5 py-0.5">
												<span className="text-muted-foreground text-xs flex-shrink-0">
													Load:
												</span>
												<span className="font-medium text-xs flex-1 break-words">
													{formatTime(result.loadTime)}
												</span>
											</div>
											<div className="flex items-start gap-1.5 py-0.5">
												<span className="text-muted-foreground text-xs flex-shrink-0">
													Requests:
												</span>
												<span className="font-medium text-xs flex-1 break-words">
													{result.totalRequests}
													{result.failedRequests > 0 && (
														<span className="text-destructive ml-1">
															({result.failedRequests})
														</span>
													)}
												</span>
											</div>
											<div className="flex items-start gap-1.5 py-0.5">
												<span className="text-muted-foreground text-xs flex-shrink-0">
													Size:
												</span>
												<span className="font-medium text-xs flex-1 break-words">
													{formatBytes(result.totalSize)}
												</span>
											</div>
											{result.meta?.appVersion && (
												<div className="flex items-start gap-1.5 py-0.5">
													<span className="text-muted-foreground text-xs flex-shrink-0">
														App Version:
													</span>
													<span className="font-medium font-mono text-xs flex-1 break-words">
														{formatAppVersion(result.meta.appVersion)}
													</span>
												</div>
											)}
											{result.performance && (
												<>
													{result.performance.fcp !== undefined && (
														<div className="flex items-start gap-1.5 py-0.5">
															<span className="text-muted-foreground text-xs flex-shrink-0">
																FCP:
															</span>
															<span className="font-medium text-xs flex-1 break-words">
																{formatTime(result.performance.fcp)}
															</span>
														</div>
													)}
													{result.performance.lcp !== undefined && (
														<div className="flex items-start gap-1.5 py-0.5">
															<span className="text-muted-foreground text-xs flex-shrink-0">
																LCP:
															</span>
															<span className="font-medium text-xs flex-1 break-words">
																{formatTime(result.performance.lcp)}
															</span>
														</div>
													)}
													{result.performance.domContentLoaded !==
														undefined && (
														<div className="flex items-start gap-1.5 py-0.5">
															<span className="text-muted-foreground text-xs flex-shrink-0">
																DCL:
															</span>
															<span className="font-medium text-xs flex-1 break-words">
																{formatTime(
																	result.performance.domContentLoaded,
																)}
															</span>
														</div>
													)}
													{result.performance.loadEvent !== undefined && (
														<div className="flex items-start gap-1.5 py-0.5">
															<span className="text-muted-foreground text-xs flex-shrink-0">
																Load:
															</span>
															<span className="font-medium text-xs flex-1 break-words">
																{formatTime(result.performance.loadEvent)}
															</span>
														</div>
													)}
												</>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* 安装页检查 */}
					{(loading || installPageResult) && (
						<Card className="mb-4 border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20">
							<CardHeader>
								<CardTitle className="text-sm flex items-center gap-2">
									<Smartphone className="h-4 w-4 text-purple-600" />
									安装页检查
								</CardTitle>
							</CardHeader>
							<CardContent className="px-6 py-4">
								{installPageResult ? (
									<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
										{installPageResult.screenshot && (
											<div className="lg:col-span-1">
												<div className="rounded border overflow-hidden bg-white">
													<img
														src={`data:image/png;base64,${installPageResult.screenshot}`}
														alt="安装页截图"
														className="w-full h-auto"
													/>
												</div>
											</div>
										)}

										<div
											className={`${
												installPageResult.screenshot
													? "lg:col-span-4"
													: "lg:col-span-5"
											} space-y-4`}
										>
											{/* 页面信息 */}
											<div className="space-y-2">
												<div className="text-sm font-semibold mb-2 flex items-center gap-2">
													<Info className="h-4 w-4" />
													页面信息
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
													<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full md:col-span-2 lg:col-span-3">
														<span className="text-muted-foreground text-xs flex-shrink-0">
															URL:
														</span>
														<span className="font-medium text-xs flex-1 break-words min-w-0 break-all">
															{installPageResult.url}
														</span>
													</div>
													<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
														<span className="text-muted-foreground text-xs flex-shrink-0">
															Status:
														</span>
														<div className="text-xs flex-1 break-words min-w-0">
															<Badge
																variant={
																	installPageResult.status >= 200 &&
																	installPageResult.status < 300
																		? "default"
																		: "destructive"
																}
																className="text-xs"
															>
																{installPageResult.status}
															</Badge>
														</div>
													</div>
													<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
														<span className="text-muted-foreground text-xs flex-shrink-0">
															Load:
														</span>
														<span className="font-medium text-xs flex-1 break-words min-w-0">
															{formatTime(installPageResult.loadTime)}
														</span>
													</div>
													<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
														<span className="text-muted-foreground text-xs flex-shrink-0">
															Requests:
														</span>
														<span className="font-medium text-xs flex-1 break-words min-w-0">
															{installPageResult.totalRequests}
															{installPageResult.failedRequests > 0 && (
																<span className="text-destructive ml-1">
																	({installPageResult.failedRequests})
																</span>
															)}
														</span>
													</div>
													<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
														<span className="text-muted-foreground text-xs flex-shrink-0">
															Size:
														</span>
														<span className="font-medium text-xs flex-1 break-words min-w-0">
															{formatBytes(installPageResult.totalSize)}
														</span>
													</div>
													{installPageResult.performance && (
														<>
															{installPageResult.performance.fcp !==
																undefined && (
																<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
																	<span className="text-muted-foreground text-xs flex-shrink-0">
																		FCP:
																	</span>
																	<span className="font-medium text-xs flex-1 break-words min-w-0">
																		{formatTime(
																			installPageResult.performance.fcp,
																		)}
																	</span>
																</div>
															)}
															{installPageResult.performance.lcp !==
																undefined && (
																<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
																	<span className="text-muted-foreground text-xs flex-shrink-0">
																		LCP:
																	</span>
																	<span className="font-medium text-xs flex-1 break-words min-w-0">
																		{formatTime(
																			installPageResult.performance.lcp,
																		)}
																	</span>
																</div>
															)}
															{installPageResult.performance
																.domContentLoaded !== undefined && (
																<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
																	<span className="text-muted-foreground text-xs flex-shrink-0">
																		DCL:
																	</span>
																	<span className="font-medium text-xs flex-1 break-words min-w-0">
																		{formatTime(
																			installPageResult.performance
																				.domContentLoaded,
																		)}
																	</span>
																</div>
															)}
															{installPageResult.performance.loadEvent !==
																undefined && (
																<div className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
																	<span className="text-muted-foreground text-xs flex-shrink-0">
																		Load:
																	</span>
																	<span className="font-medium text-xs flex-1 break-words min-w-0">
																		{formatTime(
																			installPageResult.performance.loadEvent,
																		)}
																	</span>
																</div>
															)}
														</>
													)}
												</div>
											</div>

											{/* 请求统计 */}
											<div className="space-y-2">
												<div className="text-sm font-semibold mb-2 flex items-center gap-2">
													<FileText className="h-4 w-4" />
													请求统计
												</div>
												{installPageResult.resourceStats && (
													<div className="space-y-3">
														{installPageResult.resourceStats.map((stat) => {
															const successCount =
																stat.count - stat.failedCount;
															return (
																<div
																	key={stat.type}
																	className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
																>
																	<div className="flex items-center gap-2">
																		<div
																			className="w-3 h-3 rounded"
																			style={{
																				backgroundColor:
																					RESOURCE_TYPE_COLORS[stat.type],
																			}}
																		/>
																		<span className="text-xs font-medium capitalize">
																			{stat.type}
																		</span>
																	</div>
																	<div className="flex items-center gap-3 text-xs">
																		<span className="text-muted-foreground">
																			总计: {stat.count}
																		</span>
																		<span className="text-green-600">
																			成功: {successCount}
																		</span>
																		{stat.failedCount > 0 && (
																			<span className="text-destructive">
																				失败: {stat.failedCount}
																			</span>
																		)}
																	</div>
																</div>
															);
														})}
													</div>
												)}
											</div>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										正在检查安装页...
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Health Checks & Issues */}
					<Card className="mb-4 border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20">
						<CardHeader>
							<CardTitle className="text-sm flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-orange-600" />
								健康检查与问题
							</CardTitle>
						</CardHeader>
						<CardContent className="px-6">
							<div className="space-y-4">
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
													{healthScore.checks.apiCheckResults?.[endpoint] ? (
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
						</CardContent>
					</Card>

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
									<div className="space-y-2">
										<div className="font-semibold flex items-center gap-2 text-sm">
											<FileText className="h-3.5 w-3.5" />
											Manifest Information
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
											{result.pwa.manifest.name && (
												<div className="flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Name:
													</span>
													<span className="font-medium break-words">
														{result.pwa.manifest.name}
													</span>
												</div>
											)}
											{result.pwa.manifest.short_name && (
												<div className="flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Short Name:
													</span>
													<span className="font-medium break-words">
														{result.pwa.manifest.short_name}
													</span>
												</div>
											)}
											{result.pwa.manifest.description && (
												<div className="md:col-span-2 flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Description:
													</span>
													<span className="font-medium break-words">
														{result.pwa.manifest.description}
													</span>
												</div>
											)}
											{(result.pwa.manifestRaw?.default_lang as string) && (
												<div className="flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Default Lang:
													</span>
													<span className="font-medium">
														{result.pwa.manifestRaw?.default_lang as string}
													</span>
												</div>
											)}
											{result.pwa.manifest.start_url && (
												<div className="md:col-span-2 flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Start URL:
													</span>
													<span className="font-medium font-mono break-all">
														{result.pwa.manifest.start_url}
													</span>
												</div>
											)}
											{result.pwa.manifest.display && (
												<div className="flex items-start gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Display:
													</span>
													<span className="font-medium">
														{result.pwa.manifest.display}
													</span>
												</div>
											)}
											{result.pwa.manifest.theme_color && (
												<div className="flex items-center gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Theme Color:
													</span>
													<div className="flex items-center gap-1.5">
														<div
															className="w-4 h-4 rounded border flex-shrink-0"
															style={{
																backgroundColor:
																	result.pwa.manifest.theme_color,
															}}
														/>
														<span className="font-mono">
															{result.pwa.manifest.theme_color}
														</span>
													</div>
												</div>
											)}
											{result.pwa.manifest.background_color && (
												<div className="flex items-center gap-1.5">
													<span className="text-muted-foreground flex-shrink-0">
														Background Color:
													</span>
													<div className="flex items-center gap-1.5">
														<div
															className="w-4 h-4 rounded border flex-shrink-0"
															style={{
																backgroundColor:
																	result.pwa.manifest.background_color,
															}}
														/>
														<span className="font-mono">
															{result.pwa.manifest.background_color}
														</span>
													</div>
												</div>
											)}
										</div>
										{result.pwa.manifest.icons &&
											result.pwa.manifest.icons.length > 0 && (
												<div className="mt-2 pt-2 border-t">
													<div className="text-xs text-muted-foreground mb-1.5">
														App Icons ({result.pwa.manifest.icons.length}):
													</div>
													<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
														{result.pwa.manifest.icons.map((icon, i) => {
															const iconUrl = resolveIconUrl(
																icon.src,
																result.url,
															);
															return (
																<div
																	key={i}
																	className="flex flex-col items-center gap-1 p-2 border rounded bg-background"
																>
																	<div className="relative w-12 h-12 flex items-center justify-center">
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
																						"w-12 h-12 flex items-center justify-center bg-muted rounded text-muted-foreground text-[10px]";
																					fallback.textContent = "No Preview";
																					parent.appendChild(fallback);
																				}
																			}}
																		/>
																	</div>
																	<div className="text-center w-full">
																		<div className="text-[10px] font-medium truncate">
																			{icon.sizes}
																		</div>
																		<div className="text-[10px] text-muted-foreground truncate">
																			{icon.type}
																		</div>
																		{icon.purpose && (
																			<Badge
																				variant="outline"
																				className="text-[10px] h-4 px-1 mt-0.5"
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
						(() => {
							const filteredErrors = filterBusinessImpactErrors(
								result.console.errors,
							);
							return (
								filteredErrors.length > 0 || result.console.warningCount > 0
							);
						})() && (
							<Card className="mb-4 border-red-500/100 bg-red-50/20 dark:bg-red-950/20">
								<CardHeader>
									<CardTitle className="text-sm flex items-center gap-2">
										<Code className="h-4 w-4" />
										Console
										{(() => {
											const filteredErrors = filterBusinessImpactErrors(
												result.console.errors,
											);
											return filteredErrors.length > 0 ? (
												<Badge variant="destructive" className="ml-2 text-xs">
													{filteredErrors.length} Errors
												</Badge>
											) : null;
										})()}
										{result.console.warningCount > 0 && (
											<Badge variant="outline" className="ml-2 text-xs">
												{result.console.warningCount} Warnings
											</Badge>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="px-6 space-y-2">
									{/* Errors */}
									{(() => {
										const filteredErrors = filterBusinessImpactErrors(
											result.console.errors,
										);
										return filteredErrors.length > 0 ? (
											<div className="space-y-1">
												<div className="font-semibold text-xs flex items-center gap-1 text-destructive">
													<XCircle className="h-3 w-3" />
													Errors ({filteredErrors.length})
												</div>
												<div className="space-y-1 max-h-48 overflow-y-auto">
													{filteredErrors.map((error, index) => (
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
										) : null;
									})()}

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
