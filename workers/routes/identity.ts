import { Hono } from "hono";

const identityRouter = new Hono<{ Bindings: Cloudflare.Env }>();

type IdentityUpsertBody = {
	github_actor_id?: string | number;
	feishu_user_id?: string;
	feishu_username?: string;
	feishu_user_email?: string;
};

// 获取所有 GitHub-飞书身份映射
identityRouter.get("/", async (c) => {
	try {
		const result = await c.env.DB.prepare(
			"SELECT * FROM github_feishu_identity ORDER BY updated_at DESC",
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

// 录入/更新 GitHub-飞书身份映射
identityRouter.post("/", async (c) => {
	try {
		let body: IdentityUpsertBody;
		try {
			body = await c.req.json<IdentityUpsertBody>();
		} catch {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const githubActorId = String(body.github_actor_id ?? "").trim();
		const feishuUserId = (body.feishu_user_id || "").trim();
		const feishuUsername = (body.feishu_username || "").trim();
		const feishuUserEmail = (body.feishu_user_email || "").trim();

		if (
			!githubActorId ||
			!feishuUserId ||
			!feishuUsername ||
			!feishuUserEmail
		) {
			return c.json(
				{
					error:
						"Missing required fields: github_actor_id, feishu_user_id, feishu_username, feishu_user_email",
				},
				400,
			);
		}

		const [actorMatched, feishuMatched] = await Promise.all([
			c.env.DB.prepare(
				"SELECT github_actor_id, feishu_user_id FROM github_feishu_identity WHERE github_actor_id = ?",
			)
				.bind(githubActorId)
				.first<{ github_actor_id: string; feishu_user_id: string }>(),
			c.env.DB.prepare(
				"SELECT github_actor_id, feishu_user_id FROM github_feishu_identity WHERE feishu_user_id = ?",
			)
				.bind(feishuUserId)
				.first<{ github_actor_id: string; feishu_user_id: string }>(),
		]);

		if (actorMatched && actorMatched.feishu_user_id !== feishuUserId) {
			return c.json(
				{
					error:
						"This github_actor_id is already bound to another feishu_user_id",
				},
				409,
			);
		}

		if (feishuMatched && feishuMatched.github_actor_id !== githubActorId) {
			return c.json(
				{
					error:
						"This feishu_user_id is already bound to another github_actor_id",
				},
				409,
			);
		}

		if (actorMatched || feishuMatched) {
			await c.env.DB.prepare(
				`UPDATE github_feishu_identity
				SET feishu_username = ?, feishu_user_email = ?, updated_at = CURRENT_TIMESTAMP
				WHERE github_actor_id = ? AND feishu_user_id = ?`,
			)
				.bind(feishuUsername, feishuUserEmail, githubActorId, feishuUserId)
				.run();

			const updated = await c.env.DB.prepare(
				"SELECT * FROM github_feishu_identity WHERE github_actor_id = ? AND feishu_user_id = ?",
			)
				.bind(githubActorId, feishuUserId)
				.first();

			return c.json(
				{ message: "Identity updated successfully", data: updated },
				200,
			);
		}

		await c.env.DB.prepare(
			`INSERT INTO github_feishu_identity
			(github_actor_id, feishu_user_id, feishu_username, feishu_user_email)
			VALUES (?, ?, ?, ?)`,
		)
			.bind(githubActorId, feishuUserId, feishuUsername, feishuUserEmail)
			.run();

		const created = await c.env.DB.prepare(
			"SELECT * FROM github_feishu_identity WHERE github_actor_id = ? AND feishu_user_id = ?",
		)
			.bind(githubActorId, feishuUserId)
			.first();

		return c.json({ message: "Identity created successfully", data: created }, 201);
	} catch (error) {
		console.error("Error upserting identity:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { identityRouter };
