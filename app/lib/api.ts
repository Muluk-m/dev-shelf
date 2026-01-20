import type { UploadFile } from "workers/routes/uploads";
import type {
	LinkConfig,
	LogQueryParams,
	LogQueryResponse,
	PreviewRequest,
	PreviewResult,
} from "~/types/ab-router";
import type {
	CfLogListRequest,
	CfLogListResponse,
	CfLogQueryRequest,
	CfLogQueryResponse,
} from "~/types/cf-logs";
import type { Tool, ToolCategory } from "~/types/tool";

export interface ToolUsageStat {
	toolId: string;
	name: string;
	category: string;
	usageCount: number;
	lastUsed: string | null;
	status: Tool["status"];
	isInternal: boolean;
}

import type { UserInfo } from "~/types/user-info";

export const API_BASE_URL = import.meta.env.DEV
	? "http://localhost:5173"
	: "https://qlj-devhub-homepage.qiliangjia.one";

export async function getUserInfo(): Promise<{ data: UserInfo }> {
	const response = await fetch(`${API_BASE_URL}/auth/me`);
	if (!response.ok) {
		throw new Error("Failed to fetch user info");
	}
	return response.json();
}

export async function logout(): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Failed to logout");
	}
	return response.json();
}

export async function getTools(): Promise<Tool[]> {
	const response = await fetch(`${API_BASE_URL}/api/tools`);
	if (!response.ok) {
		throw new Error("Failed to fetch tools");
	}
	return response.json();
}

export async function getToolCategories(): Promise<ToolCategory[]> {
	const response = await fetch(`${API_BASE_URL}/api/categories`);

	if (!response.ok) {
		const cloneResponse = response.clone();
		console.log(
			"getToolCategories",
			cloneResponse.status,
			cloneResponse.statusText,
			cloneResponse.text(),
		);
		throw new Error("Failed to fetch tool categories");
	}
	return response.json();
}

export async function getToolById(id: string): Promise<Tool | null> {
	const response = await fetch(`${API_BASE_URL}/api/tools/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		throw new Error("Failed to fetch tool");
	}
	return response.json();
}

export async function createTool(
	toolData: Omit<Tool, "id">,
): Promise<{ id: string; message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/tools`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(toolData),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to create tool");
	}

	return response.json();
}

export async function updateTool(
	id: string,
	toolData: Omit<Tool, "id">,
): Promise<{ message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(toolData),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to update tool");
	}

	return response.json();
}

export async function deleteTool(id: string): Promise<{ message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to delete tool");
	}

	return response.json();
}

export async function createCategory(
	categoryData: Omit<ToolCategory, "id">,
): Promise<{ id: string; message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/categories`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(categoryData),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to create category");
	}

	return response.json();
}

export async function updateCategory(
	id: string,
	categoryData: Omit<ToolCategory, "id">,
): Promise<{ message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(categoryData),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to update category");
	}

	return response.json();
}

export async function deleteCategory(id: string): Promise<{ message: string }> {
	const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to delete category");
	}

	return response.json();
}

export async function listCfLogs(
	params: CfLogListRequest = {},
): Promise<CfLogListResponse> {
	const searchParams = new URLSearchParams();
	if (params.prefix) {
		searchParams.set("prefix", params.prefix);
	}
	if (params.cursor) {
		searchParams.set("cursor", params.cursor);
	}
	if (typeof params.limit === "number") {
		searchParams.set("limit", String(params.limit));
	}
	if (params.delimiter === null) {
		searchParams.set("delimiter", "none");
	} else if (typeof params.delimiter === "string") {
		searchParams.set("delimiter", params.delimiter);
	}

	const qs = searchParams.toString();
	const url = `${API_BASE_URL}/api/cf-logs/list${qs ? `?${qs}` : ""}`;

	const response = await fetch(url);
	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error?: string };
		throw new Error(error.error || "Failed to list CF logs");
	}

	return response.json();
}

export async function queryCfLogs(
	payload: CfLogQueryRequest,
): Promise<CfLogQueryResponse> {
	const response = await fetch(`${API_BASE_URL}/api/cf-logs/query`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error?: string };
		throw new Error(error.error || "Failed to query CF logs");
	}

	return response.json();
}

export async function recordToolUsage(toolId: string): Promise<void> {
	const url = `${API_BASE_URL}/api/tools/${toolId}/usage`;
	try {
		// biome-ignore lint/complexity/useOptionalChain: navigator.sendBeacon compatibility check
		if (typeof navigator !== "undefined" && navigator.sendBeacon) {
			navigator.sendBeacon(url, new Blob());
			return;
		}
		await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Failed to record tool usage:", error);
	}
}

export async function getToolUsageStats(limit = 8): Promise<ToolUsageStat[]> {
	const response = await fetch(
		`${API_BASE_URL}/api/tools/analytics/usage?limit=${limit}`,
	);
	if (!response.ok) {
		throw new Error("Failed to fetch tool usage stats");
	}
	return response.json();
}

export async function uploadFiles(
	files: FormData,
): Promise<{ files: UploadFile[] }> {
	const response = await fetch(`${API_BASE_URL}/api/uploads`, {
		method: "POST",
		body: files,
	});
	if (!response.ok) {
		throw new Error("Failed to upload files");
	}
	return response.json();
}

/**
 * Query Analyzer API
 */
export interface ConvertToSQLRequest {
	naturalLanguage: string;
	schema: {
		tableName: string;
		database: string;
		columns: Array<{
			name: string;
			type: string;
			comment?: string;
		}>;
	};
}

export interface ConvertToSQLResponse {
	sql: string;
	explanation: string;
}

export interface ExecuteQueryRequest {
	sql: string;
}

export interface ExecuteQueryResponse {
	data: any[];
	meta?: Array<{ name: string; type: string }>;
	rows: number;
	statistics?: {
		elapsed: number;
		rows_read: number;
		bytes_read: number;
	};
}

export interface AnalyzeDataRequest {
	data: any[];
	sql: string;
	naturalQuery?: string;
}

export interface AnalyzeDataResponse {
	analysis: string;
	metadata: {
		rowCount: number;
		columnCount: number;
		columns: string[];
		numericStats: Record<string, any> | null;
	};
}

export async function convertToSQL(
	request: ConvertToSQLRequest,
): Promise<ConvertToSQLResponse> {
	const response = await fetch(
		`${API_BASE_URL}/api/query-analyzer/convert-to-sql`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		},
	);

	if (!response.ok) {
		const errorData: any = await response.json();
		throw new Error(errorData.error || "转换查询失败");
	}

	return response.json();
}

export async function executeQuery(
	request: ExecuteQueryRequest,
): Promise<ExecuteQueryResponse> {
	const response = await fetch(
		`${API_BASE_URL}/api/query-analyzer/execute-query`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		},
	);

	if (!response.ok) {
		const errorData: any = await response.json();
		throw new Error(errorData.error || "查询执行失败");
	}

	return response.json();
}

export async function analyzeData(
	request: AnalyzeDataRequest,
): Promise<AnalyzeDataResponse> {
	const response = await fetch(
		`${API_BASE_URL}/api/query-analyzer/analyze-data`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		},
	);

	if (!response.ok) {
		const errorData: any = await response.json();
		throw new Error(errorData.error || "数据分析失败");
	}

	return response.json();
}

/**
 * AI Icon Generation API
 */
export interface GenerateIconRequest {
	toolName: string;
	description?: string;
}

export interface GenerateIconResponse {
	iconUrl: string;
}

export async function generateToolIcon(
	request: GenerateIconRequest,
): Promise<GenerateIconResponse> {
	const response = await fetch("/api/icon-generator/generate", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(request),
	});

	if (!response.ok) {
		const errorData: any = await response.json().catch(() => ({}));
		throw new Error(errorData.error || "AI 图标生成失败");
	}

	return response.json();
}

/**
 * AB Router API
 * 独立部署的 A/B 链接路由服务
 */

// AB Router API 基础地址 (可通过环境变量配置)
export const AB_ROUTER_API_URL = import.meta.env.VITE_AB_ROUTER_API_URL
	? import.meta.env.VITE_AB_ROUTER_API_URL
	: import.meta.env.DEV
		? "http://localhost:8787"
		: "https://ab-router.qiliangjia.one";

/**
 * 获取所有链接配置
 */
export async function getABRouterLinks(): Promise<LinkConfig[]> {
	const response = await fetch(`${AB_ROUTER_API_URL}/api/links`);
	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "获取链接列表失败" }))) as { error?: string };
		throw new Error(error.error || "获取链接列表失败");
	}
	return response.json();
}

/**
 * 获取单个链接配置
 */
export async function getABRouterLink(id: string): Promise<LinkConfig | null> {
	const response = await fetch(`${AB_ROUTER_API_URL}/api/links/${id}`);
	if (!response.ok) {
		if (response.status === 404) {
			return null;
		}
		const error = (await response
			.json()
			.catch(() => ({ error: "获取链接配置失败" }))) as { error?: string };
		throw new Error(error.error || "获取链接配置失败");
	}
	return response.json();
}

/**
 * 创建或更新链接配置
 */
export async function saveABRouterLink(
	id: string,
	config: Omit<LinkConfig, "id">,
): Promise<{ message: string }> {
	const response = await fetch(`${AB_ROUTER_API_URL}/api/links/${id}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(config),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "保存链接配置失败" }))) as { error?: string };
		throw new Error(error.error || "保存链接配置失败");
	}

	return response.json();
}

/**
 * 删除链接配置
 */
export async function deleteABRouterLink(
	id: string,
): Promise<{ message: string }> {
	const response = await fetch(`${AB_ROUTER_API_URL}/api/links/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "删除链接配置失败" }))) as { error?: string };
		throw new Error(error.error || "删除链接配置失败");
	}

	return response.json();
}

/**
 * 预览链接决策
 */
export async function previewABRouterLink(
	id: string,
	params?: PreviewRequest,
): Promise<PreviewResult> {
	const response = await fetch(`${AB_ROUTER_API_URL}/api/links/${id}/preview`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params || {}),
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "预览决策失败" }))) as { error?: string };
		throw new Error(error.error || "预览决策失败");
	}

	return response.json();
}

/**
 * 查询访问日志
 */
export async function queryABRouterLogs(
	params?: LogQueryParams,
): Promise<LogQueryResponse> {
	const searchParams = new URLSearchParams();
	if (params?.linkId) {
		searchParams.set("linkId", params.linkId);
	}
	if (params?.date) {
		searchParams.set("date", params.date);
	}
	if (params?.country) {
		searchParams.set("country", params.country);
	}
	if (params?.device) {
		searchParams.set("device", params.device);
	}
	if (params?.destination) {
		searchParams.set("destination", params.destination);
	}
	if (params?.limit) {
		searchParams.set("limit", String(params.limit));
	}
	if (params?.cursor) {
		searchParams.set("cursor", params.cursor);
	}

	const qs = searchParams.toString();
	const url = `${AB_ROUTER_API_URL}/api/logs${qs ? `?${qs}` : ""}`;

	const response = await fetch(url);
	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "查询日志失败" }))) as { error?: string };
		throw new Error(error.error || "查询日志失败");
	}

	return response.json();
}

/**
 * 获取跳转链接地址
 */
export function getABRouterGoUrl(id: string): string {
	return `${AB_ROUTER_API_URL}/go/${id}`;
}
