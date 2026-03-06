import i18next from "~/lib/i18n";
import type { Tool, ToolCategory } from "~/types/tool";
import type { UserInfo } from "~/types/user-info";

function getApiErrorMessage(error: unknown, fallbackKey: string): string {
	if (error instanceof TypeError) {
		return i18next.t("error.network");
	}
	if (error instanceof ApiError) {
		const statusMap: Record<number, string> = {
			401: "error.unauthorized",
			403: "error.forbidden",
			500: "error.serverError",
			502: "error.serverUnavailable",
			503: "error.serverUnavailable",
		};
		const key = statusMap[error.status];
		if (key) return i18next.t(key);
		if (error.serverMessage) return error.serverMessage;
		return i18next.t(fallbackKey);
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return i18next.t("error.unknown");
}

class ApiError extends Error {
	status: number;
	serverMessage: string | undefined;

	constructor(status: number, serverMessage?: string) {
		super(serverMessage || `HTTP ${status}`);
		this.status = status;
		this.serverMessage = serverMessage;
	}
}

async function handleResponse<T>(
	response: Response,
	fallbackKey: string,
): Promise<T> {
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new ApiError(response.status, data.error);
	}
	return response.json();
}

export interface ToolUsageStat {
	toolId: string;
	name: string;
	category: string;
	usageCount: number;
	lastUsed: string | null;
	status: Tool["status"];
	isInternal: boolean;
}

// --- Setup API functions ---

export async function getSetupStatus(): Promise<{
	initialized: boolean;
	needsSetup: boolean;
}> {
	const response = await fetch(`/api/setup/status`);
	if (!response.ok) {
		throw new Error("Failed to check setup status");
	}
	return response.json();
}

export async function initializeSetup(data: {
	username: string;
	password: string;
	displayName?: string;
}): Promise<{ message: string; user: UserInfo }> {
	try {
		const response = await fetch(`/api/setup/init`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		return await handleResponse(response, "setup.failed");
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "setup.failed"));
	}
}

// --- Admin API functions ---

export async function getAdminUsers(): Promise<{
	users: Array<{
		id: string;
		username: string;
		displayName: string;
		role: string;
		createdAt: string;
	}>;
}> {
	const response = await fetch(`/api/admin/users`, {
		credentials: "include",
	});
	if (!response.ok) {
		const err = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(err.error || "Failed to fetch users");
	}
	return response.json();
}

export async function resetUserPassword(
	userId: string,
	newPassword: string,
): Promise<{ message: string }> {
	const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ newPassword }),
	});
	if (!response.ok) {
		const err = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(err.error || "Failed to reset password");
	}
	return response.json();
}

export async function updateUserRole(
	userId: string,
	role: "admin" | "user",
): Promise<{ message: string }> {
	const response = await fetch(`/api/admin/users/${userId}/role`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ role }),
	});
	if (!response.ok) {
		const err = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(err.error || "Failed to update user role");
	}
	return response.json();
}

// --- Auth API functions ---

export async function login(
	username: string,
	password: string,
): Promise<{ user: UserInfo }> {
	try {
		const response = await fetch(`/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ username, password }),
		});
		return await handleResponse(response, "auth.login.failed");
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "auth.login.failed"));
	}
}

export async function register(
	username: string,
	password: string,
	displayName?: string,
): Promise<{ user: UserInfo }> {
	try {
		const response = await fetch(`/api/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ username, password, displayName }),
		});
		return await handleResponse(response, "auth.register.failed");
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "auth.register.failed"));
	}
}

export async function logout(): Promise<void> {
	const response = await fetch(`/api/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Logout failed");
	}
}

export async function getUserInfo(): Promise<{ user: UserInfo }> {
	const response = await fetch(`/api/auth/me`, {
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Not authenticated");
	}
	return response.json();
}

export async function changePassword(
	currentPassword: string,
	newPassword: string,
): Promise<{ message: string }> {
	try {
		const response = await fetch(`/api/auth/change-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ currentPassword, newPassword }),
		});
		return await handleResponse(response, "settings.password.failed");
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "settings.password.failed"));
	}
}

export async function updateProfile(
	displayName: string,
): Promise<{ user: UserInfo }> {
	try {
		const response = await fetch(`/api/auth/profile`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ displayName }),
		});
		return await handleResponse(response, "settings.profile.failed");
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "settings.profile.failed"));
	}
}

// --- Export API functions ---

export function getExportUrl(): string {
	return `/api/export`;
}

// --- Tool API functions ---

export async function getTools(): Promise<Tool[]> {
	const response = await fetch(`/api/tools`);
	if (!response.ok) {
		throw new Error("Failed to fetch tools");
	}
	return response.json();
}

export async function getToolCategories(): Promise<ToolCategory[]> {
	const response = await fetch(`/api/categories`);

	if (!response.ok) {
		throw new Error("Failed to fetch tool categories");
	}
	return response.json();
}

export async function getToolById(id: string): Promise<Tool | null> {
	const response = await fetch(`/api/tools/${id}`);
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
	const response = await fetch(`/api/tools`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
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
	const response = await fetch(`/api/tools/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
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
	const response = await fetch(`/api/tools/${id}`, {
		method: "DELETE",
		credentials: "include",
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
	const response = await fetch(`/api/categories`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
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
	const response = await fetch(`/api/categories/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
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
	const response = await fetch(`/api/categories/${id}`, {
		method: "DELETE",
		credentials: "include",
	});

	if (!response.ok) {
		const error = (await response
			.json()
			.catch((error) => ({ error: error.message }))) as { error: string };
		throw new Error(error.error || "Failed to delete category");
	}

	return response.json();
}

export async function uploadFiles(formData: FormData): Promise<{
	files: Array<{
		key: string;
		urls: Record<string, string>;
		name: string;
		size: number;
		type: string;
	}>;
}> {
	const response = await fetch(`/api/uploads`, {
		method: "POST",
		credentials: "include",
		body: formData,
	});
	if (!response.ok) {
		const error = (await response
			.json()
			.catch(() => ({ error: "Upload failed" }))) as { error: string };
		throw new Error(error.error || "Failed to upload files");
	}
	return response.json();
}

export async function recordToolUsage(toolId: string): Promise<void> {
	const url = `/api/tools/${toolId}/usage`;
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
	const response = await fetch(`/api/tools/analytics/usage?limit=${limit}`);
	if (!response.ok) {
		throw new Error("Failed to fetch tool usage stats");
	}
	return response.json();
}
