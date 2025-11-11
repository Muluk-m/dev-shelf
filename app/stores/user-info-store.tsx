"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getUserInfo } from "~/lib/api";
import type { UserInfo } from "~/types/user-info";

interface UserInfoState {
	userInfo: UserInfo | null;
	loading: boolean;
	error: string | null;
	hasFetched: boolean;
	lastUpdatedAt: number | null;
	fetchUserInfo: () => Promise<void>;
	clearUserInfo: () => void;
}
/**
 * 用户信息状态
 * 使用 clearUserInfo 清除用户信息状态
 * 使用 fetchUserInfo 获取用户信息
 * 使用 lastUpdatedAt 最后更新时间
 * 使用 loading 是否正在加载用户信息
 * 使用 error 错误信息
 * 使用 hasFetched 是否已经获取过用户信息
 */
export const useUserInfoStore = create<UserInfoState>()(
	persist(
		(set, get) => ({
			userInfo: null,
			loading: false,
			error: null,
			hasFetched: false,
			lastUpdatedAt: null,
			fetchUserInfo: async () => {
				if (get().loading) {
					return;
				}
				set({ loading: true, error: null });
				try {
					const response = await getUserInfo();
					const userInfo = response.data ?? null;
					set({
						userInfo,
						loading: false,
						error: null,
						hasFetched: true,
						lastUpdatedAt: Date.now(),
					});
				} catch (err) {
					console.error("Failed to fetch user info:", err);
					const message =
						err instanceof Error
							? err.message
							: typeof err === "string"
								? err
								: "Unknown error";
					set({
						userInfo: null,
						loading: false,
						error: message,
						hasFetched: true,
						lastUpdatedAt: Date.now(),
					});
				}
			},
			clearUserInfo: () => {
				set({
					userInfo: null,
					hasFetched: false,
					error: null,
					lastUpdatedAt: Date.now(),
					loading: false,
				});
			},
		}),
		{
			name: "user-info-store",
			partialize: (state) => ({
				userInfo: state.userInfo,
				hasFetched: state.hasFetched,
				lastUpdatedAt: state.lastUpdatedAt,
				error: state.error,
			}),
		},
	),
);
