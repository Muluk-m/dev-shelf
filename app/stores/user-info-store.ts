import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
	getUserInfo,
	logout as logoutApi,
} from "~/lib/api";
import type { UserInfo } from "~/types/user-info";

interface UserInfoState {
	userInfo: UserInfo | null;
	loading: boolean;
	error: string | null;
	setUserInfo: (user: UserInfo) => void;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
	clear: () => void;
}

export const useUserInfoStore = create<UserInfoState>()(
	persist(
		(set, get) => ({
			userInfo: null,
			loading: false,
			error: null,

			setUserInfo: (user: UserInfo) => {
				set({ userInfo: user, error: null });
			},

			logout: async () => {
				try {
					await logoutApi();
				} catch {
					// Ignore logout API errors -- clear local state regardless
				}
				set({ userInfo: null, loading: false, error: null });
				window.location.href = "/login";
			},

			refresh: async () => {
				if (get().loading) return;
				set({ loading: true, error: null });
				try {
					const { user } = await getUserInfo();
					set({ userInfo: user, loading: false });
				} catch {
					set({ userInfo: null, loading: false });
				}
			},

			clear: () => {
				set({
					userInfo: null,
					loading: false,
					error: null,
				});
			},
		}),
		{
			name: "user-info-storage",
			partialize: (state) => ({ userInfo: state.userInfo }),
			onRehydrateStorage: () => {
				return (_state, error) => {
					if (!error) {
						// Auto-refresh user info from server after rehydration
						useUserInfoStore.getState().refresh();
					}
				};
			},
		},
	),
);
