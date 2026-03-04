-- Add permission_id column to tools table
-- Referenced in application code but missing from initial schema
ALTER TABLE tools ADD COLUMN permission_id TEXT;
