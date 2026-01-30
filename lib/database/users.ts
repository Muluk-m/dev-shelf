import type { PublicUser, User } from "../types/auth";

/**
 * User management database operations for admin and setup flows.
 *
 * Core user CRUD (getUserById, getUserByUsername, createUser, updateUserPassword)
 * lives in lib/database/auth.ts (Phase 2). This module provides the additional
 * operations required by Phase 3: user count, list all users, and role management.
 */

// Database row interface (snake_case as stored in D1)
interface UserRow {
	id: string;
	username: string;
	display_name: string;
	password_hash: string;
	role: string;
	created_at: string;
	updated_at: string;
}

function mapPublicUserFromDb(row: UserRow): PublicUser {
	return {
		id: row.id,
		username: row.username,
		displayName: row.display_name,
		role: row.role as "admin" | "user",
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

/**
 * Get total number of users in the database.
 * Used by the setup flow to detect first-run state.
 */
export async function getUserCount(db: D1Database): Promise<number> {
	const result = await db
		.prepare("SELECT COUNT(*) AS count FROM users")
		.first<{ count: number }>();

	return result?.count ?? 0;
}

/**
 * Get all users without password data.
 * Used by admin user management.
 */
export async function getAllUsers(db: D1Database): Promise<PublicUser[]> {
	const result = await db
		.prepare(
			"SELECT id, username, display_name, password_hash, role, created_at, updated_at FROM users ORDER BY created_at ASC",
		)
		.all<UserRow>();

	return result.results.map(mapPublicUserFromDb);
}

/**
 * Update a user's role.
 * Validates that the role is one of the allowed values.
 */
export async function updateUserRole(
	db: D1Database,
	userId: string,
	role: "admin" | "user",
): Promise<void> {
	await db
		.prepare(
			"UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?",
		)
		.bind(role, userId)
		.run();
}
