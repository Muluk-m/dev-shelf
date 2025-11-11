import { Loader2, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { analyzeData, convertToSQL, executeQuery } from "~/lib/api";
import { PWA_EVENT_TABLE_SCHEMA } from "~/lib/query-templates";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { ChatMessageComponent, type ChatMessage } from "./chat-message";
import { getClickHouseService } from "~/lib/clickhouse-service";

interface QueryChatProps {
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

export function QueryChat({ projectIds, queryFilters }: QueryChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const clickhouseService = getClickHouseService();

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

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
			ids.length === 1 ? `project_id = '${ids[0]}'` : `project_id IN (${ids.map((id) => `'${id}'`).join(", ")})`;
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
			const startDate = queryFilters.dateRange.startDate.toISOString().split("T")[0];
			const endDate = queryFilters.dateRange.endDate.toISOString().split("T")[0];
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

	const handleSendMessage = async () => {
		if (!input.trim() || loading) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setLoading(true);

		try {
			// Generate SQL from natural language
			const { sql, explanation } = await convertToSQL({
				naturalLanguage: input.trim(),
				schema: PWA_EVENT_TABLE_SCHEMA,
			});

			// Inject filters
			const finalSQL = injectFiltersIntoSQL(sql);

			// Validate SQL
			const validation = clickhouseService.validateSQL(finalSQL);
			if (!validation.valid) {
				throw new Error(validation.error || "SQL validation failed");
			}

			// Execute query
			const result = await executeQuery({ sql: finalSQL });

			// Create assistant message with results
			const assistantMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "根据你的需求,我已生成并执行以下查询:",
				timestamp: new Date(),
				sql: finalSQL,
				sqlExplanation: explanation,
				queryResults: result.data,
				executionTime: result.statistics?.elapsed,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			const errorMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "",
				timestamp: new Date(),
				error: error instanceof Error ? error.message : "Failed to process your request",
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	};

	const handleExecuteSQL = async (sql: string) => {
		setLoading(true);
		try {
			const finalSQL = injectFiltersIntoSQL(sql);
			const validation = clickhouseService.validateSQL(finalSQL);
			if (!validation.valid) {
				throw new Error(validation.error || "SQL validation failed");
			}

			const result = await executeQuery({ sql: finalSQL });

			// Update the last assistant message with new results
			setMessages((prev) => {
				const newMessages = [...prev];
				const lastAssistantIndex = newMessages.findLastIndex((m) => m.role === "assistant");
				if (lastAssistantIndex !== -1) {
					newMessages[lastAssistantIndex] = {
						...newMessages[lastAssistantIndex],
						sql: finalSQL,
						queryResults: result.data,
						executionTime: result.statistics?.elapsed,
						error: undefined,
					};
				}
				return newMessages;
			});
		} catch (error) {
			setMessages((prev) => {
				const newMessages = [...prev];
				const lastAssistantIndex = newMessages.findLastIndex((m) => m.role === "assistant");
				if (lastAssistantIndex !== -1) {
					newMessages[lastAssistantIndex] = {
						...newMessages[lastAssistantIndex],
						error: error instanceof Error ? error.message : "Query execution failed",
					};
				}
				return newMessages;
			});
		} finally {
			setLoading(false);
		}
	};

	const handleAnalyze = async (data: any[], sql: string) => {
		setLoading(true);
		try {
			const response = await analyzeData({
				data,
				sql,
				naturalQuery: messages.find((m) => m.role === "user")?.content,
			});

			// Update the last assistant message with analysis
			setMessages((prev) => {
				const newMessages = [...prev];
				const lastAssistantIndex = newMessages.findLastIndex((m) => m.role === "assistant");
				if (lastAssistantIndex !== -1) {
					newMessages[lastAssistantIndex] = {
						...newMessages[lastAssistantIndex],
						analysis: response.analysis,
					};
				}
				return newMessages;
			});
		} catch (error) {
			console.error("Analysis failed:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleEditSQL = async (sql: string) => {
		await handleExecuteSQL(sql);
	};

	const handleClearChat = () => {
		if (confirm("确定要清空对话历史吗?")) {
			setMessages([]);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="flex flex-col h-[calc(100vh-20rem)]">
			{/* Chat Messages Area */}
			<div className="flex-1 overflow-y-auto p-6 space-y-4">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
						<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
							<Send className="w-8 h-8 text-primary" />
						</div>
						<div>
							<h3 className="text-lg font-semibold mb-2">开始对话</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								用自然语言提问数据相关的问题。例如:
							</p>
							<div className="mt-4 space-y-2 text-sm text-muted-foreground">
								<p>• "最近 7 天的安装转化趋势"</p>
								<p>• "对比 Chrome 和广告平台的访问量"</p>
								<p>• "分析订阅通知的效果"</p>
							</div>
						</div>
					</div>
				) : (
					<>
						{messages.map((message, index) => (
							<ChatMessageComponent
								key={message.id}
								message={message}
								onExecuteSQL={handleExecuteSQL}
								onAnalyze={handleAnalyze}
								onEditSQL={handleEditSQL}
								isLatest={index === messages.length - 1 && message.role === "assistant"}
							/>
						))}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Input Area */}
			<Card className="border-t">
				<CardContent className="p-4">
					<div className="flex gap-2">
						<Textarea
							placeholder="问一个关于数据的问题... (Shift+Enter 换行)"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							rows={2}
							className="resize-none"
							disabled={loading}
						/>
						<div className="flex flex-col gap-2">
							<Button onClick={handleSendMessage} disabled={loading || !input.trim()} className="h-full">
								{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
							</Button>
							{messages.length > 0 && (
								<Button
									type="button"
									variant="outline"
									onClick={handleClearChat}
									disabled={loading}
									className="h-full"
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
