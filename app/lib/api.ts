import type { UploadFile } from "workers/routes/uploads";
import type { Tool, ToolCategory } from "~/types/tool";
import type { UserInfo } from "~/types/user-info";

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

// --- Setup API functions ---

export async function getSetupStatus(): Promise<{
	initialized: boolean;
	needsSetup: boolean;
}> {
	const response = await fetch(`${API_BASE_URL}/api/setup/status`);
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
	const response = await fetch(`${API_BASE_URL}/api/setup/init`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(data),
	});
	if (!response.ok) {
		const err = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(err.error || "Setup initialization failed");
	}
	return response.json();
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
	const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
	const response = await fetch(
		`${API_BASE_URL}/api/admin/users/${userId}/reset-password`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ newPassword }),
		},
	);
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
	const response = await fetch(
		`${API_BASE_URL}/api/admin/users/${userId}/role`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ role }),
		},
	);
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
	const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ username, password }),
	});
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(data.error || "Login failed");
	}
	return response.json();
}

export async function register(
	username: string,
	password: string,
	displayName?: string,
): Promise<{ user: UserInfo }> {
	const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ username, password, displayName }),
	});
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(data.error || "Registration failed");
	}
	return response.json();
}

export async function logout(): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Logout failed");
	}
}

export async function getUserInfo(): Promise<{ user: UserInfo }> {
	const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
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
	const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ currentPassword, newPassword }),
	});
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(data.error || "Failed to change password");
	}
	return response.json();
}

export async function updateProfile(
	displayName: string,
): Promise<{ user: UserInfo }> {
	const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ displayName }),
	});
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new Error(data.error || "Failed to update profile");
	}
	return response.json();
}

// --- Tool API functions ---

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
	const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
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
	const response = await fetch(`${API_BASE_URL}/api/tools/${id}`, {
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
	const response = await fetch(`${API_BASE_URL}/api/categories`, {
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
	const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
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
	const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
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
		credentials: "include",
		body: files,
	});
	if (!response.ok) {
		throw new Error("Failed to upload files");
	}
	return response.json();
}
