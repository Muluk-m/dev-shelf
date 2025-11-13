import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PermissionCache {
	[toolSlug: string]: {
		hasAccess: boolean;
		error: string | null;
		timestamp: number;
	};
}

interface PermissionsState {
	cache: PermissionCache;

	// Actions
	setPermission: (
		toolSlug: string,
		data: { hasAccess: boolean; error: string | null },
	) => void;
	getPermission: (
		toolSlug: string,
	) => { hasAccess: boolean; error: string | null } | null;
	clearCache: () => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const usePermissionsStore = create<PermissionsState>()(
	persist(
		(set, get) => ({
			cache: {},

			setPermission: (toolSlug, data) => {
				set((state) => ({
					cache: {
						...state.cache,
						[toolSlug]: {
							...data,
							timestamp: Date.now(),
						},
					},
				}));
			},

			getPermission: (toolSlug) => {
				const cached = get().cache[toolSlug];
				if (!cached) return null;

				const now = Date.now();
				if (now - cached.timestamp > CACHE_DURATION) {
					// Cache expired
					return null;
				}

				return {
					hasAccess: cached.hasAccess,
					error: cached.error,
				};
			},

			clearCache: () => {
				set({ cache: {} });
			},
		}),
		{
			name: "permissions-storage",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
