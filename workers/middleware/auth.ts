import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (c, next) => {
	// 检查是否是需要认证的路径
	const path = c.req.path;

	// 排除不需要认证的路径
	const publicPaths = ["/auth", "/api"];
	const isPublicPath = publicPaths.some((publicPath) =>
		path.startsWith(publicPath),
	);

	if (isPublicPath) {
		return next();
	}

	// 检查认证状态
	const token = getCookie(c, "auth_token");

	if (!token) {
		const url = new URL(c.req.url);
		const redirectTo = encodeURIComponent(url.pathname + url.search);

		// 重定向到登录页
		return c.redirect(`/auth/login?redirectTo=${redirectTo}`);
	}

	// 认证通过，继续处理请求
	return next();
});
