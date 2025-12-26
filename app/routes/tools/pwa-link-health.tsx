import { AlertCircle, AlertTriangle, Heart, Loader2 } from "lucide-react";
import { useCallback, useMemo, useReducer } from "react";
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
import { ConfigFieldsCard } from "~/components/pwa-link-health/config-fields-card";
import { ConsoleLogsCard } from "~/components/pwa-link-health/console-logs-card";
import { HealthScoreCard } from "~/components/pwa-link-health/health-score-card";
import { InstallPageCard } from "~/components/pwa-link-health/install-page-card";
import { PageInfoCard } from "~/components/pwa-link-health/page-info-card";
import { PwaInfoCard } from "~/components/pwa-link-health/pwa-info-card";
import { ResourcesTable } from "~/components/pwa-link-health/resources-table";
import { ScreenshotCard } from "~/components/pwa-link-health/screenshot-card";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	REQUIRED_API_ENDPOINTS,
	useHealthScore,
} from "~/hooks/use-health-score";
import { formatAppVersion, formatBytes, formatTime } from "~/lib/format-utils";
import { API_ENDPOINT, RESOURCE_TYPE_COLORS } from "~/lib/pwa-link-health";
import {
	appendTokenToUrl,
	DEFAULT_PARAM_NAME,
	DEFAULT_VALIDITY_MINUTES,
	generateWhitelistToken,
	SECRET_KEY,
} from "~/lib/whitelist-token";
import type { ConfigV3Data, ConfigV3Response } from "~/types/pwa-link-health";
import type { WebsiteCheckResult } from "~/types/website-check";

// 常量配置
const TIMEOUTS = {
	MAIN_CHECK: 30000,
	INSTALL_PAGE: 10000,
	UI_DELAY: 300,
} as const;

const TIMER_INTERVAL = 1000;

// 状态类型定义
interface AnalysisState {
	url: string;
	loading: boolean;
	error: string | null;
	result: WebsiteCheckResult | null;
	installPageResult: WebsiteCheckResult | null;
	elapsedTime: number;
}

type AnalysisAction =
	| { type: "SET_URL"; payload: string }
	| { type: "START_ANALYSIS" }
	| { type: "SET_ERROR"; payload: string }
	| { type: "SET_RESULT"; payload: WebsiteCheckResult }
	| { type: "SET_INSTALL_PAGE_RESULT"; payload: WebsiteCheckResult | null }
	| { type: "INCREMENT_TIME" }
	| { type: "FINISH_ANALYSIS" }
	| { type: "RESET" };

// Reducer 函数
function analysisReducer(
	state: AnalysisState,
	action: AnalysisAction,
): AnalysisState {
	switch (action.type) {
		case "SET_URL":
			return { ...state, url: action.payload };
		case "START_ANALYSIS":
			return {
				...state,
				loading: true,
				error: null,
				result: null,
				installPageResult: null,
				elapsedTime: 0,
			};
		case "SET_ERROR":
			return { ...state, error: action.payload, loading: false };
		case "SET_RESULT":
			return { ...state, result: action.payload };
		case "SET_INSTALL_PAGE_RESULT":
			return { ...state, installPageResult: action.payload };
		case "INCREMENT_TIME":
			return { ...state, elapsedTime: state.elapsedTime + 1 };
		case "FINISH_ANALYSIS":
			return { ...state, loading: false };
		case "RESET":
			return {
				...state,
				loading: false,
				error: null,
				result: null,
				installPageResult: null,
				elapsedTime: 0,
			};
		default:
			return state;
	}
}

// 辅助函数：为 URL 添加 token
async function addTokenToUrl(url: string): Promise<string> {
	try {
		const token = await generateWhitelistToken(
			SECRET_KEY,
			DEFAULT_VALIDITY_MINUTES,
		);
		return appendTokenToUrl(url, token, DEFAULT_PARAM_NAME);
	} catch (error) {
		console.warn("Failed to generate whitelist token:", error);
		return url;
	}
}

// 辅助函数：构建安装页 URL
function buildInstallPageUrl(originalUrl: string, token?: string): string {
	try {
		const urlObj = new URL(originalUrl);
		const pathParts = urlObj.pathname.split("/").filter(Boolean);

		const installPagePath =
			pathParts.length > 0 ? `/${pathParts[0]}/index.html` : "/index.html";
		const installPageBaseUrl = `${urlObj.protocol}//${urlObj.host}${installPagePath}`;

		return token
			? appendTokenToUrl(installPageBaseUrl, token, DEFAULT_PARAM_NAME)
			: installPageBaseUrl;
	} catch {
		return "";
	}
}

// 辅助函数：统一的网站检查 API 调用
async function fetchWebsiteCheck(
	url: string,
	timeout: number,
): Promise<WebsiteCheckResult | null> {
	try {
		const response = await fetch(API_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				url,
				timeout,
				device: "mobile",
			}),
		});

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({}))) as Record<
				string,
				unknown
			>;
			const errorMessage =
				(errorData?.message as string) ||
				(errorData?.error as string) ||
				`Request failed: ${response.statusText}`;
			throw new Error(errorMessage);
		}

		return await response.json();
	} catch (error) {
		if (timeout === TIMEOUTS.INSTALL_PAGE) {
			// 安装页检查失败不抛出错误
			return null;
		}
		throw error;
	}
}

// 辅助函数：提取 ConfigV3 数据
function extractConfigV3Data(
	result: WebsiteCheckResult | null,
): ConfigV3Data | null {
	if (!result) return null;

	const configV3Resource = result.resources.find((r) =>
		r.url.includes("/init/configV3"),
	);
	if (!configV3Resource?.response) return null;

	try {
		const response = configV3Resource.response as
			| ConfigV3Response
			| ConfigV3Data;
		return "data" in response && response.data
			? response.data
			: "app_name" in response
				? (response as ConfigV3Data)
				: null;
	} catch {
		return null;
	}
}

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
	const [state, dispatch] = useReducer(analysisReducer, {
		url: "",
		loading: false,
		error: null,
		result: null,
		installPageResult: null,
		elapsedTime: 0,
	});

	const handleAnalyze = useCallback(async () => {
		if (!state.url.trim()) {
			dispatch({ type: "SET_ERROR", payload: "Please enter a valid URL" });
			return;
		}

		dispatch({ type: "START_ANALYSIS" });

		// 启动计时器
		const timerId = setInterval(() => {
			dispatch({ type: "INCREMENT_TIME" });
		}, TIMER_INTERVAL);

		try {
			// 生成带 token 的 URL
			const urlWithToken = await addTokenToUrl(state.url);

			// 提取 token 用于构建安装页 URL
			const token = urlWithToken.includes(DEFAULT_PARAM_NAME)
				? new URL(urlWithToken).searchParams.get(DEFAULT_PARAM_NAME)
				: undefined;
			const installPageUrl = buildInstallPageUrl(state.url, token || undefined);

			// 并行请求主页和安装页
			const [mainResult, installResult] = await Promise.all([
				fetchWebsiteCheck(urlWithToken, TIMEOUTS.MAIN_CHECK),
				installPageUrl
					? fetchWebsiteCheck(installPageUrl, TIMEOUTS.INSTALL_PAGE)
					: Promise.resolve(null),
			]);

			if (!mainResult) {
				throw new Error("Failed to analyze the website");
			}

			dispatch({ type: "SET_RESULT", payload: mainResult });
			dispatch({ type: "SET_INSTALL_PAGE_RESULT", payload: installResult });
		} catch (err) {
			dispatch({
				type: "SET_ERROR",
				payload: err instanceof Error ? err.message : "Unknown error occurred",
			});
		} finally {
			clearInterval(timerId);
			setTimeout(
				() => dispatch({ type: "FINISH_ANALYSIS" }),
				TIMEOUTS.UI_DELAY,
			);
		}
	}, [state.url]);

	const resourceTypeStats = useMemo(
		() =>
			state.result?.resourceStats.map((stat) => ({
				name: stat.type,
				count: stat.count,
				size: stat.totalSize,
				failedCount: stat.failedCount,
				color:
					RESOURCE_TYPE_COLORS[stat.type as keyof typeof RESOURCE_TYPE_COLORS],
			})) || [],
		[state.result?.resourceStats],
	);

	const healthScore = useHealthScore(state.result, state.installPageResult);
	const configV3Data = useMemo(
		() => extractConfigV3Data(state.result),
		[state.result],
	);

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
								value={state.url}
								onChange={(e) =>
									dispatch({ type: "SET_URL", payload: e.target.value })
								}
								onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
								className="flex-1"
							/>
							<Button onClick={handleAnalyze} disabled={state.loading}>
								{state.loading ? (
									<>
										<Loader2 className="w-4 h-4 mr-1 animate-spin" />
										<span>Analyzing... {state.elapsedTime}s</span>
									</>
								) : (
									<span>Analyze</span>
								)}
							</Button>
						</div>
					</div>
					{state.error && (
						<div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
							<AlertCircle className="w-4 h-4" />
							{state.error}
						</div>
					)}
				</CardContent>
			</Card>

			{state.result && healthScore && (
				<>
					{/* Screenshot & Summary - Combined */}
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-4">
						{state.result.screenshot && (
							<ScreenshotCard screenshot={state.result.screenshot} />
						)}

						<Card
							className={`${state.result.screenshot ? "lg:col-span-4" : "lg:col-span-5"} min-w-0`}
						>
							<CardContent className="p-4 min-w-0 overflow-hidden">
								<div className="space-y-4">
									{/* 健康分 */}
									<div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
										<div className="flex items-center gap-2">
											<Heart className="h-4 w-4" />
											<span className="text-xs font-medium">健康分</span>
										</div>
										<div
											className={`text-sm font-bold ${
												healthScore.score >= 80
													? "text-green-600"
													: healthScore.score >= 60
														? "text-yellow-600"
														: "text-red-600"
											}`}
										>
											{healthScore.score}
										</div>
									</div>

									{/* 链接详情 */}
									{configV3Data && (
										<ConfigFieldsCard configV3Data={configV3Data} />
									)}

									{/* Quick Stats */}
									<PageInfoCard
										result={state.result}
										formatBytes={formatBytes}
										formatTime={formatTime}
										formatAppVersion={formatAppVersion}
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* 安装页检查 */}
					<InstallPageCard
						installPageResult={state.installPageResult}
						loading={state.loading}
						formatTime={formatTime}
						formatBytes={formatBytes}
					/>

					{/* Health Checks & Issues */}
					<HealthScoreCard
						healthScore={healthScore}
						requiredApiEndpoints={REQUIRED_API_ENDPOINTS}
					/>

					{/* PWA Information */}
					{state.result.pwa && (
						<PwaInfoCard pwa={state.result.pwa} url={state.result.url} />
					)}

					{/* Console Logs */}
					{state.result.console && (
						<ConsoleLogsCard console={state.result.console} />
					)}

					{/* Failed Requests Chart */}
					{state.result.failedRequests > 0 && (
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
					<ResourcesTable resources={state.result.resources} />
				</>
			)}
		</div>
	);
}
