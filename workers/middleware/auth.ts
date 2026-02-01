import { createMiddleware } from "hono/factory";
import { getAuthToken, getJwtSecret, verifyAccessToken } from "../utils/auth";

const PUBLIC_API_PATHS = [
	"/api/auth/login",
	"/api/auth/register",
	"/api/setup",
];

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
			let jwtSecret: string;
			try {
				jwtSecret = getJwtSecret(c.env);
			} catch (error) {
				console.error("Auth configuration error:", error);
				return c.json(
					{
						error:
							"JWT_SECRET is not configured. Create `.dev.vars` with `JWT_SECRET=...` for local dev, or set the Worker secret in Cloudflare.",
					},
					500,
				);
			}
			const payload = await verifyAccessToken(token, jwtSecret);
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

	let jwtSecret: string;
	try {
		jwtSecret = getJwtSecret(c.env);
	} catch (error) {
		console.error("Auth configuration error:", error);
		return c.json(
			{
				error:
					"JWT_SECRET is not configured. Create `.dev.vars` with `JWT_SECRET=...` for local dev, or set the Worker secret in Cloudflare.",
			},
			500,
		);
	}
	const payload = await verifyAccessToken(token, jwtSecret);
	if (!payload) {
		return c.json({ error: "Token expired or invalid" }, 401);
	}

	c.set("userId" as never, payload.sub as never);
	c.set("userRole" as never, payload.role as never);
	return next();
});
