import type { UploadFile } from "workers/routes/uploads";
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
	const DIFY_API_URL = "https://api-ai.qiliangjia.org/v1";
	const DIFY_API_KEY = "app-w3ySSC6PLTlrjldSPErTwE6x";

	// 构建明确的提示词，要求返回特定格式
	const prompt = request.description
		? `请为"${request.toolName}"工具生成一个图标。工具描述：${request.description}

要求：
1. 生成 SVG 格式的图标
2. 图标应简洁、专业，适合在工具列表中展示
3. 请直接返回 data URI 格式，即：data:image/svg+xml;base64,<base64编码的SVG内容>
4. 只返回 data URI 字符串，不要有其他说明文字

示例输出格式：
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmM1LjUyIDAgMTAgNC40OCAxMCAxMHMtNC40OCAxMC0xMCAxMFMyIDIyLjUyIDIgMTcgNi40OCAxMiAxMiAxMnptMCA0Yy0zLjMxIDAtNiAyLjY5LTYgNnMyLjY5IDYgNiA2IDYtMi42OSA2LTYtMi42OS02LTYtNnoiLz48L3N2Zz4=`
		: `请为"${request.toolName}"工具生成一个图标。

要求：
1. 生成 SVG 格式的图标
2. 图标应简洁、专业，适合在工具列表中展示
3. 请直接返回 data URI 格式，即：data:image/svg+xml;base64,<base64编码的SVG内容>
4. 只返回 data URI 字符串，不要有其他说明文字

示例输出格式：
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmM1LjUyIDAgMTAgNC40OCAxMCAxMHMtNC40OCAxMC0xMCAxMFMyIDIyLjUyIDIgMTcgNi40OCAxMiAxMiAxMnptMCA0Yy0zLjMxIDAtNiAyLjY5LTYgNnMyLjY5IDYgNiA2IDYtMi42OSA2LTYtMi42OS02LTYtNnoiLz48L3N2Zz4=`;

	try {
		const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${DIFY_API_KEY}`,
			},
			body: JSON.stringify({
				inputs: {},
				query: prompt,
				response_mode: "blocking",
				user: "admin",
			}),
			signal: AbortSignal.timeout(30000), // 30s timeout
		});

		if (!response.ok) {
			if (response.status === 429) {
				throw new Error("请求过于频繁，请稍后再试");
			}
			const errorData: any = await response.json().catch(() => ({}));
			throw new Error(errorData.message || "AI 图标生成失败");
		}

		const data: any = await response.json();

		// 从响应中提取图标 URL
		// Dify API 通常在 answer 字段返回内容
		let iconUrl = data.answer || data.iconUrl || data.result?.iconUrl || "";

		// 清理响应内容，提取 data URI
		if (iconUrl) {
			// 移除可能的 markdown 代码块标记
			iconUrl = iconUrl.replace(/```[\s\S]*?```/g, "").trim();
			iconUrl = iconUrl.replace(/`/g, "").trim();

			// 查找 data:image/svg+xml;base64, 格式的内容
			const dataUriMatch = iconUrl.match(
				/data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+/,
			);
			if (dataUriMatch) {
				iconUrl = dataUriMatch[0];
			}

			// 验证是否为有效的 data URI 格式
			if (!iconUrl.startsWith("data:image/svg+xml;base64,")) {
				throw new Error("AI 返回的图标格式不正确，请重试");
			}
		}

		if (!iconUrl) {
			throw new Error("未能从响应中获取图标 URL");
		}

		return { iconUrl };
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("网络错误，请检查连接后重试");
	}
}
