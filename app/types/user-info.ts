export interface UserInfo {
	id: string;
	username: string;
	displayName: string;
	role: "admin" | "user";
	/** JWT issued-at timestamp (seconds) */
	iat?: number;
	/** JWT expiry timestamp (seconds) */
	exp?: number;
}
