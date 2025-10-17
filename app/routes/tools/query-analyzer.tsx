import {
	ChevronDown,
	Download,
	Edit3,
	Loader2,
	Play,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Header } from "~/components/layout/header";
import { ChartVisualization } from "~/components/query-analyzer/chart-visualization";
import { DataTable } from "~/components/query-analyzer/data-table";
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
import { convertToSQL, executeQuery } from "~/lib/api";
import { getClickHouseService } from "~/lib/clickhouse-service";
import {
	COMMON_PROJECTS,
	PWA_EVENT_TABLE_SCHEMA,
	QUERY_TEMPLATES,
	type QueryTemplate,
} from "~/lib/query-templates";

const STORAGE_KEY = "query-analyzer-project-history";
const MAX_HISTORY_SIZE = 10;

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

	// Natural language query state
	const [naturalQuery, setNaturalQuery] = useState("");
	const [generatedSQL, setGeneratedSQL] = useState("");
	const [sqlExplanation, setSqlExplanation] = useState("");
	const [showGeneratedSQL, setShowGeneratedSQL] = useState(true);
	const [isEditingSQL, setIsEditingSQL] = useState(false);

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

	// Inject project_id filter into SQL
	const injectProjectIdFilter = (sql: string): string => {
		// Parse project IDs (comma-separated)
		const ids = projectIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		if (ids.length === 0) {
			throw new Error("请至少输入一个项目 ID");
		}

		// Format as SQL IN clause
		const inClause =
			ids.length === 1
				? `project_id = '${ids[0]}'`
				: `project_id IN (${ids.map((id) => `'${id}'`).join(", ")})`;

		// Check if WHERE clause exists
		const upperSQL = sql.toUpperCase();
		if (upperSQL.includes("WHERE")) {
			// Add to existing WHERE clause
			return sql.replace(/(WHERE\s+)/i, `$1${inClause} AND `);
		}

		// Add WHERE clause before GROUP BY, ORDER BY, or LIMIT
		const insertBefore = /(GROUP\s+BY|ORDER\s+BY|LIMIT)/i;
		if (insertBefore.test(sql)) {
			return sql.replace(insertBefore, `WHERE ${inClause}\n$1`);
		}

		// Add at the end
		return `${sql.trim()}\nWHERE ${inClause}`;
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

			// Inject project_id filter
			const finalSQL = injectProjectIdFilter(sql);

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
			// Inject project_id filter
			const finalSQL = injectProjectIdFilter(customSQL);

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

			// Inject project_id filter
			sql = injectProjectIdFilter(sql);

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

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">埋点数据自助查询分析</h1>
					<p className="text-muted-foreground">
						支持自然语言查询、预设模板和自定义 SQL，快速洞察数据
					</p>
				</div>

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
				{queryResults && queryResults.length > 0 && (
					<div className="mt-6 space-y-4">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-bold">查询结果</h2>
							<div className="flex items-center gap-4">
								{executionTime && (
									<Badge variant="outline">
										执行时间: {executionTime.toFixed(2)}ms
									</Badge>
								)}
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
					</div>
				)}
			</main>
		</div>
	);
}
