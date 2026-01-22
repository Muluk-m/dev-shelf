import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { AuthPayload } from "../../lib/types/auth";

// PBKDF2 configuration constants
export const PBKDF2_ITERATIONS = 100_000; // Cloudflare Workers Web Crypto max
export const SALT_LENGTH = 16; // bytes
export const HASH_BITS = 256; // bits
export const ACCESS_TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours in seconds

export function getJwtSecret(env: Partial<Cloudflare.Env>): string {
	const secret = env.JWT_SECRET;
	if (typeof secret !== "string" || secret.length === 0) {
		throw new Error(
			"JWT_SECRET is not configured. Create `.dev.vars` with `JWT_SECRET=...` for local dev, or set the Worker secret in Cloudflare.",
		);
	}

	return secret;
}

/**
 * Hash a password using PBKDF2-SHA256 with a random salt.
 * Returns a string in the format: base64(salt):base64(hash)
 */
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BITS,
	);

	const saltB64 = btoa(String.fromCharCode(...salt));
	const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
	return `${saltB64}:${hashB64}`;
}

/**
 * Verify a password against a stored PBKDF2-SHA256 hash.
 * Splits the stored string into salt and hash, re-derives, and compares.
 */
export async function verifyPassword(
	password: string,
	stored: string,
): Promise<boolean> {
	const [saltB64, hashB64] = stored.split(":");
	if (!saltB64 || !hashB64) return false;

	const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
	const encoder = new TextEncoder();

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BITS,
	);

	const computedB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
	return computedB64 === hashB64;
}

/**
 * Generate a JWT access token using HS256.
 * Token expires after ACCESS_TOKEN_EXPIRY seconds (24 hours).
 */
export async function generateAccessToken(
	userId: string,
	role: string,
	secret: string,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const token = await sign(
		{
			sub: userId,
			role,
			exp: now + ACCESS_TOKEN_EXPIRY,
			iat: now,
		},
		secret,
		"HS256",
	);

	return token;
}

/**
 * Verify a JWT access token using HS256.
 * Returns the decoded payload or null if verification fails.
 */
export async function verifyAccessToken(
	token: string,
	secret: string,
): Promise<AuthPayload | null> {
	try {
		const payload = await verify(token, secret, "HS256");
		return payload as unknown as AuthPayload;
	} catch {
		return null;
	}
}

/**
 * Extract auth token from the request.
 * Checks the access_token cookie first (primary), then falls back to
 * the Authorization: Bearer header.
 */
export function getAuthToken(c: Context): string | null {
	// Primary: cookie
	const cookieToken = getCookie(c, "access_token");
	if (cookieToken) {
		return cookieToken;
	}

	// Fallback: Authorization header
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7).trim();
		if (token) {
			return token;
		}
	}

	return null;
}
