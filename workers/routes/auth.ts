import { type Context, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { decode } from "hono/jwt";

const getOauthApiBaseUrl = (c: Context) => {
	const clientId = c.env.FEISHU_CLIENT_ID;
	const oauthBaseUrl = c.env.OAUTH_BASE_URL;

	return `${oauthBaseUrl}/api/feishu/${clientId}/oauth`;
};

const auth = new Hono<{ Bindings: Cloudflare.Env }>();

auth.get("/me", (c) => {
	const token = getCookie(c, "auth_token");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const decodedJwt = decode(token);
		return c.json({
			coe: 0,
			data: decodedJwt.payload,
		});
	} catch (error) {
		console.error("Failed to decode auth token", error);
		return c.json({ error: "Invalid token" }, 401);
	}
});

// OAuth 授权跳转
auth.get("/login", (c) => {
	const redirectUri = `${new URL(c.req.url).origin}/auth/callback`;
	const state = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

	const authUrl = new URL(`${getOauthApiBaseUrl(c)}/authorize`);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("state", state);

	return c.redirect(authUrl.toString());
});

// OAuth 回调处理
auth.get("/callback", async (c) => {
	const code = c.req.query("code");
	const redirectTo = c.req.query("redirect_to") || "/";

	if (!code) {
		return c.json({ error: "缺少授权码" }, 400);
	}

	const response = await fetch(`${getOauthApiBaseUrl(c)}/token`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ code }),
	});

	if (!response.ok) {
		throw new Error("获取token失败");
	}

	const result = (await response.json()) as { access_token: string };

	setCookie(c, "auth_token", result.access_token, {
		sameSite: "none",
		secure: true,
	});

	return c.redirect(redirectTo);
});

export { auth };
