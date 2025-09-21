import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

const API_PREFIX = "/api";
const PUBLIC_PATHS = ["/auth"];

export const authMiddleware = createMiddleware(async (c, next) => {
	const path = c.req.path;
	const method = c.req.method;

	if (PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath))) {
		return next();
	}

	const token = getCookie(c, "auth_token");
	const isApiRequest = path.startsWith(API_PREFIX);

	// 对 API 读取请求放行，写操作需要认证
	if (isApiRequest && (!token || token.length === 0)) {
		if (method === "GET" || method === "OPTIONS" || method === "HEAD") {
			return next();
		}
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (!token || token.length === 0) {
		const url = new URL(c.req.url);
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		return c.redirect(`/auth/login?redirectTo=${redirectTo}`);
	}

	return next();
});
