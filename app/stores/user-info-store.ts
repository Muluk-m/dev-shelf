import { create } from "zustand";

import type { UserInfo } from "~/types/user-info";

interface UserInfoState {
	userInfo: UserInfo | null;
	loading: boolean;
	error: string | null;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
	clear: () => void;
}

/**
 * User info state management.
 * Stub: returns null user until auth is rebuilt in Phase 2.
 */
export const useUserInfoStore = create<UserInfoState>()((set) => ({
	userInfo: null,
	loading: false,
	error: null,

	logout: async () => {
		// no-op stub
	},

	refresh: async () => {
		// no-op stub
	},

	clear: () => {
		set({
			userInfo: null,
			loading: false,
			error: null,
		});
	},
}));
