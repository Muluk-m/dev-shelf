export interface JwtPayload {
	userId: string;
	userName: string;
	userEmail: string;
	avatar: string;
	iat: number;
	exp: number;
	aud: string;
	iss: string;
}
