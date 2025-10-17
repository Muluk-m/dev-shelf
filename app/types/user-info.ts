export interface UserInfo {
	userId: number;
	openId: string;
	userName: string;
	avatar: string;
	platform: string;
	appId: string;
	isNewUser: boolean;
	iat: number;
	exp: number;
	aud: string;
	iss: string;
}
