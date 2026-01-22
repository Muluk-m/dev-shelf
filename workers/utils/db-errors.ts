function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	return "Unknown database error";
}

export function isMissingSchemaError(error: unknown): boolean {
	const message = getErrorMessage(error).toLowerCase();
	return (
		message.includes("no such table") ||
		message.includes("no such column") ||
		message.includes("sqlite_error")
	);
}

export function getSchemaRecoveryMessage(): string {
	return "Database schema is not initialized. Run: wrangler d1 migrations apply DB --remote";
}

export function isJwtSecretError(error: unknown): boolean {
	return (
		error instanceof Error &&
		error.message.includes("JWT_SECRET is not configured")
	);
}

export function getJwtSecretErrorMessage(): string {
	return "Server configuration error: JWT_SECRET is not set. Run: wrangler secret put JWT_SECRET";
}
