import { Hono } from "hono";
import type { CacheContext } from "../../lib/cache-manager";
import * as toolsDb from "../../lib/database/tools";

const categoriesRouter = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Helper to get cache context from Hono context
 */
function getCacheContext(c: any): CacheContext {
	return {
		ctx: c.executionCtx,
	};
}

// 获取所有分类
categoriesRouter.get("/", async (c) => {
	try {
		const categories = await toolsDb.getToolCategories(
			c.env.DB,
			getCacheContext(c),
		);

		return c.json(categories);
	} catch (error) {
		console.error("Error fetching categories:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 创建分类
categoriesRouter.post("/", async (c) => {
	try {
		const categoryData = await c.req.json();
		const categoryId = await toolsDb.createToolCategory(
			c.env.DB,
			categoryData,
			getCacheContext(c),
		);

		return c.json(
			{ id: categoryId, message: "Category created successfully" },
			201,
		);
	} catch (error) {
		console.error("Error creating category:", error);
		return c.json({ error: "Failed to create category" }, 500);
	}
});

// 更新分类
categoriesRouter.put("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const categoryData = await c.req.json();
		await toolsDb.updateToolCategory(
			c.env.DB,
			id,
			categoryData,
			getCacheContext(c),
		);

		return c.json({ message: "Category updated successfully" });
	} catch (error) {
		console.error("Error updating category:", error);
		return c.json({ error: "Failed to update category" }, 500);
	}
});

// 删除分类
categoriesRouter.delete("/:id", async (c) => {
	try {
		const id = c.req.param("id");
		await toolsDb.deleteToolCategory(c.env.DB, id, getCacheContext(c));

		return c.json({ message: "Category deleted successfully" });
	} catch (error) {
		console.error("Error deleting category:", error);
		return c.json({ error: "Failed to delete category" }, 500);
	}
});

export { categoriesRouter };
