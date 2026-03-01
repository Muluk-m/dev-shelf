import type { Tool, ToolCategory, ToolEnvironment } from "../types/tool";

export interface ExportData {
	version: string;
	exportedAt: string;
	data: {
		tools: Tool[];
		categories: ToolCategory[];
	};
}

/**
 * Export all tool data from the database.
 * Queries all four tables directly (no cache) to ensure fresh data.
 */
export async function exportAllData(db: D1Database): Promise<ExportData> {
	// Query all four tables in parallel for fresh data
	const [toolsResult, categoriesResult, environmentsResult, tagsResult] =
		await Promise.all([
			db
				.prepare(
					`SELECT id, name, description, category, icon, is_internal, status, last_updated, permission_id
				 FROM tools
				 ORDER BY name`,
				)
				.all(),
			db
				.prepare(
					`SELECT id, name, description, icon, color
				 FROM tool_categories
				 ORDER BY name`,
				)
				.all(),
			db
				.prepare(
					`SELECT tool_id, name, label, url, is_external
				 FROM tool_environments
				 ORDER BY tool_id, name`,
				)
				.all(),
			db
				.prepare(
					`SELECT tool_id, tag
				 FROM tool_tags
				 ORDER BY tool_id`,
				)
				.all(),
		]);

	// Build lookup maps for environments and tags by tool_id
	const environmentsByToolId = new Map<string, ToolEnvironment[]>();
	for (const row of environmentsResult.results as any[]) {
		const toolId = row.tool_id as string;
		if (!environmentsByToolId.has(toolId)) {
			environmentsByToolId.set(toolId, []);
		}
		environmentsByToolId.get(toolId)!.push({
			name: row.name,
			label: row.label,
			url: row.url,
			isExternal: Boolean(row.is_external),
		});
	}

	const tagsByToolId = new Map<string, string[]>();
	for (const row of tagsResult.results as any[]) {
		const toolId = row.tool_id as string;
		if (!tagsByToolId.has(toolId)) {
			tagsByToolId.set(toolId, []);
		}
		tagsByToolId.get(toolId)!.push(row.tag as string);
	}

	// Map tools from snake_case to camelCase with nested environments and tags
	const tools: Tool[] = (toolsResult.results as any[]).map((row) => ({
		id: row.id,
		name: row.name,
		description: row.description,
		category: row.category,
		icon: row.icon,
		isInternal: Boolean(row.is_internal),
		status: row.status,
		lastUpdated: row.last_updated,
		permissionId: row.permission_id ?? undefined,
		environments: environmentsByToolId.get(row.id) ?? [],
		tags: tagsByToolId.get(row.id) ?? [],
	}));

	// Map categories (no snake_case conversion needed)
	const categories: ToolCategory[] = (categoriesResult.results as any[]).map(
		(row) => ({
			id: row.id,
			name: row.name,
			description: row.description,
			icon: row.icon,
			color: row.color,
		}),
	);

	return {
		version: "1.0",
		exportedAt: new Date().toISOString(),
		data: {
			tools,
			categories,
		},
	};
}
