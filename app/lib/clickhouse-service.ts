import type { ClickHouseQueryResult } from "../../lib/types/query-analyzer";

export interface ClickHouseConfig {
	apiEndpoint: string;
	accessKey: string;
}

export class ClickHouseService {
	private config: ClickHouseConfig;

	constructor(config: ClickHouseConfig) {
		this.config = config;
	}

	/**
	 * Execute a SQL query against ClickHouse
	 */
	async executeQuery(sqlQuery: string): Promise<ClickHouseQueryResult> {
		const startTime = performance.now();

		try {
			const response = await fetch(this.config.apiEndpoint, {
				method: "POST",
				headers: {
					"x-access-key": this.config.accessKey,
					"content-type": "application/json",
				},
				body: JSON.stringify({ query: sqlQuery }),
			});

			if (!response.ok) {
				throw new Error(`ClickHouse query failed: ${response.statusText}`);
			}

			const data: any = await response.json();
			const executionTime = performance.now() - startTime;

			return {
				data: data.data || [],
				meta: data.meta,
				rows: data.rows || data.data?.length || 0,
				statistics: {
					elapsed: executionTime,
					rows_read: data.statistics?.rows_read || 0,
					bytes_read: data.statistics?.bytes_read || 0,
				},
			};
		} catch (error) {
			throw new Error(
				`Failed to execute query: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Validate SQL query for security and requirements
	 */
	validateSQL(sql: string): { valid: boolean; error?: string } {
		// Remove comments and normalize
		const normalizedSQL = sql
			.replace(/--.*$/gm, "")
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.toUpperCase()
			.trim();

		// Check for dangerous operations
		const dangerousKeywords = [
			"DROP",
			"DELETE",
			"TRUNCATE",
			"ALTER",
			"CREATE",
			"INSERT",
			"UPDATE",
			"GRANT",
			"REVOKE",
		];

		for (const keyword of dangerousKeywords) {
			if (normalizedSQL.includes(keyword)) {
				return {
					valid: false,
					error: `不允许执行 ${keyword} 操作，仅支持 SELECT 查询`,
				};
			}
		}

		// Must start with SELECT
		if (!normalizedSQL.startsWith("SELECT")) {
			return {
				valid: false,
				error: "仅支持 SELECT 查询语句",
			};
		}

		// Must include project_id filter
		if (!normalizedSQL.includes("PROJECT_ID")) {
			return {
				valid: false,
				error: "所有查询必须包含 project_id 过滤条件",
			};
		}

		// Must include msg_event_time filter
		if (!normalizedSQL.includes("MSG_EVENT_TIME")) {
			return {
				valid: false,
				error: "所有查询必须包含 msg_event_time 时间范围过滤",
			};
		}

		return { valid: true };
	}

	/**
	 * Format SQL query with proper indentation
	 */
	formatSQL(sql: string): string {
		return sql
			.replace(/\s+/g, " ")
			.replace(/\s*,\s*/g, ",\n  ")
			.replace(/\bFROM\b/gi, "\nFROM")
			.replace(/\bWHERE\b/gi, "\nWHERE")
			.replace(/\bGROUP BY\b/gi, "\nGROUP BY")
			.replace(/\bORDER BY\b/gi, "\nORDER BY")
			.replace(/\bLIMIT\b/gi, "\nLIMIT")
			.trim();
	}

	/**
	 * Replace template variables in SQL
	 */
	replaceTemplateVariables(
		sqlTemplate: string,
		parameters: Record<string, any>,
	): string {
		let sql = sqlTemplate;

		for (const [key, value] of Object.entries(parameters)) {
			const placeholder = `{{${key}}}`;
			sql = sql.replace(new RegExp(placeholder, "g"), String(value));
		}

		return sql;
	}

	/**
	 * Process date parameter (e.g., 'today-7d' -> actual date)
	 */
	processDateParameter(value: string): string {
		if (value === "today") {
			return new Date().toISOString().split("T")[0];
		}

		// Handle relative dates like 'today-7d'
		const match = value.match(/^today([+-]\d+)([dD])$/);
		if (match) {
			const offset = Number.parseInt(match[1], 10);
			const date = new Date();
			date.setDate(date.getDate() + offset);
			return date.toISOString().split("T")[0];
		}

		return value;
	}
}

// Singleton instance
let clickhouseService: ClickHouseService | null = null;

export function getClickHouseService(): ClickHouseService {
	if (!clickhouseService) {
		clickhouseService = new ClickHouseService({
			apiEndpoint: "https://fe-toolkit-test.qiliangjia.org/clickhouse/query",
			accessKey: "d561b95f5cda783b50042f9d75e912d3",
		});
	}
	return clickhouseService;
}
