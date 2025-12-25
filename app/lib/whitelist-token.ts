/**
 * Built-in secret key for whitelist token generation
 * IMPORTANT: This should match the server-side configuration
 */
export const SECRET_KEY = "c7d065b0d405ec46e2597c4e53368598";
export const DEFAULT_VALIDITY_MINUTES = 60;
export const DEFAULT_PARAM_NAME = "_wt";

/**
 * Generate whitelist token using HMAC-SHA256
 */
export async function generateWhitelistToken(
	secretKey: string,
	validityMinutes: number,
): Promise<string> {
	// Generate timestamp (current time + validity window)
	const expiresAt = Math.floor(Date.now() / 1000) + validityMinutes * 60;
	const timestamp = expiresAt.toString();

	// Convert secret key to bytes
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secretKey);

	// Import key for HMAC
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	// Generate HMAC signature
	const signatureBuffer = await crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		encoder.encode(timestamp),
	);

	// Convert to hex and take first 16 chars
	const signatureArray = Array.from(new Uint8Array(signatureBuffer));
	const signatureHex = signatureArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
		.substring(0, 16);

	// Combine timestamp and signature
	const tokenData = `${timestamp}:${signatureHex}`;

	// Encode to base64url for URL safety
	const tokenBytes = encoder.encode(tokenData);
	const base64 = btoa(String.fromCharCode(...tokenBytes));
	// Convert to base64url (replace +/ with -_, remove padding =)
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Append token to URL with specified parameter name
 */
export function appendTokenToUrl(
	url: string,
	token: string,
	paramName: string,
): string {
	try {
		const urlObj = new URL(url);
		urlObj.searchParams.set(paramName, token);
		return urlObj.toString();
	} catch {
		// If URL parsing fails, try simple append
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}${paramName}=${token}`;
	}
}
