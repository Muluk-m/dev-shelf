import { Hono } from "hono";
import { z } from "zod";
import { getUserById, updateUserPassword } from "../../lib/database/auth";
import { getAllUsers, updateUserRole } from "../../lib/database/users";
import { requireAdmin } from "../middleware/rbac";
import { hashPassword } from "../utils/auth";

const adminRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// All admin routes require admin role
adminRouter.use("*", requireAdmin);

// Validation schemas
const resetPasswordSchema = z.object({
	newPassword: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be at most 128 characters"),
});

const updateRoleSchema = z.object({
	role: z.enum(["admin", "user"], {
		errorMap: () => ({ message: "Role must be 'admin' or 'user'" }),
	}),
});

/**
 * GET /api/admin/users
 *
 * List all users (without password data).
 * Requires admin role.
 */
adminRouter.get("/users", async (c) => {
	try {
		const users = await getAllUsers(c.env.DB);
		return c.json({ users });
	} catch (error) {
		console.error("Error fetching users:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

/**
 * POST /api/admin/users/:id/reset-password
 *
 * Reset a user's password (admin only).
 * Requires admin role.
 */
adminRouter.post("/users/:id/reset-password", async (c) => {
	try {
		const targetUserId = c.req.param("id");

		// Verify target user exists
		const targetUser = await getUserById(c.env.DB, targetUserId);
		if (!targetUser) {
			return c.json({ error: "User not found" }, 404);
		}

		// Parse and validate body
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const result = resetPasswordSchema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map((i) => i.message);
			return c.json({ error: "Validation failed", details: errors }, 400);
		}

		const { newPassword } = result.data;

		// Hash new password and update
		const newHash = await hashPassword(newPassword);
		await updateUserPassword(c.env.DB, targetUserId, newHash);

		return c.json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Error resetting password:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

/**
 * PUT /api/admin/users/:id/role
 *
 * Update a user's role (admin only).
 * Prevents an admin from demoting themselves.
 */
adminRouter.put("/users/:id/role", async (c) => {
	try {
		const targetUserId = c.req.param("id");
		const currentUserId = c.get("userId" as never) as string;

		// Prevent admin from demoting themselves
		if (targetUserId === currentUserId) {
			return c.json({ error: "Cannot change your own role" }, 400);
		}

		// Verify target user exists
		const targetUser = await getUserById(c.env.DB, targetUserId);
		if (!targetUser) {
			return c.json({ error: "User not found" }, 404);
		}

		// Parse and validate body
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const result = updateRoleSchema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map((i) => i.message);
			return c.json({ error: "Validation failed", details: errors }, 400);
		}

		const { role } = result.data;

		await updateUserRole(c.env.DB, targetUserId, role);

		return c.json({ message: "Role updated successfully" });
	} catch (error) {
		console.error("Error updating user role:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { adminRouter };
