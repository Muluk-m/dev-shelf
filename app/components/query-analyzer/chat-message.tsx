import {
	Bot,
	ChevronDown,
	Copy,
	Edit3,
	Play,
	TrendingUp,
	User,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
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
import { Textarea } from "~/components/ui/textarea";
import { ChartVisualization } from "./chart-visualization";
import { DataTable } from "./data-table";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	sql?: string;
	sqlExplanation?: string;
	queryResults?: any[];
	executionTime?: number;
	analysis?: string;
	error?: string;
}

interface ChatMessageProps {
	message: ChatMessage;
	onExecuteSQL?: (sql: string) => void;
	onAnalyze?: (data: any[], sql: string) => void;
	onEditSQL?: (sql: string) => void;
	isLatest?: boolean;
}

export function ChatMessageComponent({
	message,
	onExecuteSQL,
	onAnalyze,
	onEditSQL,
	isLatest = false,
}: ChatMessageProps) {
	const [showSQL, setShowSQL] = useState(true);
	const [showResults, setShowResults] = useState(true);
	const [showAnalysis, setShowAnalysis] = useState(true);
	const [isEditingSQL, setIsEditingSQL] = useState(false);
	const [editedSQL, setEditedSQL] = useState(message.sql || "");
	const [chartType, setChartType] = useState<
		"table" | "line" | "bar" | "pie" | "area"
	>("table");

	const handleCopySQL = () => {
		if (message.sql) {
			navigator.clipboard.writeText(message.sql);
		}
	};

	const handleSaveSQL = () => {
		if (onEditSQL && editedSQL !== message.sql) {
			onEditSQL(editedSQL);
		}
		setIsEditingSQL(false);
	};

	if (message.role === "user") {
		return (
			<div className="flex gap-3 mb-6">
				<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
					<User className="w-4 h-4 text-primary-foreground" />
				</div>
				<div className="flex-1">
					<div className="bg-muted rounded-lg p-4">
						<p className="text-sm text-foreground whitespace-pre-wrap">
							{message.content}
						</p>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{message.timestamp.toLocaleTimeString("zh-CN")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-3 mb-6">
			<div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
				<Bot className="w-4 h-4 text-secondary-foreground" />
			</div>
			<div className="flex-1 space-y-3">
				{/* AI Response */}
				{message.content && (
					<div className="bg-secondary/50 rounded-lg p-4">
						<p className="text-sm text-foreground whitespace-pre-wrap">
							{message.content}
						</p>
					</div>
				)}

				{/* Error */}
				{message.error && (
					<Alert variant="destructive">
						<AlertDescription>{message.error}</AlertDescription>
					</Alert>
				)}

				{/* Generated SQL */}
				{message.sql && (
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CardTitle className="text-base">生成的 SQL</CardTitle>
									{message.executionTime && (
										<Badge variant="outline" className="text-xs">
											{message.executionTime.toFixed(2)}ms
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleCopySQL}
										className="h-7 text-xs"
									>
										<Copy className="w-3 h-3 mr-1" />
										复制
									</Button>
									{isLatest && onEditSQL && (
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
									)}
									{isLatest && onExecuteSQL && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => onExecuteSQL(editedSQL)}
											className="h-7 text-xs"
										>
											<Play className="w-3 h-3 mr-1" />
											执行
										</Button>
									)}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowSQL(!showSQL)}
										className="h-7 text-xs"
									>
										<ChevronDown
											className={`w-3 h-3 transition-transform ${showSQL ? "rotate-180" : ""}`}
										/>
									</Button>
								</div>
							</div>
							{message.sqlExplanation && showSQL && (
								<CardDescription className="text-sm mt-2">
									{message.sqlExplanation}
								</CardDescription>
							)}
						</CardHeader>
						{showSQL && (
							<CardContent className="pt-0">
								{isEditingSQL ? (
									<div className="space-y-2">
										<Textarea
											value={editedSQL}
											onChange={(e) => setEditedSQL(e.target.value)}
											rows={12}
											className="font-mono text-sm"
										/>
										<div className="flex justify-end gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													setEditedSQL(message.sql || "");
													setIsEditingSQL(false);
												}}
											>
												取消
											</Button>
											<Button type="button" size="sm" onClick={handleSaveSQL}>
												保存并执行
											</Button>
										</div>
									</div>
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
											{message.sql}
										</SyntaxHighlighter>
									</div>
								)}
							</CardContent>
						)}
					</Card>
				)}

				{/* Query Results */}
				{message.queryResults && message.queryResults.length > 0 && (
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CardTitle className="text-base">查询结果</CardTitle>
									<Badge variant="secondary">
										{message.queryResults.length} 条
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									{isLatest && onAnalyze && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												onAnalyze(message.queryResults!, message.sql!)
											}
											className="h-7 text-xs gap-1"
										>
											<TrendingUp className="w-3 h-3" />
											AI 分析
										</Button>
									)}
									<select
										value={chartType}
										onChange={(e) => setChartType(e.target.value as any)}
										className="h-7 text-xs border rounded px-2"
									>
										<option value="table">表格</option>
										<option value="line">折线图</option>
										<option value="bar">柱状图</option>
										<option value="pie">饼图</option>
										<option value="area">面积图</option>
									</select>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowResults(!showResults)}
										className="h-7 text-xs"
									>
										<ChevronDown
											className={`w-3 h-3 transition-transform ${showResults ? "rotate-180" : ""}`}
										/>
									</Button>
								</div>
							</div>
						</CardHeader>
						{showResults && (
							<CardContent className="pt-0">
								{chartType === "table" ? (
									<DataTable data={message.queryResults} />
								) : (
									<ChartVisualization
										data={message.queryResults}
										chartType={chartType}
									/>
								)}
							</CardContent>
						)}
					</Card>
				)}

				{/* AI Analysis */}
				{message.analysis && (
					<Card className="border-2 border-primary/20">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<TrendingUp className="w-4 h-4 text-primary" />
									<CardTitle className="text-base">AI 数据分析</CardTitle>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowAnalysis(!showAnalysis)}
									className="h-7 text-xs"
								>
									<ChevronDown
										className={`w-3 h-3 transition-transform ${showAnalysis ? "rotate-180" : ""}`}
									/>
								</Button>
							</div>
						</CardHeader>
						{showAnalysis && (
							<CardContent className="pt-0">
								<div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{message.analysis}
									</ReactMarkdown>
								</div>
							</CardContent>
						)}
					</Card>
				)}

				<p className="text-xs text-muted-foreground">
					{message.timestamp.toLocaleTimeString("zh-CN")}
				</p>
			</div>
		</div>
	);
}
