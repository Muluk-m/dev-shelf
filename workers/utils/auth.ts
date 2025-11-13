import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";
import { getUserByFeishuId } from "../../lib/database/permissions";

/**
 * 从请求中获取 auth token
 */
function getAuthToken(
	c: Context | { req: { headers: Headers } },
): string | null {
	// 如果是 Hono Context，使用 getCookie
	if ("executionCtx" in c || "get" in c) {
		return getCookie(c as Context, "auth_token") || null;
	}

	// 如果是 Request，从 headers 中解析 cookie
	const cookieHeader = c.req.headers.get("Cookie");
	if (!cookieHeader) {
		return null;
	}

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

	return cookies.auth_token || null;
}

/**
 * 从请求中获取当前用户 ID
 * @param c Hono Context 或包含 request headers 的对象
 * @returns 用户 ID，如果未登录则返回 null
 */
export async function getCurrentUserId(
	c: Context | { env: { DB: D1Database }; req: { headers: Headers } },
): Promise<string | null> {
	const token = getAuthToken(c as any);

	if (!token) {
		return null;
	}

	try {
		const decodedJwt = decode(token);
		const feishuId = decodedJwt.payload.openId as string;

		const db = "env" in c ? c.env.DB : (c as Context).env.DB;
		const user = await getUserByFeishuId(db, feishuId);
		return user?.id ?? null;
	} catch (error) {
		console.warn("Failed to get current user ID:", error);
		return null;
	}
}
