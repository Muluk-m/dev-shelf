import { Hono } from "hono";
import type {
	CfLogEntry,
	CfLogListRequest,
	CfLogListResponse,
	CfLogQueryFilters,
	CfLogQueryRequest,
	CfLogQueryResponse,
	CfLogSummary,
} from "../../lib/types/cf-logs";

const MAX_LIST_LIMIT = 1000;
const DEFAULT_LIST_LIMIT = 200;
const MAX_QUERY_LIMIT = 500;
const DEFAULT_QUERY_LIMIT = 200;

export const cfLogsRouter = new Hono<{ Bindings: Cloudflare.Env }>();

cfLogsRouter.get("/list", async (c) => {
	const query: CfLogListRequest = {
		prefix: c.req.query("prefix") ?? undefined,
		cursor: c.req.query("cursor") ?? undefined,
	};

	const limitParam = c.req.query("limit");
	if (limitParam) {
		const parsed = Number.parseInt(limitParam, 10);
		if (Number.isNaN(parsed) || parsed <= 0) {
			return c.json({ error: "Invalid limit" }, 400);
		}
		query.limit = Math.min(parsed, MAX_LIST_LIMIT);
	} else {
		query.limit = DEFAULT_LIST_LIMIT;
	}

	const delimiterParam = c.req.query("delimiter");
	if (delimiterParam !== undefined) {
		query.delimiter =
			delimiterParam === "none" ? null : delimiterParam || undefined;
	} else {
		query.delimiter = "/";
	}

	try {
		const listResult = await c.env.CF_ALL_LOG.list({
			prefix: query.prefix,
			cursor: query.cursor,
			limit: query.limit,
			delimiter: query.delimiter === null ? undefined : query.delimiter,
		});

		const response: CfLogListResponse = {
			objects: listResult.objects.map((object) => ({
				key: object.key,
				size: object.size,
				uploadedAt: object.uploaded ? object.uploaded.toISOString() : "",
				checksums: object.checksums,
			})),
			prefixes: listResult.delimitedPrefixes ?? [],
			truncated: listResult.truncated,
		};
		return c.json(response);
	} catch (error) {
		console.error("Failed to list CF logs", error);
		return c.json({ error: "Failed to list CF logs" }, 500);
	}
});

cfLogsRouter.post("/query", async (c) => {
	let payload: CfLogQueryRequest;
	try {
		payload = (await c.req.json()) as CfLogQueryRequest;
	} catch {
		return c.json({ error: "Invalid request body" }, 400);
	}

	if (!payload.key || typeof payload.key !== "string") {
		return c.json({ error: "Missing log object key" }, 400);
	}

	const limit = payload.limit
		? Math.min(Math.max(payload.limit, 1), MAX_QUERY_LIMIT)
		: DEFAULT_QUERY_LIMIT;
	const cursor = payload.cursor && payload.cursor > 0 ? payload.cursor : 0;
	const searchText = payload.searchText?.toLowerCase().trim() ?? "";
	const includeRaw = payload.includeRaw !== false;

	try {
		const object = await c.env.CF_ALL_LOG.get(payload.key);
		if (!object || !object.body) {
			return c.json({ error: "Log object not found" }, 404);
		}

		let stream = object.body;
		const contentType = object.httpMetadata?.contentType ?? "";
		if (
			payload.key.endsWith(".gz") ||
			contentType === "application/gzip" ||
			contentType === "application/x-gzip"
		) {
			try {
				stream = stream.pipeThrough(new DecompressionStream("gzip"));
			} catch (error) {
				console.error("Failed to create gzip decompression stream", error);
				return c.json(
					{ error: "This Worker runtime does not support gzip decompression" },
					500,
				);
			}
		}

		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let buffer = "";
		let lineNumber = 0;
		let skip = cursor;
		let matched = 0;
		let stopReading = false;
		const entries: CfLogEntry[] = [];

		const summary: CfLogSummary = {
			totalLines: 0,
			processedLines: 0,
			matchedLines: 0,
			byStatus: {},
			byHost: {},
			byCountry: {},
			methods: {},
			byPath: {},
			bytes: {
				edgeResponse: 0,
				originResponse: 0,
			},
		};

		const filters = normaliseFilters(payload.filters);

		const processLine = (line: string) => {
			const trimmed = line.trim();
			if (!trimmed) {
				return;
			}

			lineNumber += 1;
			summary.totalLines = lineNumber;
			summary.processedLines = lineNumber;

			if (skip > 0) {
				skip -= 1;
				return;
			}

			let parsed: Record<string, unknown> | undefined;
			try {
				parsed = JSON.parse(trimmed) as Record<string, unknown>;
			} catch {
				// Ignore JSON parse errors, but we still expose raw line if requested
			}

			if (!matchesFilters(parsed, trimmed, filters, searchText)) {
				return;
			}

			summary.matchedLines += 1;
			if (parsed) {
				updateSummaryFromEntry(summary, parsed);
			}

			if (matched < limit) {
				entries.push({
					lineNumber,
					raw: includeRaw ? trimmed : "",
					data: parsed,
				});
				matched += 1;
				return;
			}

			stopReading = true;
		};

		while (!stopReading) {
			const { value, done } = await reader.read();
			if (done) {
				buffer += decoder.decode();
				break;
			}
			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				processLine(line);
				if (stopReading) {
					break;
				}
			}
		}

		if (!stopReading && buffer) {
			processLine(buffer);
		}

		if (stopReading) {
			await reader.cancel().catch(() => undefined);
		}

		const response: CfLogQueryResponse = {
			key: payload.key,
			entries,
			summary,
			nextCursor: matched >= limit ? lineNumber : undefined,
		};
		return c.json(response);
	} catch (error) {
		console.error("Failed to query CF logs", error);
		return c.json({ error: "Failed to query CF logs" }, 500);
	}
});

function normaliseFilters(filters?: CfLogQueryFilters): CfLogQueryFilters {
	if (!filters) {
		return {};
	}

	const normalised: CfLogQueryFilters = {};

	if (Array.isArray(filters.statusCodes) && filters.statusCodes.length > 0) {
		normalised.statusCodes = filters.statusCodes
			.map((code) => Number(code))
			.filter((code) => Number.isFinite(code));
	}

	if (Array.isArray(filters.methods) && filters.methods.length > 0) {
		normalised.methods = filters.methods.map((method) => method.toUpperCase());
	}

	if (Array.isArray(filters.hosts) && filters.hosts.length > 0) {
		normalised.hosts = filters.hosts.map((host) => host.toLowerCase());
	}

	if (Array.isArray(filters.clientIPs) && filters.clientIPs.length > 0) {
		normalised.clientIPs = filters.clientIPs;
	}

	if (filters.pathIncludes) {
		normalised.pathIncludes = filters.pathIncludes.toLowerCase();
	}

	return normalised;
}

function matchesFilters(
	entry: Record<string, unknown> | undefined,
	raw: string,
	filters: CfLogQueryFilters,
	searchText: string,
): boolean {
	if (!entry) {
		if (searchText) {
			return raw.toLowerCase().includes(searchText);
		}
		return Boolean(filters.statusCodes?.length);
	}

	if (searchText) {
		const haystack = `${raw}\n${JSON.stringify(entry)}`.toLowerCase();
		if (!haystack.includes(searchText)) {
			return false;
		}
	}

	if (filters.statusCodes && filters.statusCodes.length > 0) {
		const status = normaliseMaybeNumber(
			entry.EdgeResponseStatus ?? entry.OriginResponseStatus,
		);
		if (status === undefined || !filters.statusCodes.includes(status)) {
			return false;
		}
	}

	if (filters.methods && filters.methods.length > 0) {
		const method =
			typeof entry.ClientRequestMethod === "string"
				? entry.ClientRequestMethod.toUpperCase()
				: undefined;
		if (!method || !filters.methods.includes(method)) {
			return false;
		}
	}

	if (filters.hosts && filters.hosts.length > 0) {
		const hostCandidate =
			typeof entry.ClientRequestHost === "string"
				? entry.ClientRequestHost
				: typeof entry.ClientRequestHTTPHost === "string"
					? entry.ClientRequestHTTPHost
					: undefined;
		const host = hostCandidate ? hostCandidate.toLowerCase() : undefined;
		if (!host || !filters.hosts.includes(host)) {
			return false;
		}
	}

	if (filters.clientIPs && filters.clientIPs.length > 0) {
		const clientIP =
			typeof entry.ClientIP === "string" ? entry.ClientIP : undefined;
		if (!clientIP || !filters.clientIPs.includes(clientIP)) {
			return false;
		}
	}

	if (filters.pathIncludes) {
		const pathSource =
			typeof entry.ClientRequestURI === "string"
				? entry.ClientRequestURI
				: typeof entry.ClientRequestPath === "string"
					? entry.ClientRequestPath
					: undefined;
		if (
			!pathSource ||
			!pathSource.toLowerCase().includes(filters.pathIncludes)
		) {
			return false;
		}
	}

	return true;
}

function updateSummaryFromEntry(
	summary: CfLogSummary,
	entry: Record<string, unknown>,
) {
	const status = normaliseMaybeNumber(
		entry.EdgeResponseStatus ?? entry.OriginResponseStatus,
	);
	if (status !== undefined) {
		const key = String(status);
		summary.byStatus[key] = (summary.byStatus[key] ?? 0) + 1;
	}

	const hostCandidate =
		typeof entry.ClientRequestHost === "string"
			? entry.ClientRequestHost
			: typeof entry.ClientRequestHTTPHost === "string"
				? entry.ClientRequestHTTPHost
				: undefined;
	if (hostCandidate) {
		const hostKey = hostCandidate.toLowerCase();
		summary.byHost[hostKey] = (summary.byHost[hostKey] ?? 0) + 1;
	}

	const countryCandidate =
		typeof entry.ClientCountry === "string"
			? entry.ClientCountry
			: typeof entry.ClientCountryCode === "string"
				? entry.ClientCountryCode
				: undefined;
	if (countryCandidate) {
		const countryKey = countryCandidate.toUpperCase();
		summary.byCountry[countryKey] = (summary.byCountry[countryKey] ?? 0) + 1;
	}

	const method =
		typeof entry.ClientRequestMethod === "string"
			? entry.ClientRequestMethod.toUpperCase()
			: undefined;
	if (method) {
		summary.methods[method] = (summary.methods[method] ?? 0) + 1;
	}

	const pathCandidate =
		typeof entry.ClientRequestURI === "string"
			? entry.ClientRequestURI
			: typeof entry.ClientRequestPath === "string"
				? entry.ClientRequestPath
				: undefined;
	if (pathCandidate) {
		const pathKey = pathCandidate;
		summary.byPath[pathKey] = (summary.byPath[pathKey] ?? 0) + 1;
	}

	const edgeBytesCandidate = normaliseMaybeNumber(
		entry.EdgeResponseBytes ?? entry.EdgeResponseBodyBytes,
	);
	if (edgeBytesCandidate !== undefined) {
		summary.bytes.edgeResponse += edgeBytesCandidate;
	}

	const originBytesCandidate = normaliseMaybeNumber(
		entry.OriginResponseBytes ?? entry.OriginResponseBodyBytes,
	);
	if (originBytesCandidate !== undefined) {
		summary.bytes.originResponse += originBytesCandidate;
	}
}

function normaliseMaybeNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}
	return undefined;
}
