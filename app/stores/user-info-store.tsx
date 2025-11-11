"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getUserInfo } from "~/lib/api";
import type { UserInfo } from "~/types/user-info";

interface UserInfoState {
	userInfo: UserInfo | null;
	loading: boolean;
	refresh: () => Promise<void>;
	clear: () => void;
}

let hasInitialized = false;

function initializeUserInfo() {
	if (hasInitialized || typeof window === "undefined") {
		return;
	}
	hasInitialized = true;
	const { userInfo, refresh } = useUserInfoStore.getState();
	if (!userInfo) {
		void refresh();
	}
}

/**
 * 用户信息状态
 * 使用 refresh 刷新用户信息
 * 使用 clear 清除用户信息
 * 使用 loading 是否正在加载用户信息
 * 使用 userInfo 用户信息
 */
export const useUserInfoStore = create<UserInfoState>()(
	persist(
		(set, get) => ({
			userInfo: null,
			loading: false,
			refresh: async () => {
				if (get().loading) {
					return;
				}
				set({ loading: true });
				try {
					const response = await getUserInfo();
					set({
						userInfo: response.data ?? null,
						loading: false,
					});
				} catch (err) {
					console.error("Failed to fetch user info:", err);
					set({
						userInfo: null,
						loading: false,
					});
				}
			},
			clear: () => {
				set({
					userInfo: null,
					loading: false,
				});
			},
		}),
		{
			name: "user-info-store",
			partialize: (state) => ({
				userInfo: state.userInfo,
			}),
			onRehydrateStorage: () => {
				if (typeof window === "undefined") {
					return;
				}
				queueMicrotask(() => {
					initializeUserInfo();
				});
			},
		},
	),
);
