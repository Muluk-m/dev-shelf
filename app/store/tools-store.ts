import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Tool, ToolCategory, ToolUsageStat } from "~/types/tool";

interface ToolsState {
	// Data
	tools: Tool[];
	toolCategories: ToolCategory[];
	usageStats: ToolUsageStat[];

	// Loading states
	isInitialized: boolean;
	_hasHydrated: boolean;

	// Actions
	setToolsData: (data: {
		tools: Tool[];
		toolCategories: ToolCategory[];
		usageStats: ToolUsageStat[];
	}) => void;
	setHasHydrated: (hasHydrated: boolean) => void;
	clearCache: () => void;
}

export const useToolsStore = create<ToolsState>()(
	persist(
		(set) => ({
			// Initial state
			tools: [],
			toolCategories: [],
			usageStats: [],
			isInitialized: false,
			_hasHydrated: false,

			// Actions
			setToolsData: (data) => {
				set({
					tools: data.tools,
					toolCategories: data.toolCategories,
					usageStats: data.usageStats,
					isInitialized: true,
				});
			},

			setHasHydrated: (hasHydrated) => {
				set({ _hasHydrated: hasHydrated });
			},

			clearCache: () => {
				set({
					tools: [],
					toolCategories: [],
					usageStats: [],
					isInitialized: false,
				});
			},
		}),
		{
			name: "tools-storage", // localStorage key
			storage: createJSONStorage(() => localStorage),
			// Persist all data
			partialize: (state) => ({
				tools: state.tools,
				toolCategories: state.toolCategories,
				usageStats: state.usageStats,
				isInitialized: state.isInitialized,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
