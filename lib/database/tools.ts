import type { Tool, ToolCategory } from "../types/tool";

export async function getTools(db: D1Database): Promise<Tool[]> {
  const toolsQuery = `
    SELECT 
      t.id, t.name, t.description, t.category, t.icon, 
      t.is_internal, t.status, t.last_updated
    FROM tools t 
    WHERE t.status = 'active'
    ORDER BY t.name
  `;

  const toolsResult = await db.prepare(toolsQuery).all();
  const tools = toolsResult.results as any[];

  for (const tool of tools) {
    // 映射数据库字段到前端格式
    tool.isInternal = Boolean(tool.is_internal);
    tool.lastUpdated = tool.last_updated;
    delete tool.is_internal;
    delete tool.last_updated;

    // 获取环境信息
    const envQuery = `
      SELECT name, label, url, is_external 
      FROM tool_environments 
      WHERE tool_id = ?
    `;
    const envResult = await db.prepare(envQuery).bind(tool.id).all();
    tool.environments = (envResult.results as any[]).map((env) => ({
      ...env,
      isExternal: Boolean(env.is_external),
    }));

    // 获取标签信息
    const tagsQuery = `
      SELECT tag 
      FROM tool_tags 
      WHERE tool_id = ?
    `;
    const tagsResult = await db.prepare(tagsQuery).bind(tool.id).all();
    tool.tags = tagsResult.results.map((t: any) => t.tag);
  }

  return tools;
}

export async function getToolCategories(
  db: D1Database
): Promise<ToolCategory[]> {
  const query = `
    SELECT id, name, description, icon, color 
    FROM tool_categories 
    ORDER BY name
  `;
  const result = await db.prepare(query).all();
  return result.results as any as ToolCategory[];
}

export async function getToolById(
  db: D1Database,
  id: string
): Promise<Tool | null> {
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

  // 映射数据库字段到前端格式
  tool.isInternal = Boolean(tool.is_internal);
  tool.lastUpdated = tool.last_updated;
  delete tool.is_internal;
  delete tool.last_updated;

  // 获取环境信息
  const envQuery = `
    SELECT name, label, url, is_external 
    FROM tool_environments 
    WHERE tool_id = ?
  `;
  const envResult = await db.prepare(envQuery).bind(id).all();
  tool.environments = (envResult.results as any[]).map((env) => ({
    ...env,
    isExternal: Boolean(env.is_external),
  }));

  // 获取标签信息
  const tagsQuery = `
    SELECT tag 
    FROM tool_tags 
    WHERE tool_id = ?
  `;
  const tagsResult = await db.prepare(tagsQuery).bind(id).all();
  tool.tags = tagsResult.results.map((t: any) => t.tag);

  return tool;
}

export async function createTool(
  db: D1Database,
  tool: Omit<Tool, "id">
): Promise<string> {
  const toolId = crypto.randomUUID();

  try {
    // 开始事务
    await db.batch([
      // 插入工具基本信息
      db
        .prepare(
          `
        INSERT INTO tools (id, name, description, category, icon, is_internal, status, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
          tool.lastUpdated
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

    return toolId;
  } catch (error) {
    console.error("Error creating tool:", error);
    throw new Error("Failed to create tool");
  }
}

export async function updateTool(
  db: D1Database,
  id: string,
  tool: Omit<Tool, "id">
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
            is_internal = ?, status = ?, last_updated = ?
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
  } catch (error) {
    console.error("Error updating tool:", error);
    throw new Error("Failed to update tool");
  }
}

export async function deleteTool(db: D1Database, id: string): Promise<void> {
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
  } catch (error) {
    console.error("Error deleting tool:", error);
    throw new Error("Failed to delete tool");
  }
}