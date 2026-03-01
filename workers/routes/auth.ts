import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import {
	createSession,
	createUser,
	deleteUserSessions,
	getPublicUserById,
	getUserByUsername,
} from "../../lib/database/auth";
import {
	ACCESS_TOKEN_EXPIRY,
	generateAccessToken,
	hashPassword,
	verifyPassword,
} from "../utils/auth";

const auth = new Hono<{ Bindings: Cloudflare.Env }>();

// Validation schemas
const registerSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(50, "Username must be at most 50 characters")
		.regex(
			/^[a-zA-Z0-9_]+$/,
			"Username can only contain letters, numbers, and underscores",
		),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be at most 128 characters"),
	displayName: z
		.string()
		.min(1, "Display name cannot be empty")
		.max(100, "Display name must be at most 100 characters")
		.optional(),
});

const loginSchema = z.object({
	username: z.string().min(1, "Username is required"),
	password: z.string().min(1, "Password is required"),
});

/**
 * Set the access_token cookie with standard flags.
 */
function setAccessTokenCookie(
	c: Parameters<typeof setCookie>[0],
	token: string,
): void {
	setCookie(c, "access_token", token, {
		httpOnly: true,
		secure: true,
		sameSite: "Lax",
		path: "/",
		maxAge: ACCESS_TOKEN_EXPIRY,
	});
}

/**
 * Clear the access_token cookie.
 */
function clearAccessTokenCookie(
	c: Parameters<typeof setCookie>[0],
): void {
	setCookie(c, "access_token", "", {
		httpOnly: true,
		secure: true,
		sameSite: "Lax",
		path: "/",
		maxAge: 0,
	});
}

// POST /api/auth/register
auth.post("/register", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const result = registerSchema.safeParse(body);
	if (!result.success) {
		const errors = result.error.issues.map((i) => i.message);
		return c.json({ error: "Validation failed", details: errors }, 400);
	}

	const { username, password, displayName } = result.data;

	// Check for existing username
	const existingUser = await getUserByUsername(c.env.DB, username);
	if (existingUser) {
		return c.json({ error: "Username already taken" }, 409);
	}

	// Hash password and create user
	const passwordHash = await hashPassword(password);
	const userId = crypto.randomUUID();

	const user = await createUser(c.env.DB, {
		id: userId,
		username,
		displayName: displayName || username,
		passwordHash,
		role: "user",
	});

	// Generate access token and create session
	const accessToken = await generateAccessToken(
		userId,
		"user",
		c.env.JWT_SECRET,
	);
	const refreshToken = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + ACCESS_TOKEN_EXPIRY * 1000,
	).toISOString();
	await createSession(c.env.DB, userId, refreshToken, expiresAt);

	// Set cookie
	setAccessTokenCookie(c, accessToken);

	return c.json({ user }, 201);
});

// POST /api/auth/login
auth.post("/login", async (c) => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	const result = loginSchema.safeParse(body);
	if (!result.success) {
		const errors = result.error.issues.map((i) => i.message);
		return c.json({ error: "Validation failed", details: errors }, 400);
	}

	const { username, password } = result.data;

	// Look up user
	const user = await getUserByUsername(c.env.DB, username);
	if (!user) {
		return c.json({ error: "Invalid credentials" }, 401);
	}

	// Verify password
	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		return c.json({ error: "Invalid credentials" }, 401);
	}

	// Generate access token and create session
	const accessToken = await generateAccessToken(
		user.id,
		user.role,
		c.env.JWT_SECRET,
	);
	const refreshToken = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + ACCESS_TOKEN_EXPIRY * 1000,
	).toISOString();
	await createSession(c.env.DB, user.id, refreshToken, expiresAt);

	// Set cookie
	setAccessTokenCookie(c, accessToken);

	// Return public user (no passwordHash)
	const { passwordHash: _, ...publicUser } = user;
	return c.json({ user: publicUser }, 200);
});

// POST /api/auth/logout
auth.post("/logout", async (c) => {
	const userId = c.get("userId" as never) as string | undefined;

	if (userId) {
		// Delete all sessions for this user
		await deleteUserSessions(c.env.DB, userId);
	}

	// Clear cookie
	clearAccessTokenCookie(c);

	return c.json({ message: "Logged out successfully" }, 200);
});

// GET /api/auth/me
auth.get("/me", async (c) => {
	const userId = c.get("userId" as never) as string | undefined;

	if (!userId) {
		return c.json({ error: "Not authenticated" }, 401);
	}

	const user = await getPublicUserById(c.env.DB, userId);
	if (!user) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json({ user }, 200);
});

export { auth };
