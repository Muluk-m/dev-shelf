import { type Context, Hono } from "hono";
import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";
import {
	assignRoleToUser,
	checkUserPermission,
	getAllPermissions,
	getAllRoles,
	getAllUsers,
	getUserByFeishuId,
	removeRoleFromUser,
} from "../../lib/database/permissions";

const permissions = new Hono<{ Bindings: Cloudflare.Env }>();

// 中间件: 检查管理员权限
async function requireAdmin(c: Context, next: () => Promise<void>) {
	const token = getCookie(c, "auth_token");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const decoded = decode(token);
		const feishuId = decoded.payload.openId as string;

		const user = await getUserByFeishuId(c.env.DB, feishuId);

		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}

		const hasPermission = await checkUserPermission(
			c.env.DB,
			user.id,
			"user",
			"write",
		);

		if (!hasPermission) {
			return c.json({ error: "Forbidden: Admin access required" }, 403);
		}

		c.set("userId", user.id);
		await next();
	} catch (error) {
		console.error("Admin check failed:", error);
		return c.json({ error: "Unauthorized" }, 401);
	}
}

// 获取所有用户 (含角色信息)
permissions.get("/users", requireAdmin, async (c) => {
	try {
		const users = await getAllUsers(c.env.DB);
		return c.json({ code: 0, data: users });
	} catch (error) {
		console.error("Failed to get users:", error);
		return c.json({ code: 1, error: "Failed to fetch users" }, 500);
	}
});

// 获取所有角色 (含权限信息)
permissions.get("/roles", requireAdmin, async (c) => {
	try {
		const roles = await getAllRoles(c.env.DB);
		return c.json({ code: 0, data: roles });
	} catch (error) {
		console.error("Failed to get roles:", error);
		return c.json({ code: 1, error: "Failed to fetch roles" }, 500);
	}
});

// 获取所有权限
permissions.get("/permissions", requireAdmin, async (c) => {
	try {
		const perms = await getAllPermissions(c.env.DB);
		return c.json({ code: 0, data: perms });
	} catch (error) {
		console.error("Failed to get permissions:", error);
		return c.json({ code: 1, error: "Failed to fetch permissions" }, 500);
	}
});

// 为用户分配角色
permissions.post("/users/:userId/roles", requireAdmin, async (c) => {
	const userId = c.req.param("userId");
	const { roleId } = await c.req.json();

	if (!roleId) {
		return c.json({ code: 1, error: "roleId is required" }, 400);
	}

	try {
		await assignRoleToUser(c.env.DB, userId, roleId);
		return c.json({ code: 0, message: "Role assigned successfully" });
	} catch (error) {
		console.error("Failed to assign role:", error);
		return c.json({ code: 1, error: "Failed to assign role" }, 500);
	}
});

// 移除用户角色
permissions.delete("/users/:userId/roles/:roleId", requireAdmin, async (c) => {
	const userId = c.req.param("userId");
	const roleId = c.req.param("roleId");

	try {
		await removeRoleFromUser(c.env.DB, userId, roleId);
		return c.json({ code: 0, message: "Role removed successfully" });
	} catch (error) {
		console.error("Failed to remove role:", error);
		return c.json({ code: 1, error: "Failed to remove role" }, 500);
	}
});

// 创建新权限
permissions.post("/permissions", requireAdmin, async (c) => {
	const { resource, action, description } = await c.req.json();

	if (!resource || !action) {
		return c.json({ code: 1, error: "resource and action are required" }, 400);
	}

	try {
		const permissionId = `perm_${resource}_${action}`;

		await c.env.DB.prepare(
			`INSERT INTO permissions (id, resource, action, description)
       VALUES (?, ?, ?, ?)`,
		)
			.bind(permissionId, resource, action, description || null)
			.run();

		return c.json({
			code: 0,
			message: "Permission created successfully",
			data: { id: permissionId, resource, action, description },
		});
	} catch (error) {
		console.error("Failed to create permission:", error);
		return c.json({ code: 1, error: "Failed to create permission" }, 500);
	}
});

// 更新权限描述
permissions.put("/permissions/:permissionId", requireAdmin, async (c) => {
	const permissionId = c.req.param("permissionId");
	const { description } = await c.req.json();

	if (!description) {
		return c.json({ code: 1, error: "description is required" }, 400);
	}

	try {
		await c.env.DB.prepare(
			`UPDATE permissions SET description = ? WHERE id = ?`,
		)
			.bind(description, permissionId)
			.run();

		return c.json({
			code: 0,
			message: "Permission updated successfully",
		});
	} catch (error) {
		console.error("Failed to update permission:", error);
		return c.json({ code: 1, error: "Failed to update permission" }, 500);
	}
});

// 为角色分配权限
permissions.post("/roles/:roleId/permissions", requireAdmin, async (c) => {
	const roleId = c.req.param("roleId");
	const { permissionId } = await c.req.json();

	if (!permissionId) {
		return c.json({ code: 1, error: "permissionId is required" }, 400);
	}

	try {
		await c.env.DB.prepare(
			`INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
       VALUES (?, ?)`,
		)
			.bind(roleId, permissionId)
			.run();

		return c.json({
			code: 0,
			message: "Permission assigned to role successfully",
		});
	} catch (error) {
		console.error("Failed to assign permission:", error);
		return c.json({ code: 1, error: "Failed to assign permission" }, 500);
	}
});

// 移除角色权限
permissions.delete(
	"/roles/:roleId/permissions/:permissionId",
	requireAdmin,
	async (c) => {
		const roleId = c.req.param("roleId");
		const permissionId = c.req.param("permissionId");

		try {
			await c.env.DB.prepare(
				`DELETE FROM role_permissions
       WHERE role_id = ? AND permission_id = ?`,
			)
				.bind(roleId, permissionId)
				.run();

			return c.json({
				code: 0,
				message: "Permission removed from role successfully",
			});
		} catch (error) {
			console.error("Failed to remove permission:", error);
			return c.json({ code: 1, error: "Failed to remove permission" }, 500);
		}
	},
);

export { permissions };
