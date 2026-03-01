import { createMiddleware } from "hono/factory";

/**
 * Middleware that requires the request to come from an authenticated user.
 * Returns 401 if no user is found in the context (set by authMiddleware).
 */
export const requireAuth = createMiddleware(async (c, next) => {
	const userId = c.get("userId" as never) as string | undefined;

	if (!userId) {
		return c.json({ error: "Unauthorized: Authentication required" }, 401);
	}

	return next();
});

/**
 * Middleware that requires the request to come from an admin user.
 * Returns 401 if not authenticated, 403 if not an admin.
 * Must be used after authMiddleware which sets userId and userRole.
 */
export const requireAdmin = createMiddleware(async (c, next) => {
	const userId = c.get("userId" as never) as string | undefined;

	if (!userId) {
		return c.json({ error: "Unauthorized: Authentication required" }, 401);
	}

	const userRole = c.get("userRole" as never) as string | undefined;

	if (userRole !== "admin") {
		return c.json({ error: "Forbidden: Admin access required" }, 403);
	}

	return next();
});
