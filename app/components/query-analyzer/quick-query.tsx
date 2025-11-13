import { Download, Loader2, Play } from "lucide-react";
import { useState } from "react";
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
import { executeQuery } from "~/lib/api";
import { getClickHouseService } from "~/lib/clickhouse-service";
import { QUERY_TEMPLATES, type QueryTemplate } from "~/lib/query-templates";
import { ChartVisualization } from "./chart-visualization";
import { DataTable } from "./data-table";

interface QuickQueryProps {
	projectIds: string;
	queryFilters: {
		eventCodes: number[];
		dateRange: {
			type: "custom" | "today" | "yesterday" | "last7days" | "last30days";
			startDate?: Date;
			endDate?: Date;
		};
	};
}

function formatDateToString(date: Date | undefined): string {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function parseStringToDate(dateStr: string): Date | undefined {
	if (!dateStr) return undefined;
	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return undefined;
	return new Date(year, month - 1, day);
}

export function QuickQuery({ projectIds, queryFilters }: QuickQueryProps) {
	const [selectedTemplate, setSelectedTemplate] =
		useState<QueryTemplate | null>(null);
	const [templateParams, setTemplateParams] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [queryResults, setQueryResults] = useState<any[] | null>(null);
	const [executionTime, setExecutionTime] = useState<number | null>(null);
	const [chartType, setChartType] = useState<
		"table" | "line" | "bar" | "pie" | "area"
	>("table");
	const clickhouseService = getClickHouseService();

	// Inject project_id and filters into SQL
	const injectFiltersIntoSQL = (sql: string): string => {
		const ids = projectIds
			.split(",")
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		if (ids.length === 0) {
			throw new Error("请至少输入一个项目 ID");
		}

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

	const initializeTemplateParams = (template: QueryTemplate) => {
		const params: Record<string, any> = {};
		for (const [key, param] of Object.entries(template.parameters || {})) {
			params[key] = param.default;
		}
		setTemplateParams(params);
		setSelectedTemplate(template);
		setChartType(template.chartType);
		setQueryResults(null);
		setError(null);
	};

	const handleTemplateExecution = async () => {
		if (!selectedTemplate) {
			setError("请选择一个模板");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Process template parameters
			const processedParams: Record<string, any> = {};
			for (const [key, param] of Object.entries(
				selectedTemplate.parameters || {},
			)) {
				if (key === "projectIds") continue;
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

			// Execute query
			const result = await executeQuery({ sql });
			setQueryResults(result.data);
			setExecutionTime(result.statistics?.elapsed || null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "查询失败");
		} finally {
			setLoading(false);
		}
	};

	const exportToCSV = (data: any[], filename: string) => {
		if (!data || data.length === 0) return;

		const headers = Object.keys(data[0]);
		const csvHeaders = headers.join(",");

		const csvRows = data.map((row) =>
			headers
				.map((header) => {
					const value = row[header];
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

		const csv = [csvHeaders, ...csvRows].join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", `${filename}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const exportToJSON = (data: any[], filename: string) => {
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
	};

	return (
		<div className="grid grid-cols-12 gap-6 h-[calc(100vh-20rem)]">
			{/* Template List */}
			<div className="col-span-4 overflow-y-auto">
				<h3 className="text-lg font-semibold mb-4">查询模板</h3>
				<div className="space-y-3">
					{QUERY_TEMPLATES.map((template) => (
						<Card
							key={template.id}
							className={`cursor-pointer transition-colors hover:border-primary/50 ${
								selectedTemplate?.id === template.id
									? "border-primary bg-primary/5"
									: ""
							}`}
							onClick={() => initializeTemplateParams(template)}
						>
							<CardHeader className="p-4">
								<div className="flex items-start justify-between">
									<CardTitle className="text-sm font-medium">
										{template.name}
									</CardTitle>
									<Badge variant="outline" className="text-xs">
										{template.category}
									</Badge>
								</div>
								<CardDescription className="text-xs mt-1">
									{template.description}
								</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</div>

			{/* Parameter Configuration & Results */}
			<div className="col-span-8 overflow-y-auto">
				{selectedTemplate ? (
					<div className="space-y-4">
						{/* Parameters */}
						<Card>
							<CardHeader>
								<CardTitle>参数配置</CardTitle>
								<CardDescription>
									{selectedTemplate.description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4 mb-4">
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
														type={param.type === "number" ? "number" : "text"}
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

						{/* Error Display */}
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Results */}
						{queryResults && queryResults.length > 0 && (
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<CardTitle>查询结果</CardTitle>
											<Badge variant="secondary">
												{queryResults.length} 条
											</Badge>
											{executionTime && (
												<Badge variant="outline">
													{executionTime.toFixed(2)}ms
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2">
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
													const filename = `${selectedTemplate.id}-${timestamp}`;
													if (format === "csv") {
														exportToCSV(queryResults, filename);
													} else if (format === "json") {
														exportToJSON(queryResults, filename);
													}
												}}
											>
												<SelectTrigger className="w-32">
													<SelectValue placeholder="导出" />
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
								</CardHeader>
								<CardContent>
									{chartType === "table" ? (
										<DataTable data={queryResults} />
									) : (
										<ChartVisualization
											data={queryResults}
											chartType={chartType}
										/>
									)}
								</CardContent>
							</Card>
						)}

						{queryResults && queryResults.length === 0 && (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-12">
									<div className="text-center space-y-2">
										<p className="text-lg text-muted-foreground">暂无数据</p>
										<p className="text-sm text-muted-foreground">
											请尝试调整参数或日期范围
										</p>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				) : (
					<Card className="h-full">
						<CardContent className="flex flex-col items-center justify-center h-full">
							<div className="text-center space-y-2">
								<h3 className="text-lg font-semibold">选择一个模板</h3>
								<p className="text-sm text-muted-foreground">
									从左侧列表中选择一个查询模板开始使用
								</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
