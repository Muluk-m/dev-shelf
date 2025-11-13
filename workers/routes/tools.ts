import { Hono } from "hono";
import type { CacheContext } from "../../lib/cache-manager";
import {
	checkToolAccess,
	filterToolsByUserPermissions,
} from "../../lib/database/tool-permissions";
import * as toolsDb from "../../lib/database/tools";
import { getCurrentUserId } from "../utils/auth";

const toolsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Helper to get cache context from Hono context
 */
function getCacheContext(c: any): CacheContext {
	return {
		ctx: c.executionCtx,
		kv: c.env.CACHE_KV,
	};
}

// 获取初始化数据（工具、分类、使用统计）
toolsRouter.get("/init", async (c) => {
	try {
		const userId = await getCurrentUserId(c);

		// 并行获取所有数据
		const [allTools, toolCategories, usageStats] = await Promise.all([
			toolsDb.getTools(c.env.DB, getCacheContext(c)),
			toolsDb.getToolCategories(c.env.DB, getCacheContext(c)),
			toolsDb.getToolUsageStats(c.env.DB, 12),
		]);

		// 根据用户权限过滤工具
		const tools = await filterToolsByUserPermissions(
			c.env.DB,
			allTools,
			userId,
		);

		return c.json({
			tools,
			toolCategories,
			usageStats,
		});
	} catch (error) {
		console.error("Error fetching initial data:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

toolsRouter.get("/analytics/usage", async (c) => {
	try {
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) : 8;
		const usageStats = await toolsDb.getToolUsageStats(
			c.env.DB,
			Number.isNaN(limit) ? 8 : limit,
		);
		return c.json(usageStats);
	} catch (error) {
		console.error("Error fetching usage stats:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取所有工具
toolsRouter.get("/", async (c) => {
	try {
		const userId = await getCurrentUserId(c);

		// 获取所有工具（带缓存）
		const allTools = await toolsDb.getTools(c.env.DB, getCacheContext(c));

		// 根据用户权限过滤
		const tools = await filterToolsByUserPermissions(
			c.env.DB,
			allTools,
			userId,
		);

		return c.json(tools);
	} catch (error) {
		console.error("Error fetching tools:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

toolsRouter.post("/:id/usage", async (c) => {
	try {
		const toolId = c.req.param("id");
		const tool = await toolsDb.getToolById(
			c.env.DB,
			toolId,
			getCacheContext(c),
		);
		if (!tool) {
			return c.json({ error: "Tool not found" }, 404);
		}
		await toolsDb.recordToolUsage(c.env.DB, toolId);
		return c.json({ message: "Usage recorded" }, 201);
	} catch (error) {
		console.error("Error recording tool usage:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 检查工具访问权限
toolsRouter.get("/:id/access", async (c) => {
	try {
		const toolIdOrSlug = c.req.param("id");
		const userId = await getCurrentUserId(c);

		// 获取所有工具
		const allTools = await toolsDb.getTools(c.env.DB, getCacheContext(c));

		// 根据 ID 或 slug 查找工具
		const tool = allTools.find((t) => {
			// 先尝试匹配 ID
			if (t.id === toolIdOrSlug) return true;

			// 再尝试匹配 URL slug
			const prodEnv = t.environments.find((e) => e.name === "production");
			if (!prodEnv || prodEnv.isExternal) return false;

			// 提取内部路由的 slug
			const slug = prodEnv.url.startsWith("/tools/")
				? prodEnv.url.slice("/tools/".length)
				: prodEnv.url.replace(/^\/+/, "");

			return slug === toolIdOrSlug;
		});

		// 如果找不到工具，允许访问（可能是新工具还未在数据库中配置）
		if (!tool) {
			return c.json({ hasAccess: true, error: null });
		}

		// 如果工具没有配置权限要求，直接允许访问
		if (!tool.permissionId) {
			return c.json({ hasAccess: true, error: null });
		}

		// 检查访问权限
		const accessCheck = await checkToolAccess(c.env.DB, tool.id, userId);

		return c.json({
			hasAccess: accessCheck.allowed,
			error: accessCheck.allowed
				? null
				: accessCheck.reason || "无权限访问此工具",
		});
	} catch (error) {
		console.error("Error checking tool access:", error);
		// 出错时默认允许访问（fail-open）
		return c.json({ hasAccess: true, error: null });
	}
});

// 获取单个工具
toolsRouter.get("/:id", async (c) => {
	try {
		const toolId = c.req.param("id");
		const userId = await getCurrentUserId(c);

		// 检查访问权限
		const accessCheck = await checkToolAccess(c.env.DB, toolId, userId);
		if (!accessCheck.allowed) {
			return c.json({ error: accessCheck.reason || "无权限访问此工具" }, 403);
		}

		const tool = await toolsDb.getToolById(
			c.env.DB,
			toolId,
			getCacheContext(c),
		);

		if (!tool) {
			return c.json({ error: "Tool not found" }, 404);
		}

		return c.json(tool);
	} catch (error) {
		console.error("Error fetching tool:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 创建工具
toolsRouter.post("/", async (c) => {
	try {
		const toolData = (await c.req.json()) as any;

		// 验证必要字段
		if (!toolData.name || !toolData.description || !toolData.category) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		// 设置默认值
		const tool = {
			...toolData,
			lastUpdated: new Date().toISOString().split("T")[0],
			status: toolData.status || "active",
			isInternal:
				toolData.isInternal !== undefined ? toolData.isInternal : true,
			environments: toolData.environments || [],
			tags: toolData.tags || [],
		};

		const toolId = await toolsDb.createTool(c.env.DB, tool, getCacheContext(c));

		return c.json({ id: toolId, message: "Tool created successfully" }, 201);
	} catch (error) {
		console.error("Error creating tool:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 更新工具
toolsRouter.put("/:id", async (c) => {
	try {
		const toolId = c.req.param("id");
		const toolData = (await c.req.json()) as any;

		// 验证工具是否存在
		const existingTool = await toolsDb.getToolById(
			c.env.DB,
			toolId,
			getCacheContext(c),
		);
		if (!existingTool) {
			return c.json({ error: "Tool not found" }, 404);
		}

		// 验证必要字段
		if (!toolData.name || !toolData.description || !toolData.category) {
			return c.json({ error: "Missing required fields" }, 400);
		}

		// 设置更新值
		const tool = {
			...toolData,
			lastUpdated: new Date().toISOString().split("T")[0],
			isInternal:
				toolData.isInternal !== undefined ? toolData.isInternal : true,
			environments: toolData.environments || [],
			tags: toolData.tags || [],
		};

		await toolsDb.updateTool(c.env.DB, toolId, tool, getCacheContext(c));

		return c.json({ message: "Tool updated successfully" });
	} catch (error) {
		console.error("Error updating tool:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 删除工具
toolsRouter.delete("/:id", async (c) => {
	try {
		const toolId = c.req.param("id");

		// 验证工具是否存在
		const existingTool = await toolsDb.getToolById(
			c.env.DB,
			toolId,
			getCacheContext(c),
		);
		if (!existingTool) {
			return c.json({ error: "Tool not found" }, 404);
		}

		await toolsDb.deleteTool(c.env.DB, toolId, getCacheContext(c));

		return c.json({ message: "Tool deleted successfully" });
	} catch (error) {
		console.error("Error deleting tool:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { toolsRouter };
