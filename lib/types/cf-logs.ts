export interface CfLogObjectInfo {
	key: string;
	size: number;
	uploadedAt: string;
	checksums: any
}

export interface CfLogListResponse {
	objects: CfLogObjectInfo[];
	prefixes: string[];
	truncated: boolean;
}

export interface CfLogListRequest {
	prefix?: string;
	cursor?: string;
	limit?: number;
	delimiter?: string | null;
}

export interface CfLogQueryFilters {
	statusCodes?: number[];
	methods?: string[];
	hosts?: string[];
	clientIPs?: string[];
	pathIncludes?: string;
}

export interface CfLogQueryRequest {
	key: string;
	limit?: number;
	cursor?: number;
	searchText?: string;
	filters?: CfLogQueryFilters;
	includeRaw?: boolean;
}

export interface CfLogEntry {
	lineNumber: number;
	raw: string;
	data?: Record<string, unknown>;
}

export interface CfLogSummary {
	totalLines: number;
	processedLines: number;
	matchedLines: number;
	byStatus: Record<string, number>;
	byHost: Record<string, number>;
	byCountry: Record<string, number>;
	methods: Record<string, number>;
	byPath: Record<string, number>;
	bytes: {
		edgeResponse: number;
		originResponse: number;
	};
}

export interface CfLogQueryResponse {
	key: string;
	entries: CfLogEntry[];
	summary: CfLogSummary;
	nextCursor?: number;
}
