-- Migration 0003: Add role column to users table
--
-- NO-OP: The role column was already included in the initial users table
-- schema (migration 0001_create_users.sql) during Phase 2 implementation.
--
-- The users table already has:
--   role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
--
-- This migration file exists as documentation and to satisfy the Phase 3
-- plan dependency. No schema changes are needed.

SELECT 1; -- no-op placeholder for D1 migration runner
