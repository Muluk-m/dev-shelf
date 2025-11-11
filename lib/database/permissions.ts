import type { D1Database } from "@cloudflare/workers-types";

export interface User {
	id: string;
	feishuId: string;
	name: string;
	email?: string;
	avatar?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Role {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
}

export interface Permission {
	id: string;
	resource: string;
	action: string;
	description?: string;
	createdAt: string;
}

export interface UserRole {
	userId: string;
	roleId: string;
	createdAt: string;
}

export interface RolePermission {
	roleId: string;
	permissionId: string;
	createdAt: string;
}

export interface ResourcePermission {
	id: string;
	userId: string;
	resourceType: string;
	resourceId: string;
	permission: string;
	createdAt: string;
}

// 数据库字段映射
function mapUserFromDb(row: any): User {
	return {
		id: row.id,
		feishuId: row.feishu_id,
		name: row.name,
		email: row.email,
		avatar: row.avatar,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function mapRoleFromDb(row: any): Role {
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		createdAt: row.created_at,
	};
}

function mapPermissionFromDb(row: any): Permission {
	return {
		id: row.id,
		resource: row.resource,
		action: row.action,
		description: row.description,
		createdAt: row.created_at,
	};
}

// 用户相关操作
export async function getUserByFeishuId(
	db: D1Database,
	feishuId: string,
): Promise<User | null> {
	const result = await db
		.prepare("SELECT * FROM users WHERE feishu_id = ?")
		.bind(feishuId)
		.first();

	return result ? mapUserFromDb(result) : null;
}

export async function createUser(
	db: D1Database,
	data: {
		id: string;
		feishuId: string;
		name: string;
		email?: string;
		avatar?: string;
	},
): Promise<User> {
	await db
		.prepare(
			`INSERT INTO users (id, feishu_id, name, email, avatar)
       VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(data.id, data.feishuId, data.name, data.email || null, data.avatar || null)
		.run();

	return (await getUserByFeishuId(db, data.feishuId)) as User;
}

export async function updateUser(
	db: D1Database,
	userId: string,
	data: {
		name?: string;
		email?: string;
		avatar?: string;
	},
): Promise<void> {
	const updates: string[] = [];
	const values: any[] = [];

	if (data.name !== undefined) {
		updates.push("name = ?");
		values.push(data.name);
	}
	if (data.email !== undefined) {
		updates.push("email = ?");
		values.push(data.email);
	}
	if (data.avatar !== undefined) {
		updates.push("avatar = ?");
		values.push(data.avatar);
	}

	if (updates.length > 0) {
		updates.push("updated_at = CURRENT_TIMESTAMP");
		values.push(userId);

		await db
			.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
			.bind(...values)
			.run();
	}
}

// 角色相关操作
export async function getUserRoles(db: D1Database, userId: string): Promise<Role[]> {
	const result = await db
		.prepare(
			`SELECT r.* FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
		)
		.bind(userId)
		.all();

	return result.results.map(mapRoleFromDb);
}

export async function assignRoleToUser(
	db: D1Database,
	userId: string,
	roleId: string,
): Promise<void> {
	await db
		.prepare(
			`INSERT OR IGNORE INTO user_roles (user_id, role_id)
       VALUES (?, ?)`,
		)
		.bind(userId, roleId)
		.run();
}

export async function removeRoleFromUser(
	db: D1Database,
	userId: string,
	roleId: string,
): Promise<void> {
	await db
		.prepare(
			`DELETE FROM user_roles
       WHERE user_id = ? AND role_id = ?`,
		)
		.bind(userId, roleId)
		.run();
}

// 权限相关操作
export async function getUserPermissions(
	db: D1Database,
	userId: string,
): Promise<Permission[]> {
	const result = await db
		.prepare(
			`SELECT DISTINCT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
		)
		.bind(userId)
		.all();

	return result.results.map(mapPermissionFromDb);
}

export async function checkUserPermission(
	db: D1Database,
	userId: string,
	resource: string,
	action: string,
): Promise<boolean> {
	const result = await db
		.prepare(
			`SELECT COUNT(*) as count FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?`,
		)
		.bind(userId, resource, action)
		.first<{ count: number }>();

	return (result?.count || 0) > 0;
}

// 获取用户最高角色
export async function getUserHighestRole(
	db: D1Database,
	userId: string,
): Promise<string> {
	const roles = await getUserRoles(db, userId);

	if (roles.length === 0) {
		return "visitor";
	}

	const roleHierarchy = ["admin", "developer", "user", "visitor"];
	for (const roleName of roleHierarchy) {
		if (roles.some((r) => r.name === roleName)) {
			return roleName;
		}
	}

	return "visitor";
}

// 管理端 - 获取所有用户
export async function getAllUsers(db: D1Database): Promise<
	(User & {
		roles: Role[];
	})[]
> {
	const usersResult = await db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();

	const users = usersResult.results.map(mapUserFromDb);

	const usersWithRoles = await Promise.all(
		users.map(async (user) => {
			const roles = await getUserRoles(db, user.id);
			return { ...user, roles };
		}),
	);

	return usersWithRoles;
}

// 管理端 - 获取所有角色
export async function getAllRoles(db: D1Database): Promise<
	(Role & {
		userCount: number;
		permissions: Permission[];
	})[]
> {
	const rolesResult = await db.prepare("SELECT * FROM roles ORDER BY created_at").all();

	const roles = rolesResult.results.map(mapRoleFromDb);

	const rolesWithDetails = await Promise.all(
		roles.map(async (role) => {
			// 获取用户数量
			const userCountResult = await db
				.prepare("SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?")
				.bind(role.id)
				.first<{ count: number }>();

			// 获取权限列表
			const permissionsResult = await db
				.prepare(
					`SELECT p.* FROM permissions p
           INNER JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.role_id = ?`,
				)
				.bind(role.id)
				.all();

			return {
				...role,
				userCount: userCountResult?.count || 0,
				permissions: permissionsResult.results.map(mapPermissionFromDb),
			};
		}),
	);

	return rolesWithDetails;
}

// 管理端 - 获取所有权限
export async function getAllPermissions(db: D1Database): Promise<Permission[]> {
	const result = await db.prepare("SELECT * FROM permissions ORDER BY resource, action").all();

	return result.results.map(mapPermissionFromDb);
}
