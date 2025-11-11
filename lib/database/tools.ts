import { CacheManager, type CacheContext } from "../cache-manager";
import type { Tool, ToolCategory } from "../types/tool";

export interface ToolUsageStat {
	toolId: string;
	name: string;
	category: string;
	usageCount: number;
	lastUsed: string | null;
	status: Tool["status"];
	isInternal: boolean;
}

const TOOLS_CACHE_NAME = "tools";
const TOOLS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
export const TOOLS_CACHE_KEYS = {
  list: "/tools/list",
  detail: (id: string) => `/tools/${id}`,
} as const;

const TOOL_CATEGORIES_CACHE_NAME = "categories";
const TOOL_CATEGORIES_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
export const TOOL_CATEGORIES_CACHE_KEYS = {
  list: "/tool-categories/list",
} as const;

export async function getTools(db: D1Database, context?: CacheContext): Promise<Tool[]> {
  return CacheManager.getJson(
    TOOLS_CACHE_NAME,
    TOOLS_CACHE_KEYS.list,
    async () => {
      const toolsQuery = `
        SELECT
          t.id, t.name, t.description, t.category, t.icon,
          t.is_internal, t.status, t.last_updated, t.permission_id
        FROM tools t
        WHERE t.status = 'active'
        ORDER BY t.name
      `;

      const toolsResult = await db.prepare(toolsQuery).all();
      const tools = toolsResult.results as any[];

      for (const tool of tools) {
        tool.isInternal = Boolean(tool.is_internal);
        tool.lastUpdated = tool.last_updated;
        tool.permissionId = tool.permission_id;
        delete tool.is_internal;
        delete tool.last_updated;
        delete tool.permission_id;

        const envQuery = `
          SELECT name, label, url, is_external
          FROM tool_environments
          WHERE tool_id = ?
          ORDER BY name ASC
        `;
        const envResult = await db.prepare(envQuery).bind(tool.id).all();
        tool.environments = (envResult.results as any[]).map((env) => ({
          ...env,
          isExternal: Boolean(env.is_external)
        }));

        const tagsQuery = `
          SELECT tag
          FROM tool_tags
          WHERE tool_id = ?
        `;
        const tagsResult = await db.prepare(tagsQuery).bind(tool.id).all();
        tool.tags = tagsResult.results.map((t: any) => t.tag);
      }

      return tools as Tool[];
    },
    { ttlSeconds: TOOLS_CACHE_TTL_SECONDS, context }
  );
}

export async function getToolCategories(
  db: D1Database,
  context?: CacheContext
): Promise<ToolCategory[]> {
  return CacheManager.getJson(
    TOOL_CATEGORIES_CACHE_NAME,
    TOOL_CATEGORIES_CACHE_KEYS.list,
    async () => {
      const query = `
        SELECT id, name, description, icon, color 
        FROM tool_categories 
        ORDER BY name
      `;
      const result = await db.prepare(query).all();
      return result.results as any as ToolCategory[];
    },
    { ttlSeconds: TOOL_CATEGORIES_CACHE_TTL_SECONDS, context }
  );
}

export async function getToolById(
  db: D1Database,
  id: string,
  context?: CacheContext
): Promise<Tool | null> {
  return CacheManager.getJson(
    TOOLS_CACHE_NAME,
    TOOLS_CACHE_KEYS.detail(id),
    async () => {
      const toolQuery = `
        SELECT 
          t.id, t.name, t.description, t.category, t.icon, 
          t.is_internal, t.status, t.last_updated
        FROM tools t 
        WHERE t.id = ?
      `;

      const toolResult = await db.prepare(toolQuery).bind(id).first();

      if (!toolResult) {
        return null;
      }

      const tool = toolResult as any;

      tool.isInternal = Boolean(tool.is_internal);
      tool.lastUpdated = tool.last_updated;
      delete tool.is_internal;
      delete tool.last_updated;

      const envQuery = `
        SELECT name, label, url, is_external
        FROM tool_environments
        WHERE tool_id = ?
        ORDER BY name ASC
      `;
      const envResult = await db.prepare(envQuery).bind(id).all();
      tool.environments = (envResult.results as any[]).map((env) => ({
        ...env,
        isExternal: Boolean(env.is_external)
      }));

      const tagsQuery = `
        SELECT tag 
        FROM tool_tags 
        WHERE tool_id = ?
      `;
      const tagsResult = await db.prepare(tagsQuery).bind(id).all();
      tool.tags = tagsResult.results.map((t: any) => t.tag);

      return tool as Tool;
    },
    {
      ttlSeconds: TOOLS_CACHE_TTL_SECONDS,
      shouldCache: (payload) => payload !== null,
      context
    }
  );
}

export async function createTool(
  db: D1Database,
  tool: Omit<Tool, "id">,
  context?: CacheContext
): Promise<string> {
  const toolId = crypto.randomUUID();

  try {
    // 开始事务
    await db.batch([
      // 插入工具基本信息
      db
        .prepare(
          `
        INSERT INTO tools (id, name, description, category, icon, is_internal, status, last_updated, permission_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .bind(
          toolId,
          tool.name,
          tool.description,
          tool.category,
          tool.icon,
          tool.isInternal ? 1 : 0,
          tool.status,
          tool.lastUpdated,
          tool.permissionId || null
        ),
      // 插入环境信息
      ...tool.environments.map((env) =>
        db
          .prepare(
            `
          INSERT INTO tool_environments (tool_id, name, label, url, is_external)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .bind(toolId, env.name, env.label, env.url, env.isExternal ? 1 : 0)
      ),
      // 插入标签信息
      ...tool.tags.map((tag) =>
        db
          .prepare(
            `
          INSERT INTO tool_tags (tool_id, tag)
          VALUES (?, ?)
        `
          )
          .bind(toolId, tag)
      ),
    ]);

    await CacheManager.clearCache(TOOLS_CACHE_NAME, [TOOLS_CACHE_KEYS.list], context);

    return toolId;
  } catch (error) {
    console.error("Error creating tool:", error);
    throw new Error("Failed to create tool");
  }
}

export async function updateTool(
  db: D1Database,
  id: string,
  tool: Omit<Tool, "id">,
  context?: CacheContext
): Promise<void> {
  try {
    // 开始事务
    await db.batch([
      // 更新工具基本信息
      db
        .prepare(
          `
        UPDATE tools
        SET name = ?, description = ?, category = ?, icon = ?,
            is_internal = ?, status = ?, last_updated = ?, permission_id = ?
        WHERE id = ?
      `
        )
        .bind(
          tool.name,
          tool.description,
          tool.category,
          tool.icon,
          tool.isInternal ? 1 : 0,
          tool.status,
          tool.lastUpdated,
          tool.permissionId || null,
          id
        ),
      // 删除旧的环境信息
      db.prepare(`DELETE FROM tool_environments WHERE tool_id = ?`).bind(id),
      // 删除旧的标签信息
      db.prepare(`DELETE FROM tool_tags WHERE tool_id = ?`).bind(id),
      // 插入新的环境信息
      ...tool.environments.map((env) =>
        db
          .prepare(
            `
          INSERT INTO tool_environments (tool_id, name, label, url, is_external)
          VALUES (?, ?, ?, ?, ?)
        `
          )
          .bind(id, env.name, env.label, env.url, env.isExternal ? 1 : 0)
      ),
      // 插入新的标签信息
      ...tool.tags.map((tag) =>
        db
          .prepare(
            `
          INSERT INTO tool_tags (tool_id, tag)
          VALUES (?, ?)
        `
          )
          .bind(id, tag)
      ),
    ]);

    await CacheManager.clearCache(TOOLS_CACHE_NAME, [
      TOOLS_CACHE_KEYS.list,
      TOOLS_CACHE_KEYS.detail(id),
    ], context);
  } catch (error) {
    console.error("Error updating tool:", error);
    throw new Error("Failed to update tool");
  }
}

export async function deleteTool(db: D1Database, id: string, context?: CacheContext): Promise<void> {
  try {
    // 开始事务
    await db.batch([
      // 删除环境信息
      db.prepare(`DELETE FROM tool_environments WHERE tool_id = ?`).bind(id),
      // 删除标签信息
      db.prepare(`DELETE FROM tool_tags WHERE tool_id = ?`).bind(id),
      // 删除工具
      db.prepare(`DELETE FROM tools WHERE id = ?`).bind(id),
    ]);

    await CacheManager.clearCache(TOOLS_CACHE_NAME, [
      TOOLS_CACHE_KEYS.list,
      TOOLS_CACHE_KEYS.detail(id),
    ], context);
  } catch (error) {
    console.error("Error deleting tool:", error);
    throw new Error("Failed to delete tool");
  }
}

export async function createToolCategory(
  db: D1Database,
  category: Omit<ToolCategory, "id">,
  context?: CacheContext
): Promise<string> {
  const categoryId = crypto.randomUUID();

  try {
    await db
      .prepare(
        `
        INSERT INTO tool_categories (id, name, description, icon, color)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .bind(categoryId, category.name, category.description, category.icon, category.color)
      .run();

    await CacheManager.clearCache(TOOL_CATEGORIES_CACHE_NAME, [
      TOOL_CATEGORIES_CACHE_KEYS.list,
    ], context);

    return categoryId;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

export async function updateToolCategory(
  db: D1Database,
  id: string,
  category: Omit<ToolCategory, "id">,
  context?: CacheContext
): Promise<void> {
  try {
    await db
      .prepare(
        `
        UPDATE tool_categories
        SET name = ?, description = ?, icon = ?, color = ?
        WHERE id = ?
      `
      )
      .bind(category.name, category.description, category.icon, category.color, id)
      .run();

    await CacheManager.clearCache(TOOL_CATEGORIES_CACHE_NAME, [
      TOOL_CATEGORIES_CACHE_KEYS.list,
    ], context);
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
}

export async function deleteToolCategory(db: D1Database, id: string, context?: CacheContext): Promise<void> {
  try {
    // 注意：这里不删除使用该分类的工具，只是删除分类本身
    // 实际生产环境中可能需要先处理引用该分类的工具
    await db.prepare(`DELETE FROM tool_categories WHERE id = ?`).bind(id).run();

    await CacheManager.clearCache(TOOL_CATEGORIES_CACHE_NAME, [
      TOOL_CATEGORIES_CACHE_KEYS.list,
    ], context);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}

export async function recordToolUsage(
  db: D1Database,
  toolId: string
): Promise<void> {
  try {
    const usageId = crypto.randomUUID();
    await db
      .prepare(
        `
        INSERT INTO tool_usage_events (id, tool_id)
        VALUES (?, ?)
      `
      )
      .bind(usageId, toolId)
      .run();
  } catch (error) {
    console.error("Error recording tool usage:", error);
  }
}

export async function getToolUsageStats(
  db: D1Database,
  limit = 8
): Promise<ToolUsageStat[]> {
  const query = `
    SELECT
      t.id AS tool_id,
      t.name,
      t.category,
      t.status,
      t.is_internal,
      COUNT(u.id) AS usage_count,
      MAX(u.used_at) AS last_used
    FROM tools t
    LEFT JOIN tool_usage_events u ON t.id = u.tool_id
    GROUP BY t.id, t.name, t.category, t.status, t.is_internal
    ORDER BY usage_count DESC, last_used DESC
    LIMIT ?
  `;
  const result = await db.prepare(query).bind(limit).all();
  return (result.results as any[]).map((row) => ({
    toolId: row.tool_id,
    name: row.name,
    category: row.category,
    usageCount: Number(row.usage_count) || 0,
    lastUsed: row.last_used ?? null,
    status: row.status,
    isInternal: Boolean(row.is_internal),
  }));
}
