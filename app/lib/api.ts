import type { UploadFile } from "workers/routes/uploads";
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

export const API_BASE_URL = import.meta.env.DEV
	? "http://localhost:5173"
	: "";

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
