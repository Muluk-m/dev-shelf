import { Hono } from "hono";

const identityRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// 获取所有 GitHub-飞书身份映射
identityRouter.get("/", async (c) => {
	try {
		const result = await c.env.DB.prepare(
			"SELECT * FROM github_feishu_identity ORDER BY created_at DESC",
		).all();

		return c.json(result.results);
	} catch (error) {
		console.error("Error fetching identities:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 根据 GitHub Actor ID 查询
identityRouter.get("/github/:actorId", async (c) => {
	try {
		const actorId = c.req.param("actorId");
		const result = await c.env.DB.prepare(
			"SELECT * FROM github_feishu_identity WHERE github_actor_id = ?",
		)
			.bind(actorId)
			.first();

		if (!result) {
			return c.json({ error: "Not found" }, 404);
		}

		return c.json(result);
	} catch (error) {
		console.error("Error fetching identity by GitHub ID:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 根据飞书 User ID 查询
identityRouter.get("/feishu/:userId", async (c) => {
	try {
		const userId = c.req.param("userId");
		const result = await c.env.DB.prepare(
			"SELECT * FROM github_feishu_identity WHERE feishu_user_id = ?",
		)
			.bind(userId)
			.first();

		if (!result) {
			return c.json({ error: "Not found" }, 404);
		}

		return c.json(result);
	} catch (error) {
		console.error("Error fetching identity by Feishu ID:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { identityRouter };
