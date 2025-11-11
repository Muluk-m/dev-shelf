-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  feishu_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action)
);

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 资源级别权限控制
CREATE TABLE IF NOT EXISTS resource_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 扩展工具表 - 添加可选的权限控制
ALTER TABLE tools ADD COLUMN permission_id TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_feishu_id ON users(feishu_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_resource_permissions_user_id ON resource_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_tools_permission_id ON tools(permission_id);

-- 插入默认角色
INSERT INTO roles (id, name, description) VALUES
  ('visitor', 'visitor', '访客 - 可查看公开页面和工具'),
  ('user', 'user', '普通用户 - 可使用所有公开工具'),
  ('developer', 'developer', '开发人员 - 可访问内部工具'),
  ('admin', 'admin', '管理员 - 拥有所有权限');

-- 插入默认权限
INSERT INTO permissions (id, resource, action, description) VALUES
  ('perm_tool_read', 'tool', 'read', '查看工具'),
  ('perm_tool_write', 'tool', 'write', '创建/编辑工具'),
  ('perm_tool_delete', 'tool', 'delete', '删除工具'),
  ('perm_tool_admin', 'tool', 'admin', '管理所有工具'),
  ('perm_category_read', 'category', 'read', '查看分类'),
  ('perm_category_write', 'category', 'write', '创建/编辑分类'),
  ('perm_category_delete', 'category', 'delete', '删除分类'),
  ('perm_user_read', 'user', 'read', '查看用户'),
  ('perm_user_write', 'user', 'write', '管理用户'),
  ('perm_permission_read', 'permission', 'read', '查看权限'),
  ('perm_permission_write', 'permission', 'write', '管理权限');

-- 角色权限分配
-- visitor: 只能查看
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('visitor', 'perm_tool_read'),
  ('visitor', 'perm_category_read');

-- user: visitor 权限 + 使用工具
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('user', 'perm_tool_read'),
  ('user', 'perm_category_read');

-- developer: user 权限 + 访问内部工具
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('developer', 'perm_tool_read'),
  ('developer', 'perm_category_read');

-- admin: 所有权限
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('admin', 'perm_tool_read'),
  ('admin', 'perm_tool_write'),
  ('admin', 'perm_tool_delete'),
  ('admin', 'perm_tool_admin'),
  ('admin', 'perm_category_read'),
  ('admin', 'perm_category_write'),
  ('admin', 'perm_category_delete'),
  ('admin', 'perm_user_read'),
  ('admin', 'perm_user_write'),
  ('admin', 'perm_permission_read'),
  ('admin', 'perm_permission_write');
