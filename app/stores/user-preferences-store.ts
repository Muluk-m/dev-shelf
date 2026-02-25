import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RecentTool {
	id: string;
	usedAt: number;
}

interface UserPreferencesState {
	favorites: string[];
	recentTools: RecentTool[];
	_hasHydrated: boolean;

	addFavorite: (toolId: string) => void;
	removeFavorite: (toolId: string) => void;
	toggleFavorite: (toolId: string) => void;
	isFavorite: (toolId: string) => boolean;

	recordToolUse: (toolId: string) => void;
	clearRecentTools: () => void;
	setHasHydrated: (hasHydrated: boolean) => void;
}

const MAX_RECENT_TOOLS = 10;

export const useUserPreferencesStore = create<UserPreferencesState>()(
	persist(
		(set, get) => ({
			favorites: [],
			recentTools: [],
			_hasHydrated: false,

			addFavorite: (toolId) => {
				set((state) => ({
					favorites: state.favorites.includes(toolId)
						? state.favorites
						: [...state.favorites, toolId],
				}));
			},

			removeFavorite: (toolId) => {
				set((state) => ({
					favorites: state.favorites.filter((id) => id !== toolId),
				}));
			},

			toggleFavorite: (toolId) => {
				const { favorites } = get();
				if (favorites.includes(toolId)) {
					set({ favorites: favorites.filter((id) => id !== toolId) });
				} else {
					set({ favorites: [...favorites, toolId] });
				}
			},

			isFavorite: (toolId) => {
				return get().favorites.includes(toolId);
			},

			recordToolUse: (toolId) => {
				set((state) => {
					const filtered = state.recentTools.filter((t) => t.id !== toolId);
					const updated = [
						{ id: toolId, usedAt: Date.now() },
						...filtered,
					].slice(0, MAX_RECENT_TOOLS);
					return { recentTools: updated };
				});
			},

			clearRecentTools: () => {
				set({ recentTools: [] });
			},

			setHasHydrated: (hasHydrated) => {
				set({ _hasHydrated: hasHydrated });
			},
		}),
		{
			name: "user-preferences",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				favorites: state.favorites,
				recentTools: state.recentTools,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
