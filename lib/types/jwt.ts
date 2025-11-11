export interface JwtPayload {
	userId: string;
	openId: string;
	userName: string;
  userEmail: string;
	avatar: string;
	platform: string;
	appId: number;
  isNewUser: boolean;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}