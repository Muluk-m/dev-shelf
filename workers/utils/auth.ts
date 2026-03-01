import type { Context } from "hono";
import { getCookie } from "hono/cookie";

/**
 * Extract auth token from request.
 * Supports:
 * 1. Authorization header: Bearer <token>
 * 2. Cookie: auth_token=<token>
 * Authorization header takes priority.
 */
export function getAuthToken(
	c: Context | { req: { headers: Headers } },
): string | null {
	let authHeader: string | null = null;
	if ("executionCtx" in c || "get" in c) {
		authHeader = (c as Context).req.header("Authorization") || null;
	} else {
		authHeader = c.req.headers.get("Authorization");
	}

	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7).trim();
		if (token) {
			return token;
		}
	}

	if ("executionCtx" in c || "get" in c) {
		const cookieToken = getCookie(c as Context, "auth_token");
		if (cookieToken) {
			return cookieToken;
		}
	} else {
		const cookieHeader = c.req.headers.get("Cookie");
		if (cookieHeader) {
			const cookies = cookieHeader.split(";").reduce(
				(acc, cookie) => {
					const [key, value] = cookie.trim().split("=");
					if (key && value) {
						acc[key] = value;
					}
					return acc;
				},
				{} as Record<string, string>,
			);

			if (cookies.auth_token) {
				return cookies.auth_token;
			}
		}
	}

	return null;
}

/**
 * Get the current user ID from the request.
 * Stub: returns null until auth is rebuilt in Phase 2.
 */
export async function getCurrentUserId(
	_c: Context | { env: { DB: D1Database }; req: { headers: Headers } },
): Promise<string | null> {
	return null;
}
