export interface QueryTool {
	id: string;
	name: string;
	description: string | null;
	databaseName: string;
	tableName: string;
	apiEndpoint: string;
	accessKey: string;
	status: "active" | "maintenance" | "deprecated";
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface QueryTemplate {
	id: string;
	toolId: string;
	name: string;
	description: string | null;
	category: string | null;
	sqlTemplate: string;
	parameters: string | null; // JSON string
	chartType: "table" | "line" | "bar" | "pie" | "area";
	createdAt: string;
	updatedAt: string;
}

export interface QueryHistory {
	id: string;
	toolId: string;
	templateId: string | null;
	queryText: string;
	sqlQuery: string;
	userId: string | null;
	executionTime: number | null;
	rowCount: number | null;
	status: "success" | "error";
	errorMessage: string | null;
	createdAt: string;
}

export interface TemplateParameter {
	type: "string" | "number" | "date" | "boolean";
	label: string;
	default?: string | number | boolean;
	required?: boolean;
}

export interface TemplateParameters {
	[key: string]: TemplateParameter;
}

export interface ExecuteQueryRequest {
	naturalLanguage?: string;
	sqlQuery?: string;
	templateId?: string;
	parameters?: Record<string, any>;
}

export interface ExecuteQueryResponse {
	success: boolean;
	data: any[];
	columns: string[];
	rowCount: number;
	executionTime: number;
	sql: string;
	error?: string;
}

export interface NLToSQLRequest {
	naturalLanguage: string;
	context?: {
		recentQueries?: string[];
	};
}

export interface NLToSQLResponse {
	sql: string;
	explanation: string;
}

export interface ClickHouseQueryResult {
	data: any[];
	meta?: Array<{ name: string; type: string }>;
	rows?: number;
	statistics?: {
		elapsed: number;
		rows_read: number;
		bytes_read: number;
	};
}
