import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { createUser } from "../../lib/database/auth";
import { getUserCount } from "../../lib/database/users";
import {
	ACCESS_TOKEN_EXPIRY,
	generateAccessToken,
	getJwtSecret,
	hashPassword,
} from "../utils/auth";
import {
	getJwtSecretErrorMessage,
	getSchemaRecoveryMessage,
	isJwtSecretError,
	isMissingSchemaError,
} from "../utils/db-errors";

const setupRouter = new Hono<{ Bindings: Cloudflare.Env }>();

// Validation schema for init
const initSchema = z.object({
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

/**
 * GET /api/setup/status
 *
 * Returns whether the system needs initial setup (no users exist yet).
 * This endpoint is PUBLIC -- no auth required.
 */
setupRouter.get("/status", async (c) => {
	try {
		const count = await getUserCount(c.env.DB);
		return c.json({
			initialized: count > 0,
			needsSetup: count === 0,
		});
	} catch (error) {
		console.error("Error checking setup status:", error);
		if (isMissingSchemaError(error)) {
			return c.json({ error: getSchemaRecoveryMessage() }, 500);
		}
		return c.json({ error: "Internal server error" }, 500);
	}
});

/**
 * POST /api/setup/init
 *
 * Creates the first admin user during initial setup.
 * Self-guarding: returns 400 if any users already exist.
 * This endpoint is PUBLIC -- no auth required.
 */
setupRouter.post("/init", async (c) => {
	try {
		// Check if system is already initialized
		const count = await getUserCount(c.env.DB);
		if (count > 0) {
			return c.json({ error: "System already initialized" }, 400);
		}

		// Parse and validate body
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: "Invalid JSON body" }, 400);
		}

		const result = initSchema.safeParse(body);
		if (!result.success) {
			const errors = result.error.issues.map((i) => i.message);
			return c.json({ error: "Validation failed", details: errors }, 400);
		}

		const { username, password, displayName } = result.data;

		// Hash password and create admin user
		const passwordHash = await hashPassword(password);
		const userId = crypto.randomUUID();

		const user = await createUser(c.env.DB, {
			id: userId,
			username,
			displayName: displayName || username,
			passwordHash,
			role: "admin",
		});

		// Generate JWT access token
		const jwtSecret = getJwtSecret(c.env);
		const accessToken = await generateAccessToken(userId, "admin", jwtSecret);

		// Set auth cookie
		setCookie(c, "access_token", accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			path: "/",
			maxAge: ACCESS_TOKEN_EXPIRY,
		});

		return c.json(
			{
				message: "Admin account created",
				user: {
					id: user.id,
					username: user.username,
					displayName: user.displayName,
					role: user.role,
				},
			},
			201,
		);
	} catch (error) {
		console.error("Error during setup initialization:", error);
		if (isMissingSchemaError(error)) {
			return c.json({ error: getSchemaRecoveryMessage() }, 500);
		}
		if (isJwtSecretError(error)) {
			return c.json({ error: getJwtSecretErrorMessage() }, 503);
		}
		return c.json({ error: "Internal server error" }, 500);
	}
});

export { setupRouter };
