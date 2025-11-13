import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_BASE_URL } from "~/lib/api";
import { usePermissionsStore } from "~/store/permissions-store";
import { useToolsStore } from "~/store/tools-store";
import type { Tool, ToolCategory, ToolUsageStat } from "~/types/tool";

interface ToolsInitResponse {
	tools: Tool[];
	toolCategories: ToolCategory[];
	usageStats: ToolUsageStat[];
}

interface ToolAccessResponse {
	hasAccess: boolean;
	error: string | null;
}

/**
 * Fetch initial tools data (tools, categories, usage stats)
 */
async function fetchToolsInit(): Promise<ToolsInitResponse> {
	const response = await fetch(`${API_BASE_URL}/api/tools/init`);
	if (!response.ok) {
		throw new Error("Failed to fetch tools data");
	}
	return response.json();
}

/**
 * Hook to fetch tools initialization data
 * Uses Zustand store for caching with localStorage persistence
 */
export function useToolsInit() {
	const { setToolsData } = useToolsStore();

	const query = useQuery<ToolsInitResponse, Error>({
		queryKey: ["tools", "init"],
		queryFn: fetchToolsInit,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 2,
		refetchOnWindowFocus: false,
	});

	// Sync React Query data to Zustand store when data changes
	useEffect(() => {
		if (query.data) {
			setToolsData(query.data);
		}
	}, [query.data, setToolsData]);

	return query;
}

/**
 * Fetch tool access permission
 */
async function fetchToolAccess(toolSlug: string): Promise<ToolAccessResponse> {
	const response = await fetch(`${API_BASE_URL}/api/tools/${toolSlug}/access`);
	if (!response.ok) {
		// Fail-open: allow access if API fails
		return { hasAccess: true, error: null };
	}
	return response.json();
}

/**
 * Hook to check tool access permission
 * Uses Zustand store for caching with localStorage persistence
 *
 * Strategy:
 * 1. Always trigger async request to check latest permission
 * 2. Use cached data during loading state as fallback
 * 3. Update cache after request completes
 */
export function useToolAccess(toolSlug: string, enabled = true) {
	const { setPermission, getPermission } = usePermissionsStore();

	// Get cached permission (used as fallback during loading)
	const cachedPermission = getPermission(toolSlug);

	const query = useQuery<ToolAccessResponse, Error>({
		queryKey: ["tools", toolSlug, "access"],
		queryFn: () => fetchToolAccess(toolSlug),
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 15 * 60 * 1000, // 15 minutes
		enabled,
		retry: 1,
		refetchOnWindowFocus: false,
	});

	// Sync React Query data to Zustand store when data changes
	useEffect(() => {
		if (query.data) {
			setPermission(toolSlug, query.data);
		}
	}, [query.data, toolSlug, setPermission]);

	// Return cached data during loading if available, otherwise use query data
	return {
		...query,
		data: query.data || cachedPermission || undefined,
	};
}
