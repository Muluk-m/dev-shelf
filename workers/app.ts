import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_internal: boolean;
  status: string;
  last_updated: string;
  environments: ToolEnvironment[];
  tags: string[];
}

interface ToolEnvironment {
  name: string;
  label: string;
  url: string;
  is_external: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use('*', cors());

async function getTools(db: D1Database): Promise<Tool[]> {
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
    tool.environments = (envResult.results as any[]).map(env => ({
      ...env,
      isExternal: Boolean(env.is_external)
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

async function getToolCategories(db: D1Database): Promise<ToolCategory[]> {
  const query = `
    SELECT id, name, description, icon, color 
    FROM tool_categories 
    ORDER BY name
  `;
  
  const result = await db.prepare(query).all();
  return result.results as any as ToolCategory[];
}

async function createTool(db: D1Database, tool: Omit<Tool, 'id'>): Promise<string> {
  const toolId = crypto.randomUUID();
  
  try {
    // 开始事务
    await db.batch([
      // 插入工具基本信息
      db.prepare(`
        INSERT INTO tools (id, name, description, category, icon, is_internal, status, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        toolId,
        tool.name,
        tool.description,
        tool.category,
        tool.icon,
        tool.is_internal ? 1 : 0,
        tool.status,
        tool.last_updated
      ),
      // 插入环境信息
      ...tool.environments.map(env => 
        db.prepare(`
          INSERT INTO tool_environments (tool_id, name, label, url, is_external)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          toolId,
          env.name,
          env.label,
          env.url,
          env.is_external ? 1 : 0
        )
      ),
      // 插入标签信息
      ...tool.tags.map(tag =>
        db.prepare(`
          INSERT INTO tool_tags (tool_id, tag)
          VALUES (?, ?)
        `).bind(toolId, tag)
      )
    ]);
    
    return toolId;
  } catch (error) {
    console.error('Error creating tool:', error);
    throw new Error('Failed to create tool');
  }
}

async function updateTool(db: D1Database, id: string, tool: Omit<Tool, 'id'>): Promise<void> {
  try {
    // 开始事务
    await db.batch([
      // 更新工具基本信息
      db.prepare(`
        UPDATE tools 
        SET name = ?, description = ?, category = ?, icon = ?, 
            is_internal = ?, status = ?, last_updated = ?
        WHERE id = ?
      `).bind(
        tool.name,
        tool.description,
        tool.category,
        tool.icon,
        tool.is_internal ? 1 : 0,
        tool.status,
        tool.last_updated,
        id
      ),
      // 删除旧的环境信息
      db.prepare(`DELETE FROM tool_environments WHERE tool_id = ?`).bind(id),
      // 删除旧的标签信息
      db.prepare(`DELETE FROM tool_tags WHERE tool_id = ?`).bind(id),
      // 插入新的环境信息
      ...tool.environments.map(env => 
        db.prepare(`
          INSERT INTO tool_environments (tool_id, name, label, url, is_external)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          id,
          env.name,
          env.label,
          env.url,
          env.is_external ? 1 : 0
        )
      ),
      // 插入新的标签信息
      ...tool.tags.map(tag =>
        db.prepare(`
          INSERT INTO tool_tags (tool_id, tag)
          VALUES (?, ?)
        `).bind(id, tag)
      )
    ]);
  } catch (error) {
    console.error('Error updating tool:', error);
    throw new Error('Failed to update tool');
  }
}

async function deleteTool(db: D1Database, id: string): Promise<void> {
  try {
    // 开始事务
    await db.batch([
      // 删除环境信息
      db.prepare(`DELETE FROM tool_environments WHERE tool_id = ?`).bind(id),
      // 删除标签信息
      db.prepare(`DELETE FROM tool_tags WHERE tool_id = ?`).bind(id),
      // 删除工具
      db.prepare(`DELETE FROM tools WHERE id = ?`).bind(id)
    ]);
  } catch (error) {
    console.error('Error deleting tool:', error);
    throw new Error('Failed to delete tool');
  }
}

async function getToolById(db: D1Database, id: string): Promise<Tool | null> {
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
  tool.environments = (envResult.results as any[]).map(env => ({
    ...env,
    isExternal: Boolean(env.is_external)
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

// API 路由
app.get('/api/tools', async (c) => {
  try {
    const tools = await getTools(c.env.DB);
    return c.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/categories', async (c) => {
  try {
    const categories = await getToolCategories(c.env.DB);
    return c.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/api/tools/:id', async (c) => {
  try {
    const toolId = c.req.param('id');
    const tool = await getToolById(c.env.DB, toolId);
    
    if (!tool) {
      return c.json({ error: 'Tool not found' }, 404);
    }
    
    return c.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 创建工具
app.post('/api/tools', async (c) => {
  try {
    const toolData = await c.req.json() as Omit<Tool, 'id'>;
    
    // 验证必要字段
    if (!toolData.name || !toolData.description || !toolData.category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // 设置默认值
    const tool = {
      ...toolData,
      last_updated: new Date().toISOString().split('T')[0],
      status: toolData.status || 'active',
      is_internal: (toolData as any).isInternal !== undefined ? (toolData as any).isInternal : true,
      environments: toolData.environments || [],
      tags: toolData.tags || []
    };
    
    const toolId = await createTool(c.env.DB, tool);
    
    return c.json({ id: toolId, message: 'Tool created successfully' }, 201);
  } catch (error) {
    console.error('Error creating tool:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 更新工具
app.put('/api/tools/:id', async (c) => {
  try {
    const toolId = c.req.param('id');
    const toolData = await c.req.json() as Omit<Tool, 'id'>;
    
    // 验证工具是否存在
    const existingTool = await getToolById(c.env.DB, toolId);
    if (!existingTool) {
      return c.json({ error: 'Tool not found' }, 404);
    }
    
    // 验证必要字段
    if (!toolData.name || !toolData.description || !toolData.category) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // 设置更新值
    const tool = {
      ...toolData,
      last_updated: new Date().toISOString().split('T')[0],
      is_internal: (toolData as any).isInternal !== undefined ? (toolData as any).isInternal : true,
      environments: toolData.environments || [],
      tags: toolData.tags || []
    };
    
    await updateTool(c.env.DB, toolId, tool);
    
    return c.json({ message: 'Tool updated successfully' });
  } catch (error) {
    console.error('Error updating tool:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// 删除工具
app.delete('/api/tools/:id', async (c) => {
  try {
    const toolId = c.req.param('id');
    
    // 验证工具是否存在
    const existingTool = await getToolById(c.env.DB, toolId);
    if (!existingTool) {
      return c.json({ error: 'Tool not found' }, 404);
    }
    
    await deleteTool(c.env.DB, toolId);
    
    return c.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
