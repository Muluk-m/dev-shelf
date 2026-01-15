import {
	ChevronDown,
	Download,
	Edit3,
	History,
	Loader2,
	Play,
	Sparkles,
	TrendingUp,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Header } from "~/components/layout/header";
import { ChartVisualization } from "~/components/query-analyzer/chart-visualization";
import { DataTable } from "~/components/query-analyzer/data-table";
import { QueryFiltersComponent } from "~/components/query-analyzer/query-filters";
import { QueryHistory } from "~/components/query-analyzer/query-history";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { analyzeData, convertToSQL, executeQuery } from "~/lib/api";
import { getClickHouseService } from "~/lib/clickhouse-service";
import {
	type QueryHistoryItem,
	saveQueryToHistory,
} from "~/lib/query-history-storage";
import {
	COMMON_PROJECTS,
	PWA_EVENT_TABLE_SCHEMA,
	QUERY_TEMPLATES,
	type QueryTemplate,
} from "~/lib/query-templates";

const STORAGE_KEY = "query-analyzer-project-history";
const MAX_HISTORY_SIZE = 10;

export function meta() {
	return [
		{ title: "Query Analyzer | DevTools Platform" },
		{
			name: "description",
			content: "Query Analyzer for DevTools Platform",
		},
	];
}

/**
 * Export data to CSV format
 */
function exportToCSV(data: any[], filename: string) {
	if (!data || data.length === 0) return;

	// Get column headers
	const headers = Object.keys(data[0]);
	const csvHeaders = headers.join(",");

	// Convert data to CSV rows
	const csvRows = data.map((row) =>
		headers
			.map((header) => {
				const value = row[header];
				// Escape values that contain commas or quotes
				if (
					typeof value === "string" &&
					(value.includes(",") || value.includes('"'))
				) {
					return `"${value.replace(/"/g, '""')}"`;
				}
				return value;
			})
			.join(","),
	);

	// Combine headers and rows
	const csv = [csvHeaders, ...csvRows].join("\n");

	// Create blob and download
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.setAttribute("href", url);
	link.setAttribute("download", `${filename}.csv`);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Export data to JSON format
 */
function exportToJSON(data: any[], filename: string) {
	if (!data || data.length === 0) return;

	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.setAttribute("href", url);
	link.setAttribute("download", `${filename}.json`);
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateToString(date: Date | undefined): string {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date object
 */
function parseStringToDate(dateStr: string): Date | undefined {
	if (!dateStr) return undefined;
	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return undefined;
	return new Date(year, month - 1, day);
}

export default function QueryAnalyzerPage() {
	const [activeTab, setActiveTab] = useState("natural");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Global project IDs filter (required for all queries)
	const [projectIds, setProjectIds] = useState("7732354485");
	const [customProjectId, setCustomProjectId] = useState("");
	const [projectHistory, setProjectHistory] = useState<string[]>([]);

	// Query history state
	const [showQueryHistory, setShowQueryHistory] = useState(false);

	// Query filters state
	const [queryFilters, setQueryFilters] = useState<{
		eventCodes: number[];
		dateRange: {
			type: "custom" | "today" | "yesterday" | "last7days" | "last30days";
			startDate?: Date;
			endDate?: Date;
		};
	}>({
		eventCodes: [],
		dateRange: { type: "last7days" },
	});

	// Natural language query state
	const [naturalQuery, setNaturalQuery] = useState("");
	const [generatedSQL, setGeneratedSQL] = useState("");
	const [sqlExplanation, setSqlExplanation] = useState("");
	const [showGeneratedSQL, setShowGeneratedSQL] = useState(true);
	const [isEditingSQL, setIsEditingSQL] = useState(false);

	// Follow-up question for SQL refinement
	const [followUpQuestion, setFollowUpQuestion] = useState("");
	const [isRefining, setIsRefining] = useState(false);

	// Custom SQL state
	const [customSQL, setCustomSQL] = useState("");

	// Template state
	const [selectedTemplate, setSelectedTemplate] =
		useState<QueryTemplate | null>(null);
	const [templateParams, setTemplateParams] = useState<Record<string, any>>({});

	// Results state
	const [queryResults, setQueryResults] = useState<any[] | null>(null);
	const [executionTime, setExecutionTime] = useState<number | null>(null);
	const [chartType, setChartType] = useState<
		"table" | "line" | "bar" | "pie" | "area"
	>("table");

	// Analysis state
	const [analysisLoading, setAnalysisLoading] = useState(false);
	const [analysisResult, setAnalysisResult] = useState<string | null>(null);
	const [showAnalysis, setShowAnalysis] = useState(false);
	const [lastExecutedSQL, setLastExecutedSQL] = useState<string>("");

	const clickhouseService = getClickHouseService();

	// Load project history from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const history = JSON.parse(stored) as string[];
				setProjectHistory(history);
			}
		} catch (error) {
			console.error("Failed to load project history:", error);
		}
	}, []);

	// Save project ID to history
	const saveToHistory = (projectId: string) => {
		try {
			// Remove duplicates and add to front
			const newHistory = [
				projectId,
				...projectHistory.filter((id) => id !== projectId),
			].slice(0, MAX_HISTORY_SIZE);

			setProjectHistory(newHistory);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
		} catch (error) {
			console.error("Failed to save project history:", error);
		}
	};

	// Parse project IDs to array
	const getProjectIdsArray = (): string[] => {
		return projectIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0);
	};

	// Add project ID to selection
	const addProjectId = (id: string) => {
		const ids = getProjectIdsArray();
		if (!ids.includes(id)) {
			setProjectIds([...ids, id].join(", "));
			saveToHistory(id); // Save to history
		}
	};

	// Remove project ID from selection
	const removeProjectId = (id: string) => {
		const ids = getProjectIdsArray().filter((i) => i !== id);
		setProjectIds(ids.join(", "));
	};

	// Add custom project ID
	const handleAddCustomProject = () => {
		if (customProjectId.trim()) {
			addProjectId(customProjectId.trim());
			setCustomProjectId("");
		}
	};

	// Inject project_id and quick filters into SQL
	const injectFiltersIntoSQL = (sql: string): string => {
		// Parse project IDs (comma-separated)
		const ids = projectIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		if (ids.length === 0) {
			throw new Error("请至少输入一个项目 ID");
		}

		// Build WHERE clauses
		const whereClauses: string[] = [];

		// Project ID filter
		const projectIdClause =
			ids.length === 1
				? `project_id = '${ids[0]}'`
				: `project_id IN (${ids.map((id) => `'${id}'`).join(", ")})`;
		whereClauses.push(projectIdClause);

		// Event code filter
		if (queryFilters.eventCodes.length > 0) {
			const eventCodeClause =
				queryFilters.eventCodes.length === 1
					? `event_code = ${queryFilters.eventCodes[0]}`
					: `event_code IN (${queryFilters.eventCodes.join(", ")})`;
			whereClauses.push(eventCodeClause);
		}

		// Date range filter
		if (queryFilters.dateRange.startDate && queryFilters.dateRange.endDate) {
			const startDate = queryFilters.dateRange.startDate
				.toISOString()
				.split("T")[0];
			const endDate = queryFilters.dateRange.endDate
				.toISOString()
				.split("T")[0];
			whereClauses.push(
				`msg_event_time >= '${startDate} 00:00:00' AND msg_event_time <= '${endDate} 23:59:59'`,
			);
		}

		const combinedWhereClause = whereClauses.join(" AND ");

		// Check if WHERE clause exists
		const upperSQL = sql.toUpperCase();
		if (upperSQL.includes("WHERE")) {
			// Add to existing WHERE clause
			return sql.replace(/(WHERE\s+)/i, `$1${combinedWhereClause} AND `);
		}

		// Add WHERE clause before GROUP BY, ORDER BY, or LIMIT
		const insertBefore = /(GROUP\s+BY|ORDER\s+BY|LIMIT)/i;
		if (insertBefore.test(sql)) {
			return sql.replace(insertBefore, `WHERE ${combinedWhereClause}\n$1`);
		}

		// Add at the end
		return `${sql.trim()}\nWHERE ${combinedWhereClause}`;
	};

	// Handle natural language query
	const handleNaturalQuery = async () => {
		if (!naturalQuery.trim()) {
			setError("请输入查询需求");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Call API to convert natural language to SQL
			const { sql, explanation } = await convertToSQL({
				naturalLanguage: naturalQuery,
				schema: PWA_EVENT_TABLE_SCHEMA,
			});

			// Inject project_id and filters
			const finalSQL = injectFiltersIntoSQL(sql);

			setGeneratedSQL(finalSQL);
			setSqlExplanation(explanation);

			// Auto-execute generated SQL
			const validation = clickhouseService.validateSQL(finalSQL);
			if (!validation.valid) {
				setError(validation.error || "SQL 验证失败");
				return;
			}

			await executeQueryWrapper(finalSQL);
		} catch (err) {
			setError(err instanceof Error ? err.message : "查询失败");
		} finally {
			setLoading(false);
		}
	};

	// Handle follow-up question to refine SQL
	const handleFollowUpQuestion = async () => {
		if (!followUpQuestion.trim()) {
			setError("请输入追问内容");
			return;
		}

		if (!generatedSQL) {
			setError("请先生成 SQL 查询");
			return;
		}

		setIsRefining(true);
		setError(null);

		try {
			// Build context with previous SQL
			const contextPrompt = `当前的 SQL:\n${generatedSQL}\n\n原始需求: ${naturalQuery}\n\n现在的追问: ${followUpQuestion}\n\n请基于当前 SQL 进行优化或调整。`;

			// Call API to refine SQL
			const { sql, explanation } = await convertToSQL({
				naturalLanguage: contextPrompt,
				schema: PWA_EVENT_TABLE_SCHEMA,
			});

			// Inject project_id and filters
			const finalSQL = injectFiltersIntoSQL(sql);

			setGeneratedSQL(finalSQL);
			setSqlExplanation(
				`${explanation}\n\n(基于追问优化: "${followUpQuestion}")`,
			);
			setFollowUpQuestion(""); // Clear follow-up input

			// Auto-execute refined SQL
			const validation = clickhouseService.validateSQL(finalSQL);
			if (!validation.valid) {
				setError(validation.error || "SQL 验证失败");
				return;
			}

			await executeQueryWrapper(finalSQL);
		} catch (err) {
			setError(err instanceof Error ? err.message : "优化失败");
		} finally {
			setIsRefining(false);
		}
	};

	// Execute generated SQL
	const handleExecuteGeneratedSQL = async () => {
		if (!generatedSQL.trim()) {
			setError("请先生成 SQL 查询");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Validate SQL
			const validation = clickhouseService.validateSQL(generatedSQL);
			if (!validation.valid) {
				setError(validation.error || "SQL 验证失败");
				return;
			}

			await executeQueryWrapper(generatedSQL);
		} catch (err) {
			setError(err instanceof Error ? err.message : "查询失败");
		} finally {
			setLoading(false);
		}
	};

	// Handle custom SQL execution
	const handleCustomSQL = async () => {
		if (!customSQL.trim()) {
			setError("请输入 SQL 查询语句");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Inject project_id and filters
			const finalSQL = injectFiltersIntoSQL(customSQL);

			// Validate SQL
			const validation = clickhouseService.validateSQL(finalSQL);
			if (!validation.valid) {
				setError(validation.error || "SQL 验证失败");
				return;
			}

			await executeQueryWrapper(finalSQL);
		} catch (err) {
			setError(err instanceof Error ? err.message : "查询失败");
		} finally {
			setLoading(false);
		}
	};

	// Handle template execution
	const handleTemplateExecution = async () => {
		if (!selectedTemplate) {
			setError("请选择一个模板");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Process template parameters (exclude projectIds which is handled globally)
			const processedParams: Record<string, any> = {};
			for (const [key, param] of Object.entries(
				selectedTemplate.parameters || {},
			)) {
				if (key === "projectIds") continue; // Skip projectIds
				const value = templateParams[key] || param.default;
				processedParams[key] =
					param.type === "date"
						? clickhouseService.processDateParameter(String(value))
						: value;
			}

			// Replace template variables
			let sql = clickhouseService.replaceTemplateVariables(
				selectedTemplate.sqlTemplate,
				processedParams,
			);

			// Inject project_id and filters
			sql = injectFiltersIntoSQL(sql);

			setChartType(selectedTemplate.chartType);
			await executeQueryWrapper(sql);
		} catch (err) {
			setError(err instanceof Error ? err.message : "查询失败");
		} finally {
			setLoading(false);
		}
	};

	// Execute query wrapper
	const executeQueryWrapper = async (sql: string) => {
		const result = await executeQuery({ sql });
		setQueryResults(result.data);
		setExecutionTime(result.statistics?.elapsed || null);
		setLastExecutedSQL(sql);

		// Save to query history
		const queryType =
			activeTab === "natural"
				? "natural"
				: activeTab === "templates"
					? "template"
					: "custom";

		const queryContent =
			activeTab === "natural"
				? naturalQuery
				: activeTab === "templates"
					? selectedTemplate?.name || "模板查询"
					: "自定义 SQL";

		saveQueryToHistory({
			type: queryType,
			query: queryContent,
			sql,
			projectIds,
			favorite: false,
			executionTime: result.statistics?.elapsed,
			resultCount: result.data.length,
		});

		// Reset analysis when new query is executed
		setAnalysisResult(null);
		setShowAnalysis(false);
	};

	// Handle AI analysis
	const handleAnalyzeData = async () => {
		if (!queryResults || queryResults.length === 0) {
			setError("没有可分析的数据");
			return;
		}

		setAnalysisLoading(true);
		setError(null);

		try {
			const response = await analyzeData({
				data: queryResults,
				sql: lastExecutedSQL,
				naturalQuery: activeTab === "natural" ? naturalQuery : undefined,
			});
			setAnalysisResult(response.analysis);
			setShowAnalysis(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "数据分析失败");
		} finally {
			setAnalysisLoading(false);
		}
	};

	// Initialize template parameters
	const initializeTemplateParams = (template: QueryTemplate) => {
		const params: Record<string, any> = {};
		for (const [key, param] of Object.entries(template.parameters || {})) {
			params[key] = param.default;
		}
		setTemplateParams(params);
		setSelectedTemplate(template);
		setChartType(template.chartType);
	};

	// Load query from history
	const handleLoadQueryFromHistory = (item: QueryHistoryItem) => {
		// Set project IDs
		setProjectIds(item.projectIds);

		// Set active tab based on query type
		setActiveTab(
			item.type === "natural"
				? "natural"
				: item.type === "template"
					? "templates"
					: "custom",
		);

		// Set query content
		if (item.type === "natural") {
			setNaturalQuery(item.query);
			setGeneratedSQL(item.sql);
			setShowGeneratedSQL(true);
		} else if (item.type === "custom") {
			setCustomSQL(item.sql);
		}

		// Note: Template loading would require additional template matching logic
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<ToolPageHeader
						icon={<Sparkles className="h-5 w-5" />}
						title="埋点数据自助查询分析"
						description="支持自然语言查询、预设模板和自定义 SQL，快速洞察数据"
						actions={
							<Button
								variant="outline"
								onClick={() => setShowQueryHistory(true)}
								className="gap-2"
							>
								<History className="w-4 h-4" />
								查询历史
							</Button>
						}
					/>
				</div>

				{/* Query History Sheet */}
				<QueryHistory
					open={showQueryHistory}
					onOpenChange={setShowQueryHistory}
					onLoadQuery={handleLoadQueryFromHistory}
				/>

				{/* Global Project ID Filter */}
				<Card className="mb-6 border-2 border-primary/20">
					<CardContent className="pt-6">
						<div className="space-y-3">
							<Label htmlFor="projectIds" className="text-base font-semibold">
								项目 ID（必填）
								<Badge variant="secondary" className="ml-2">
									必填
								</Badge>
							</Label>

							{/* Selected Project IDs */}
							<div className="flex flex-wrap gap-2">
								{getProjectIdsArray().map((id) => (
									<Badge
										key={id}
										variant="default"
										className="px-3 py-1.5 text-sm"
									>
										{id}
										<button
											type="button"
											onClick={() => removeProjectId(id)}
											className="ml-2 hover:text-destructive"
											aria-label={`移除项目 ${id}`}
										>
											<X className="w-3 h-3" />
										</button>
									</Badge>
								))}
								{getProjectIdsArray().length === 0 && (
									<span className="text-sm text-muted-foreground">
										请选择或输入项目 ID
									</span>
								)}
							</div>

							{/* Quick Select - combines common projects and history */}
							<div className="space-y-2">
								<div className="flex items-center gap-2 flex-wrap">
									<Label className="text-sm text-muted-foreground shrink-0">
										快速选择:
									</Label>
									<div className="flex flex-wrap gap-2">
										{/* Show history items first (excluding ones already in COMMON_PROJECTS) */}
										{projectHistory
											.filter(
												(id) => !COMMON_PROJECTS.some((p) => p.value === id),
											)
											.map((projectId) => (
												<Button
													key={`history-${projectId}`}
													type="button"
													variant="secondary"
													size="sm"
													onClick={() => addProjectId(projectId)}
													disabled={getProjectIdsArray().includes(projectId)}
													className="h-7 text-xs"
												>
													{projectId}
												</Button>
											))}
										{/* Then show common projects */}
										{COMMON_PROJECTS.map((project) => (
											<Button
												key={`common-${project.value}`}
												type="button"
												variant="outline"
												size="sm"
												onClick={() => addProjectId(project.value)}
												disabled={getProjectIdsArray().includes(project.value)}
												className="h-7 text-xs"
											>
												{project.label}
											</Button>
										))}
									</div>
								</div>

								{/* Custom Project ID Input */}
								<div className="flex gap-2">
									<Input
										placeholder="或输入自定义项目 ID"
										value={customProjectId}
										onChange={(e) => setCustomProjectId(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddCustomProject();
											}
										}}
										className="text-sm"
									/>
									<Button
										type="button"
										variant="secondary"
										onClick={handleAddCustomProject}
										disabled={!customProjectId.trim()}
										className="shrink-0"
									>
										添加
									</Button>
								</div>
							</div>

							<p className="text-sm text-muted-foreground">
								所有查询都会自动添加此项目ID过滤条件
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Quick Filters */}
				<div className="mb-6">
					<QueryFiltersComponent
						value={queryFilters}
						onChange={setQueryFilters}
					/>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="space-y-6"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="natural">
							<Sparkles className="w-4 h-4 mr-2" />
							自然语言查询
						</TabsTrigger>
						<TabsTrigger value="templates">预设模板</TabsTrigger>
						<TabsTrigger value="custom">自定义 SQL</TabsTrigger>
					</TabsList>

					{/* Natural Language Query */}
					<TabsContent value="natural" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>自然语言查询</CardTitle>
								<CardDescription>
									用自然语言描述你的数据需求，AI 将自动生成 SQL 查询
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>查询需求</Label>
									<Textarea
										placeholder="例如：查询最近7天的事件数量趋势，按日期分组"
										value={naturalQuery}
										onChange={(e) => setNaturalQuery(e.target.value)}
										rows={3}
									/>
								</div>
								<Button
									onClick={handleNaturalQuery}
									disabled={loading}
									className="w-full"
								>
									{loading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											生成 SQL 中...
										</>
									) : (
										<>
											<Sparkles className="w-4 h-4 mr-2" />
											生成 SQL 查询
										</>
									)}
								</Button>

								{generatedSQL && (
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="flex items-center gap-2">
												生成的 SQL
												{isEditingSQL ? (
													<Badge variant="secondary" className="text-xs">
														编辑模式
													</Badge>
												) : (
													<Badge variant="outline" className="text-xs">
														预览模式
													</Badge>
												)}
											</Label>
											<div className="flex items-center gap-2">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => setIsEditingSQL(!isEditingSQL)}
													className="h-7 text-xs"
												>
													<Edit3 className="w-3 h-3 mr-1" />
													{isEditingSQL ? "预览" : "编辑"}
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => setShowGeneratedSQL(!showGeneratedSQL)}
													className="h-7 text-xs"
												>
													{showGeneratedSQL ? (
														<>
															<ChevronDown className="w-3 h-3 mr-1 rotate-180" />
															折叠
														</>
													) : (
														<>
															<ChevronDown className="w-3 h-3 mr-1" />
															展开
														</>
													)}
												</Button>
											</div>
										</div>

										{showGeneratedSQL && (
											<>
												{isEditingSQL ? (
													<Textarea
														value={generatedSQL}
														onChange={(e) => setGeneratedSQL(e.target.value)}
														rows={12}
														className="font-mono text-sm"
													/>
												) : (
													<div className="relative rounded-md overflow-hidden border">
														<SyntaxHighlighter
															language="sql"
															style={vscDarkPlus}
															customStyle={{
																margin: 0,
																borderRadius: "0.375rem",
																fontSize: "0.875rem",
																lineHeight: "1.5",
															}}
															showLineNumbers
														>
															{generatedSQL}
														</SyntaxHighlighter>
													</div>
												)}
												{sqlExplanation && (
													<Alert>
														<AlertDescription>
															{sqlExplanation}
														</AlertDescription>
													</Alert>
												)}
											</>
										)}

										<Button
											onClick={handleExecuteGeneratedSQL}
											disabled={loading}
											className="w-full"
										>
											{loading ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													执行中...
												</>
											) : (
												<>
													<Play className="w-4 h-4 mr-2" />
													{showGeneratedSQL ? "重新执行查询" : "执行查询"}
												</>
											)}
										</Button>

										{/* Follow-up Question Section */}
										<div className="border-t pt-4 space-y-2">
											<Label className="text-sm font-medium">💬 追问优化</Label>
											<div className="flex gap-2">
												<Textarea
													placeholder="例如：按日期分组、只看前10条、添加订阅相关的事件..."
													value={followUpQuestion}
													onChange={(e) => setFollowUpQuestion(e.target.value)}
													rows={2}
													disabled={isRefining}
													className="flex-1"
												/>
												<Button
													onClick={handleFollowUpQuestion}
													disabled={isRefining || !followUpQuestion.trim()}
													className="shrink-0"
												>
													{isRefining ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Sparkles className="w-4 h-4" />
													)}
												</Button>
											</div>
											<p className="text-xs text-muted-foreground">
												基于当前 SQL 进行优化,AI
												会保留现有查询逻辑并应用你的调整
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Templates */}
					<TabsContent value="templates" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>预设分析模板</CardTitle>
								<CardDescription>
									选择常用的数据分析场景，快速生成查询
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{QUERY_TEMPLATES.map((template) => (
										<Card
											key={template.id}
											className={`cursor-pointer transition-colors ${
												selectedTemplate?.id === template.id
													? "border-primary"
													: "hover:border-primary/50"
											}`}
											onClick={() => initializeTemplateParams(template)}
										>
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<CardTitle className="text-base">
														{template.name}
													</CardTitle>
													<Badge variant="outline">{template.category}</Badge>
												</div>
												<CardDescription className="text-sm">
													{template.description}
												</CardDescription>
											</CardHeader>
										</Card>
									))}
								</div>

								{selectedTemplate && (
									<div className="space-y-4 p-4 border rounded-lg">
										<h3 className="font-semibold">参数配置</h3>
										<div className="grid grid-cols-2 gap-4">
											{Object.entries(selectedTemplate.parameters || {}).map(
												([key, param]) => (
													<div key={key} className="space-y-2">
														<Label>{param.label}</Label>
														{param.type === "date" ? (
															<DatePicker
																value={parseStringToDate(
																	templateParams[key] || String(param.default),
																)}
																onChange={(date) => {
																	setTemplateParams({
																		...templateParams,
																		[key]: formatDateToString(date),
																	});
																}}
																placeholder="选择日期"
															/>
														) : (
															<Input
																type={
																	param.type === "number" ? "number" : "text"
																}
																value={templateParams[key] || param.default}
																onChange={(e) =>
																	setTemplateParams({
																		...templateParams,
																		[key]: e.target.value,
																	})
																}
															/>
														)}
													</div>
												),
											)}
										</div>
										<Button
											onClick={handleTemplateExecution}
											disabled={loading}
											className="w-full"
										>
											{loading ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													查询中...
												</>
											) : (
												<>
													<Play className="w-4 h-4 mr-2" />
													执行查询
												</>
											)}
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Custom SQL */}
					<TabsContent value="custom" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>自定义 SQL 查询</CardTitle>
								<CardDescription>
									直接编写 ClickHouse SQL 语句进行高级查询
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>SQL 查询语句</Label>
									<Textarea
										placeholder={`SELECT
  toDate(msg_event_time) as date,
  COUNT(*) as count
FROM roi_ods.pwa_event_point_log
WHERE msg_event_time >= '2025-09-20 00:00:00'
  AND msg_event_time <= '2025-09-27 23:59:59'
GROUP BY date
ORDER BY date DESC`}
										value={customSQL}
										onChange={(e) => setCustomSQL(e.target.value)}
										rows={12}
										className="font-mono text-sm"
									/>
								</div>
								<Button
									onClick={handleCustomSQL}
									disabled={loading}
									className="w-full"
								>
									{loading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											执行中...
										</>
									) : (
										<>
											<Play className="w-4 h-4 mr-2" />
											执行查询
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Error Display */}
				{error && (
					<Alert variant="destructive" className="mt-6">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Results Display */}
				{queryResults && queryResults.length === 0 && (
					<Card className="mt-6">
						<CardContent className="flex flex-col items-center justify-center py-12">
							<div className="text-center space-y-2">
								<p className="text-lg text-muted-foreground">暂无数据</p>
								<p className="text-sm text-muted-foreground">
									请尝试调整查询条件或时间范围
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{queryResults && queryResults.length > 0 && (
					<div className="mt-6 space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<h2 className="text-2xl font-bold">查询结果</h2>
								<Badge variant="secondary" className="text-base px-3 py-1">
									共 {queryResults.length} 条
								</Badge>
							</div>
							<div className="flex items-center gap-4">
								{executionTime && (
									<Badge variant="outline">
										执行时间: {executionTime.toFixed(2)}ms
									</Badge>
								)}
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleAnalyzeData}
									disabled={analysisLoading}
									className="gap-2"
								>
									{analysisLoading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											分析中...
										</>
									) : (
										<>
											<TrendingUp className="w-4 h-4" />
											AI 分析
										</>
									)}
								</Button>
								<Select
									value={chartType}
									onValueChange={(value: any) => setChartType(value)}
								>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="table">表格</SelectItem>
										<SelectItem value="line">折线图</SelectItem>
										<SelectItem value="bar">柱状图</SelectItem>
										<SelectItem value="pie">饼图</SelectItem>
										<SelectItem value="area">面积图</SelectItem>
									</SelectContent>
								</Select>
								<Select
									onValueChange={(format) => {
										const timestamp = new Date()
											.toISOString()
											.replace(/[:.]/g, "-")
											.slice(0, -5);
										const filename = `query-result-${timestamp}`;
										if (format === "csv") {
											exportToCSV(queryResults, filename);
										} else if (format === "json") {
											exportToJSON(queryResults, filename);
										}
									}}
								>
									<SelectTrigger className="w-32">
										<SelectValue placeholder="导出数据" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="csv">
											<div className="flex items-center gap-2">
												<Download className="w-3 h-3" />
												导出 CSV
											</div>
										</SelectItem>
										<SelectItem value="json">
											<div className="flex items-center gap-2">
												<Download className="w-3 h-3" />
												导出 JSON
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{chartType === "table" ? (
							<DataTable data={queryResults} />
						) : (
							<ChartVisualization data={queryResults} chartType={chartType} />
						)}

						{/* AI Analysis Section */}
						{showAnalysis && analysisResult && (
							<Card className="border-2 border-primary/20">
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<TrendingUp className="w-5 h-5 text-primary" />
											<CardTitle>AI 数据分析报告</CardTitle>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => setShowAnalysis(false)}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
									<CardDescription>
										基于查询结果的深度分析和业务洞察
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{analysisResult}
										</ReactMarkdown>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
