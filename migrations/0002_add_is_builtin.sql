-- Add is_builtin column to tools table
-- Marks tools that are built into the DevShelf codebase (auto-seeded, not manually registered)
ALTER TABLE tools ADD COLUMN is_builtin BOOLEAN DEFAULT FALSE;

-- Add builtin category
INSERT OR IGNORE INTO tool_categories (id, name, description, icon, color) VALUES
  ('builtin', '内置工具', 'DevShelf 内置的开发者工具', 'Puzzle', '#6366f1');
