/** Full user record from database */
export interface User {
	id: string;
	username: string;
	displayName: string;
	passwordHash: string;
	role: "admin" | "user";
	createdAt: string;
	updatedAt: string;
}

/** User record safe for API responses (no password hash) */
export type PublicUser = Omit<User, "passwordHash">;

/** Session record from database */
export interface Session {
	id: string;
	userId: string;
	refreshToken: string;
	expiresAt: string;
	createdAt: string;
}

/** JWT access token payload claims */
export interface AuthPayload {
	sub: string;
	role: string;
	exp: number;
	iat: number;
}

/** Login request body */
export interface LoginRequest {
	username: string;
	password: string;
}

/** Registration request body */
export interface RegisterRequest {
	username: string;
	password: string;
	displayName?: string;
}

/** Change password request body */
export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

/** Update profile request body */
export interface UpdateProfileRequest {
	displayName: string;
}
