"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getUserInfo, logout as logoutApi } from "~/lib/api";
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
 * 用户信息状态管理
 *
 * @example
 * ```tsx
 * const { userInfo, loading, error, refresh, logout } = useUserInfoStore();
 * ```
 */
export const useUserInfoStore = create<UserInfoState>()(
	persist(
		(set, get) => ({
			userInfo: null,
			loading: false,
			error: null,

			logout: async () => {
				try {
					await logoutApi();
				} catch (err) {
					console.error("Logout failed:", err);
				} finally {
					get().clear();
					window.location.href = "/";
				}
			},

			refresh: async () => {
				if (get().loading) {
					return;
				}

				set({ loading: true, error: null });

				try {
					const response = await getUserInfo();
					set({
						userInfo: response.data ?? null,
						error: null,
					});
				} catch (err) {
					const errorMessage =
						err instanceof Error ? err.message : "Failed to fetch user info";
					console.error("Failed to fetch user info:", err);
					set({
						userInfo: null,
						error: errorMessage,
					});
				} finally {
					set({ loading: false });
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
			name: "user-info-store",
			// 只持久化必要的用户信息
			partialize: (state) => ({
				userInfo: state.userInfo,
			}),
			onRehydrateStorage: () => (state) => {
				if (typeof window !== "undefined" && state) {
					queueMicrotask(() => {
						void state.refresh();
					});
				}
			},
		},
	),
);
