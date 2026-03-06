import type { D1Database } from "@cloudflare/workers-types";

/**
 * Check if a user has permission to access a tool.
 * Uses a simple model: tools without permissionId are public;
 * tools with permissionId require admin role.
 */
export async function checkToolAccess(
	db: D1Database,
	toolId: string,
	userId: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
	const toolResult = await db
		.prepare("SELECT permission_id FROM tools WHERE id = ?")
		.bind(toolId)
		.first<{ permission_id: string | null }>();

	if (!toolResult) {
		return { allowed: false, reason: "Tool not found" };
	}

	// No permission required — everyone can access
	if (!toolResult.permission_id) {
		return { allowed: true };
	}

	// Permission required but user not logged in
	if (!userId) {
		return { allowed: false, reason: "Login required" };
	}

	// Check if user is admin (admins bypass all permission checks)
	const user = await db
		.prepare("SELECT role FROM users WHERE id = ?")
		.bind(userId)
		.first<{ role: string }>();

	if (user?.role === "admin") {
		return { allowed: true };
	}

	return { allowed: false, reason: "Insufficient permissions" };
}

/**
 * Filter tools list by user permissions.
 * Non-logged-in users only see tools without permissionId.
 * Admins see everything. Regular users see non-permission-gated tools.
 */
export async function filterToolsByUserPermissions<
	T extends { id: string; permissionId?: string | null },
>(db: D1Database, tools: T[], userId: string | null): Promise<T[]> {
	// Not logged in — only show public tools
	if (!userId) {
		return tools.filter((tool) => !tool.permissionId);
	}

	// Check if admin
	const user = await db
		.prepare("SELECT role FROM users WHERE id = ?")
		.bind(userId)
		.first<{ role: string }>();

	if (user?.role === "admin") {
		return tools;
	}

	// Regular users — only public tools
	return tools.filter((tool) => !tool.permissionId);
}
