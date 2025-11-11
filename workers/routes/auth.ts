import { type Context, Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { decode } from "hono/jwt";
import {
	assignRoleToUser,
	createUser,
	getUserByFeishuId,
	getUserPermissions,
	getUserRoles,
	updateUser,
} from "../../lib/database/permissions";
import type { JwtPayload } from "../../lib/types/jwt";

const getOauthApiBaseUrl = (c: Context) => {
	const clientId = c.env.FEISHU_CLIENT_ID;
	const oauthBaseUrl = c.env.OAUTH_BASE_URL;

	return `${oauthBaseUrl}/api/feishu/${clientId}/oauth`;
};

const auth = new Hono<{ Bindings: Cloudflare.Env }>();

auth.get("/me", async (c) => {
	const token = getCookie(c, "auth_token");

	if (!token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const decodedJwt = decode(token);
		const feishuId = decodedJwt.payload.openId as string;

		// 获取用户完整信息(含角色和权限)
		const user = await getUserByFeishuId(c.env.DB, feishuId);

		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}

		const roles = await getUserRoles(c.env.DB, user.id);
		const permissions = await getUserPermissions(c.env.DB, user.id);

		return c.json({
			code: 0,
			data: {
				...decodedJwt.payload,
				userId: user.id,
				roles: roles.map((r) => r.name),
				permissions: permissions.map((p) => `${p.resource}:${p.action}`),
			},
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

	try {
		// 解码 JWT 获取用户信息
		const decodedJwt = decode(result.access_token);
		const payload = decodedJwt.payload as any as JwtPayload;
		const feishuId = payload.openId;
		const userName = payload.userName || "Unknown User";
		const userEmail = payload.userEmail || "";
		const userAvatar = payload.avatar;

		// 检查用户是否存在
		let user = await getUserByFeishuId(c.env.DB, feishuId);

		if (!user) {
			// 创建新用户
			const userId = crypto.randomUUID();
			user = await createUser(c.env.DB, {
				id: userId,
				feishuId,
				name: userName,
				email: userEmail,
				avatar: userAvatar,
			});

			// 分配默认角色 user
			await assignRoleToUser(c.env.DB, userId, "user");
			console.log(`✅ Created new user ${userName} with role: user`);
		} else {
			// 更新用户信息
			await updateUser(c.env.DB, user.id, {
				name: userName,
				email: userEmail,
				avatar: userAvatar,
			});

			// 检查用户是否有角色，如果没有则分配默认角色
			const userRoles = await getUserRoles(c.env.DB, user.id);
			if (userRoles.length === 0) {
				await assignRoleToUser(c.env.DB, user.id, "user");
				console.log(`✅ Assigned default role to existing user ${userName}`);
			}
		}
	} catch (error) {
		console.error("Failed to process user on callback:", error);
	}

	setCookie(c, "auth_token", result.access_token, {
		sameSite: "none",
		secure: true,
	});

	return c.redirect(redirectTo);
});

export { auth };
