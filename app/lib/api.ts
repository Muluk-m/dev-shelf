import type { Tool, ToolCategory } from "~/types/tool";
import type { UserInfo } from "~/types/user-info";

const API_BASE_URL = import.meta.env.DEV
	? "http://localhost:5173"
	: "https://qlj-devhub-homepage.qiliangjia.one";

export async function getUserInfo(): Promise<{ data: UserInfo }> {
	const response = await fetch(`${API_BASE_URL}/auth/me`);
	if (!response.ok) {
		throw new Error("Failed to fetch user info");
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
