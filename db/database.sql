-- DevHub Database Schema
-- This file contains only DDL statements and generic seed data.
-- Run with: wrangler d1 execute devhub-database --local --file=db/database.sql

PRAGMA defer_foreign_keys=TRUE;

CREATE TABLE IF NOT EXISTS tool_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'deprecated')),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category) REFERENCES tool_categories (id)
);

CREATE TABLE IF NOT EXISTS tool_environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  is_external BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tool_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE,
  UNIQUE (tool_id, tag)
);

CREATE TABLE IF NOT EXISTS tool_usage_events (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tool_id) REFERENCES tools (id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preferences_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools (category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools (status);
CREATE INDEX IF NOT EXISTS idx_tool_environments_tool_id ON tool_environments (tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tool_id ON tool_tags (tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_tags_tag ON tool_tags (tag);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage_events (tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage_events (used_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences (user_id);

-- Generic seed categories
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('development', 'Development', 'Code development and debugging tools', 'Code', '#10b981');
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('testing', 'Testing', 'Automated testing and quality assurance tools', 'TestTube', '#c084fc');
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('deployment', 'Deployment', 'CI/CD and deployment management tools', 'Rocket', '#f59f45');
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('monitoring', 'Monitoring', 'System monitoring and log analysis tools', 'BarChart', '#ef4444');
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('database', 'Database', 'Database management and operations tools', 'Database', '#f59f45');
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('utilities', 'Utilities', 'General purpose utility tools', 'Wrench', '#64748b');
