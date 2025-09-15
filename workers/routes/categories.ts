import { Hono } from "hono";
import * as toolsDb from "../../lib/database/tools";

const categoriesRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// 获取所有分类
categoriesRouter.get("/", async (c) => {
	try {
		const categories = await toolsDb.getToolCategories(c.env.DB);
		return c.json(categories);
	} catch (error) {
		console.error("Error fetching categories:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { categoriesRouter };
