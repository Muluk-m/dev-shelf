/**
 * Query History Storage
 * Manages query history in localStorage with favorites and search capabilities
 */

const STORAGE_KEY = "query-analyzer-history";
const MAX_HISTORY_SIZE = 20;

export interface QueryHistoryItem {
	id: string;
	type: "natural" | "template" | "custom";
	name?: string; // User-defined name
	query: string; // Original query content (natural language or SQL)
	sql: string; // Final SQL
	projectIds: string; // Project IDs used in query
	timestamp: number;
	favorite: boolean;
	executionTime?: number; // Query execution time in ms
	resultCount?: number; // Number of results returned
}

export interface QueryHistoryFilters {
	type?: QueryHistoryItem["type"];
	favorite?: boolean;
	searchText?: string;
}

/**
 * Get all query history from localStorage
 */
export function getQueryHistory(): QueryHistoryItem[] {
	if (typeof window === "undefined") return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];
		return JSON.parse(stored) as QueryHistoryItem[];
	} catch (error) {
		console.error("Failed to load query history:", error);
		return [];
	}
}

/**
 * Save query to history
 */
export function saveQueryToHistory(
	query: Omit<QueryHistoryItem, "id" | "timestamp">,
): QueryHistoryItem {
	try {
		const history = getQueryHistory();

		// Create new history item
		const newItem: QueryHistoryItem = {
			...query,
			id: generateId(),
			timestamp: Date.now(),
		};

		// Check if similar query exists (same SQL and projectIds)
		const existingIndex = history.findIndex(
			(item) =>
				item.sql === newItem.sql && item.projectIds === newItem.projectIds,
		);

		if (existingIndex !== -1) {
			// Update existing item (keep favorite status)
			const existing = history[existingIndex];
			newItem.favorite = existing.favorite;
			newItem.name = existing.name || newItem.name;
			history.splice(existingIndex, 1);
		}

		// Add to front
		history.unshift(newItem);

		// Keep only MAX_HISTORY_SIZE non-favorite items
		const favorites = history.filter((item) => item.favorite);
		const nonFavorites = history
			.filter((item) => !item.favorite)
			.slice(0, MAX_HISTORY_SIZE);

		const updatedHistory = [...favorites, ...nonFavorites].sort(
			(a, b) => b.timestamp - a.timestamp,
		);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
		return newItem;
	} catch (error) {
		console.error("Failed to save query history:", error);
		throw error;
	}
}

/**
 * Delete query from history
 */
export function deleteQueryFromHistory(id: string): void {
	try {
		const history = getQueryHistory();
		const filtered = history.filter((item) => item.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error("Failed to delete query from history:", error);
		throw error;
	}
}

/**
 * Toggle favorite status
 */
export function toggleQueryFavorite(id: string): void {
	try {
		const history = getQueryHistory();
		const item = history.find((item) => item.id === id);
		if (item) {
			item.favorite = !item.favorite;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
		}
	} catch (error) {
		console.error("Failed to toggle query favorite:", error);
		throw error;
	}
}

/**
 * Update query name
 */
export function updateQueryName(id: string, name: string): void {
	try {
		const history = getQueryHistory();
		const item = history.find((item) => item.id === id);
		if (item) {
			item.name = name;
			localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
		}
	} catch (error) {
		console.error("Failed to update query name:", error);
		throw error;
	}
}

/**
 * Filter query history
 */
export function filterQueryHistory(
	filters: QueryHistoryFilters,
): QueryHistoryItem[] {
	let history = getQueryHistory();

	if (filters.type) {
		history = history.filter((item) => item.type === filters.type);
	}

	if (filters.favorite !== undefined) {
		history = history.filter((item) => item.favorite === filters.favorite);
	}

	if (filters.searchText) {
		const searchLower = filters.searchText.toLowerCase();
		history = history.filter(
			(item) =>
				item.name?.toLowerCase().includes(searchLower) ||
				item.query.toLowerCase().includes(searchLower) ||
				item.sql.toLowerCase().includes(searchLower),
		);
	}

	return history;
}

/**
 * Get query by ID
 */
export function getQueryById(id: string): QueryHistoryItem | undefined {
	const history = getQueryHistory();
	return history.find((item) => item.id === id);
}

/**
 * Clear all history (except favorites)
 */
export function clearNonFavoriteHistory(): void {
	try {
		const history = getQueryHistory();
		const favorites = history.filter((item) => item.favorite);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
	} catch (error) {
		console.error("Failed to clear history:", error);
		throw error;
	}
}

/**
 * Export history as JSON
 */
export function exportQueryHistory(): string {
	const history = getQueryHistory();
	return JSON.stringify(history, null, 2);
}

/**
 * Import history from JSON
 */
export function importQueryHistory(jsonData: string): void {
	try {
		const imported = JSON.parse(jsonData) as QueryHistoryItem[];
		const currentHistory = getQueryHistory();

		// Merge with current history (avoid duplicates by SQL)
		const merged = [...imported];
		for (const current of currentHistory) {
			const exists = merged.some(
				(item) =>
					item.sql === current.sql && item.projectIds === current.projectIds,
			);
			if (!exists) {
				merged.push(current);
			}
		}

		// Sort by timestamp
		merged.sort((a, b) => b.timestamp - a.timestamp);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
	} catch (error) {
		console.error("Failed to import query history:", error);
		throw error;
	}
}

/**
 * Generate unique ID
 */
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
