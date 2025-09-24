CREATE TABLE tool_usage_events (
	id TEXT PRIMARY KEY,
	tool_id TEXT NOT NULL,
	used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (tool_id) REFERENCES tools (id)
);

CREATE INDEX idx_tool_usage_tool_id ON tool_usage_events (tool_id);
CREATE INDEX idx_tool_usage_used_at ON tool_usage_events (used_at);