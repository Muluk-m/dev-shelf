import { Loader2, Play, Sparkles } from "lucide-react";
import { useState } from "react";
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
	PWA_EVENT_TABLE_SCHEMA,
	QUERY_TEMPLATES,
	type QueryTemplate,
} from "~/lib/query-templates";

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
	const [projectIds, setProjectIds] = useState("8201174886");

	// Natural language query state
	const [naturalQuery, setNaturalQuery] = useState("");
	const [generatedSQL, setGeneratedSQL] = useState("");
	const [sqlExplanation, setSqlExplanation] = useState("");

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

			// Don't auto-execute, let user review and edit first
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
						<div className="space-y-2">
							<Label htmlFor="projectIds" className="text-base font-semibold">
								项目 ID（必填）
								<Badge variant="secondary" className="ml-2">
									必填
								</Badge>
							</Label>
							<Input
								id="projectIds"
								placeholder="输入项目ID，多个ID用逗号分隔（例如：8201174886,8574361559）"
								value={projectIds}
								onChange={(e) => setProjectIds(e.target.value)}
								className="text-base"
							/>
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
										<Label>生成的 SQL（可编辑）</Label>
										<Textarea
											value={generatedSQL}
											onChange={(e) => setGeneratedSQL(e.target.value)}
											rows={12}
											className="font-mono text-sm"
										/>
										{sqlExplanation && (
											<Alert>
												<AlertDescription>{sqlExplanation}</AlertDescription>
											</Alert>
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
													执行查询
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
