import { createMiddleware } from "hono/factory";
import { getAuthToken, verifyAccessToken } from "../utils/auth";

const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/register"];

export const authMiddleware = createMiddleware(async (c, next) => {
	const path = c.req.path;
	const method = c.req.method;

	// Public auth endpoints -- no auth required
	if (PUBLIC_API_PATHS.some((p) => path.startsWith(p))) {
		return next();
	}

	// Non-API paths (frontend routes, static assets) -- pass through
	if (!path.startsWith("/api/")) {
		return next();
	}

	const token = getAuthToken(c);

	// GET/OPTIONS/HEAD on API -- allow anonymous but attach user if token present
	if (method === "GET" || method === "OPTIONS" || method === "HEAD") {
		if (token) {
			const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
			if (payload) {
				c.set("userId" as never, payload.sub as never);
				c.set("userRole" as never, payload.role as never);
			}
		}
		return next();
	}

	// Write operations (POST/PUT/DELETE) -- require valid auth
	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const payload = await verifyAccessToken(token, c.env.JWT_SECRET);
	if (!payload) {
		return c.json({ error: "Token expired or invalid" }, 401);
	}

	c.set("userId" as never, payload.sub as never);
	c.set("userRole" as never, payload.role as never);
	return next();
});
