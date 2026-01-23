import type { PublicUser, Session, User } from "../types/auth";

// Database row interfaces (snake_case as stored in D1)
interface UserRow {
	id: string;
	username: string;
	display_name: string;
	password_hash: string;
	role: string;
	created_at: string;
	updated_at: string;
}

interface SessionRow {
	id: string;
	user_id: string;
	refresh_token: string;
	expires_at: string;
	created_at: string;
}

// Mapping functions: snake_case (DB) -> camelCase (API)

function mapUserFromDb(row: UserRow): User {
	return {
		id: row.id,
		username: row.username,
		displayName: row.display_name,
		passwordHash: row.password_hash,
		role: row.role as "admin" | "user",
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
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

function mapSessionFromDb(row: SessionRow): Session {
	return {
		id: row.id,
		userId: row.user_id,
		refreshToken: row.refresh_token,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
	};
}

// User CRUD operations

export async function getUserByUsername(
	db: D1Database,
	username: string,
): Promise<User | null> {
	const row = await db
		.prepare("SELECT * FROM users WHERE username = ?")
		.bind(username)
		.first<UserRow>();

	return row ? mapUserFromDb(row) : null;
}

export async function getUserById(
	db: D1Database,
	id: string,
): Promise<User | null> {
	const row = await db
		.prepare("SELECT * FROM users WHERE id = ?")
		.bind(id)
		.first<UserRow>();

	return row ? mapUserFromDb(row) : null;
}

export async function getPublicUserById(
	db: D1Database,
	id: string,
): Promise<PublicUser | null> {
	const row = await db
		.prepare("SELECT * FROM users WHERE id = ?")
		.bind(id)
		.first<UserRow>();

	return row ? mapPublicUserFromDb(row) : null;
}

export async function createUser(
	db: D1Database,
	data: {
		id: string;
		username: string;
		displayName: string;
		passwordHash: string;
		role: string;
	},
): Promise<PublicUser> {
	await db
		.prepare(
			`INSERT INTO users (id, username, display_name, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
		)
		.bind(data.id, data.username, data.displayName, data.passwordHash, data.role)
		.run();

	const row = await db
		.prepare("SELECT * FROM users WHERE id = ?")
		.bind(data.id)
		.first<UserRow>();

	if (!row) {
		throw new Error("Failed to retrieve created user");
	}

	return mapPublicUserFromDb(row);
}

export async function updateUserProfile(
	db: D1Database,
	userId: string,
	data: { displayName: string },
): Promise<void> {
	await db
		.prepare(
			"UPDATE users SET display_name = ?, updated_at = datetime('now') WHERE id = ?",
		)
		.bind(data.displayName, userId)
		.run();
}

export async function updateUserPassword(
	db: D1Database,
	userId: string,
	passwordHash: string,
): Promise<void> {
	await db
		.prepare(
			"UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
		)
		.bind(passwordHash, userId)
		.run();
}

// Session management

export async function createSession(
	db: D1Database,
	userId: string,
	refreshToken: string,
	expiresAt: string,
): Promise<void> {
	const id = crypto.randomUUID();
	await db
		.prepare(
			"INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)",
		)
		.bind(id, userId, refreshToken, expiresAt)
		.run();
}

export async function getSessionByToken(
	db: D1Database,
	refreshToken: string,
): Promise<Session | null> {
	const row = await db
		.prepare(
			"SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime('now')",
		)
		.bind(refreshToken)
		.first<SessionRow>();

	return row ? mapSessionFromDb(row) : null;
}

export async function deleteSession(
	db: D1Database,
	sessionId: string,
): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE id = ?")
		.bind(sessionId)
		.run();
}

export async function deleteUserSessions(
	db: D1Database,
	userId: string,
): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE user_id = ?")
		.bind(userId)
		.run();
}

export async function deleteUserSessionsExcept(
	db: D1Database,
	userId: string,
	exceptSessionId: string,
): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?")
		.bind(userId, exceptSessionId)
		.run();
}

export async function cleanExpiredSessions(db: D1Database): Promise<void> {
	await db
		.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')")
		.run();
}
