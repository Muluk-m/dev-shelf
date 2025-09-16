import { Hono } from "hono";
import * as toolsDb from "../../lib/database/tools";

const toolsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// 获取所有工具
toolsRouter.get("/", async (c) => {
	try {
		const tools = await toolsDb.getTools(c.env.DB);
		return c.json(tools);
	} catch (error) {
		console.error("Error fetching tools:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

// 获取单个工具
toolsRouter.get("/:id", async (c) => {
	try {
		const toolId = c.req.param("id");
		const tool = await toolsDb.getToolById(c.env.DB, toolId);

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

		const toolId = await toolsDb.createTool(c.env.DB, tool);

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
		const existingTool = await toolsDb.getToolById(c.env.DB, toolId);
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

		await toolsDb.updateTool(c.env.DB, toolId, tool);

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
		const existingTool = await toolsDb.getToolById(c.env.DB, toolId);
		if (!existingTool) {
			return c.json({ error: "Tool not found" }, 404);
		}

		await toolsDb.deleteTool(c.env.DB, toolId);

		return c.json({ message: "Tool deleted successfully" });
	} catch (error) {
		console.error("Error deleting tool:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { toolsRouter };
