import { Hono } from "hono";
import { z } from "zod";
import type { CacheContext } from "../../lib/cache-manager";
import * as toolsDb from "../../lib/database/tools";
import { requireAdmin } from "../middleware/rbac";

const categorySchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).default(""),
	icon: z.string().max(100).default(""),
	color: z.string().max(20).default(""),
});

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

// 创建分类 (admin only)
categoriesRouter.post("/", requireAdmin, async (c) => {
	try {
		const body = await c.req.json();
		const result = categorySchema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map((i) => i.message);
			return c.json({ error: "Validation failed", details: errors }, 400);
		}

		const categoryId = await toolsDb.createToolCategory(
			c.env.DB,
			result.data,
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

// 更新分类 (admin only)
categoriesRouter.put("/:id", requireAdmin, async (c) => {
	try {
		const id = c.req.param("id");
		const body = await c.req.json();
		const result = categorySchema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map((i) => i.message);
			return c.json({ error: "Validation failed", details: errors }, 400);
		}

		await toolsDb.updateToolCategory(
			c.env.DB,
			id,
			result.data,
			getCacheContext(c),
		);

		return c.json({ message: "Category updated successfully" });
	} catch (error) {
		console.error("Error updating category:", error);
		return c.json({ error: "Failed to update category" }, 500);
	}
});

// 删除分类 (admin only)
categoriesRouter.delete("/:id", requireAdmin, async (c) => {
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
