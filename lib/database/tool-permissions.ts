import type { D1Database } from "@cloudflare/workers-types";

/**
 * 检查用户是否有权限访问工具
 * @param db D1 数据库实例
 * @param toolId 工具 ID
 * @param userId 用户 ID (可选，未登录用户为 null)
 * @returns 是否有权限访问
 */
export async function checkToolAccess(
	db: D1Database,
	toolId: string,
	userId: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
	// 获取工具的 permission_id
	const toolResult = await db
		.prepare("SELECT permission_id FROM tools WHERE id = ?")
		.bind(toolId)
		.first<{ permission_id: string | null }>();

	if (!toolResult) {
		return { allowed: false, reason: "工具不存在" };
	}

	// 如果工具没有设置权限要求，则所有人都可以访问
	if (!toolResult.permission_id) {
		return { allowed: true };
	}

	// 如果工具需要权限但用户未登录，拒绝访问
	if (!userId) {
		return { allowed: false, reason: "需要登录" };
	}

	// 检查用户是否有所需权限
	const permissionCheck = await db
		.prepare(
			`SELECT COUNT(*) as count FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ? AND p.id = ?`,
		)
		.bind(userId, toolResult.permission_id)
		.first<{ count: number }>();

	const hasPermission = (permissionCheck?.count ?? 0) > 0;

	if (!hasPermission) {
		// 获取权限信息用于错误提示
		const permInfo = await db
			.prepare("SELECT resource, action, description FROM permissions WHERE id = ?")
			.bind(toolResult.permission_id)
			.first<{ resource: string; action: string; description?: string }>();

		return {
			allowed: false,
			reason: permInfo
				? `需要权限: ${permInfo.resource}:${permInfo.action}${permInfo.description ? ` (${permInfo.description})` : ""}`
				: "权限不足",
		};
	}

	return { allowed: true };
}

/**
 * 根据用户权限过滤工具列表
 * @param db D1 数据库实例
 * @param tools 工具列表
 * @param userId 用户 ID (可选，未登录用户为 null)
 * @returns 过滤后的工具列表
 */
export async function filterToolsByUserPermissions<T extends { id: string; permissionId?: string | null }>(
	db: D1Database,
	tools: T[],
	userId: string | null,
): Promise<T[]> {
	// 如果用户未登录，只返回不需要权限的工具
	if (!userId) {
		return tools.filter((tool) => !tool.permissionId);
	}

	// 获取用户的所有权限 ID
	const userPermissions = await db
		.prepare(
			`SELECT DISTINCT p.id FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
		)
		.bind(userId)
		.all<{ id: string }>();

	const permissionIds = new Set(userPermissions.results.map((p) => p.id));

	// 过滤工具：没有权限要求的 或 用户有对应权限的
	return tools.filter((tool) => !tool.permissionId || permissionIds.has(tool.permissionId));
}
