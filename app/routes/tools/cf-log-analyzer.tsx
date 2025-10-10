"use client";

import {
	AlertTriangle,
	BarChart3,
	ChevronRight,
	Copy,
	FileText,
	Folder,
	RefreshCw,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { listCfLogs, queryCfLogs } from "~/lib/api";
import { cn } from "~/lib/utils";
import type {
	CfLogEntry,
	CfLogListResponse,
	CfLogQueryFilters,
	CfLogQueryResponse,
} from "~/types/cf-logs";

const DEFAULT_QUERY_LIMIT = 200;

export default function CfLogAnalyzerPage() {
	const [date, setDate] = useState(() => formatDateInput(new Date()));
	const [prefix, setPrefix] = useState(() => "");
	const [listResult, setListResult] = useState<CfLogListResponse | null>(null);
	const [listLoading, setListLoading] = useState(false);
	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [queryResult, setQueryResult] = useState<CfLogQueryResponse | null>(
		null,
	);
	const [queryLoading, setQueryLoading] = useState(false);
	const [queryLimit, setQueryLimit] = useState(DEFAULT_QUERY_LIMIT);
	const [statusCodesInput, setStatusCodesInput] = useState("200");
	const [methodsInput, setMethodsInput] = useState("GET");
	const [hostsInput, setHostsInput] = useState("");
	const [pathIncludesInput, setPathIncludesInput] = useState("");
	const [clientIPsInput, setClientIPsInput] = useState("");
	const [searchText, setSearchText] = useState("");

	const derivedDatePrefix = useMemo(
		() => (date ? `date=${date}/` : ""),
		[date],
	);

	const handleApplyDatePrefix = useCallback(() => {
		if (!derivedDatePrefix) return;
		setPrefix(derivedDatePrefix);
	}, [derivedDatePrefix]);

	const handleListLogs = useCallback(
		async ({
			cursor: nextCursor,
			prefixOverride,
		}: {
			cursor?: string;
			prefixOverride?: string;
		} = {}) => {
			const effectivePrefix = (prefixOverride ?? prefix).trim();
			if (prefixOverride !== undefined) {
				setPrefix(prefixOverride);
			}
			setListLoading(true);
			try {
				const response = await listCfLogs({
					prefix: effectivePrefix || undefined,
					cursor: nextCursor,
					limit: 200,
				});
				setListResult((prev) =>
					nextCursor ? mergeListResults(prev, response) : response,
				);
			} catch (error) {
				console.error(error);
				toast.error((error as Error).message || "无法读取日志列表");
			} finally {
				setListLoading(false);
			}
		},
		[prefix],
	);

	const handleSelectObject = useCallback((key: string) => {
		setSelectedKey(key);
		setQueryResult(null);
	}, []);

	const handleQueryLogs = useCallback(
		async (nextCursor?: number, append = false) => {
			if (!selectedKey) {
				toast.error("请先选择一个日志文件");
				return;
			}
			setQueryLoading(true);
			try {
				const filters = buildFilters({
					statusCodes: statusCodesInput,
					methods: methodsInput,
					hosts: hostsInput,
					path: pathIncludesInput,
					clientIPs: clientIPsInput,
				});

				const response = await queryCfLogs({
					key: selectedKey,
					limit: queryLimit,
					cursor: nextCursor,
					searchText: searchText.trim() || undefined,
					filters,
				});

				setQueryResult((prev) => {
					if (append && prev) {
						return {
							...response,
							entries: [...prev.entries, ...response.entries],
							summary: response.summary,
						};
					}
					return response;
				});
			} catch (error) {
				console.error(error);
				toast.error((error as Error).message || "查询日志失败");
			} finally {
				setQueryLoading(false);
			}
		},
		[
			selectedKey,
			statusCodesInput,
			methodsInput,
			hostsInput,
			pathIncludesInput,
			clientIPsInput,
			queryLimit,
			searchText,
		],
	);

	const breadcrumbs = useMemo(() => buildBreadcrumbs(prefix), [prefix]);

	const summary = queryResult?.summary;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-start justify-between gap-4">
					<div>
						<CardTitle className="text-2xl font-semibold">
							Cloudflare 日志分析
						</CardTitle>
						<CardDescription>
							浏览存储在 R2 的 Cloudflare Logpush
							文件，按条件过滤并快速查看请求详情。
						</CardDescription>
					</div>
					<Button
						onClick={() => void handleListLogs()}
						disabled={listLoading}
						variant="secondary"
						className="gap-2"
					>
						<RefreshCw
							className={cn("h-4 w-4", listLoading && "animate-spin")}
							aria-hidden
						/>
						刷新列表
					</Button>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="space-y-2">
						<Label htmlFor="log-date">按日期快速定位</Label>
						<div className="flex gap-2">
							<Input
								id="log-date"
								type="date"
								value={date}
								onChange={(event) => setDate(event.target.value)}
							/>
							<Button
								variant="outline"
								onClick={handleApplyDatePrefix}
								disabled={!derivedDatePrefix}
							>
								应用为前缀
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							默认会拼出 <code>{derivedDatePrefix || "date=YYYY-MM-DD/"}</code>
							，如目录结构不同可直接在右侧自定义。
						</p>
					</div>
					<div className="space-y-2 sm:col-span-2 lg:col-span-2">
						<Label htmlFor="prefix-input">R2 路径前缀</Label>
						<Input
							id="prefix-input"
							placeholder="例如 cf-logs/2024-09-26/"
							value={prefix}
							onChange={(event) => setPrefix(event.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							留空会列出整个 bucket，建议带上前缀以减小遍历范围。
						</p>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-[360px_1fr]">
				<Card className="h-full">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Folder className="h-5 w-5 text-primary" aria-hidden />
							R2 日志目录
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{breadcrumbs.length > 0 ? (
							<Breadcrumb>
								<BreadcrumbList>
									{breadcrumbs.map((item, index) => (
										<>
											{index > 0 ? (
												<BreadcrumbSeparator key={`sep-${item.fullPrefix}`} />
											) : null}
											<BreadcrumbItem key={item.fullPrefix}>
												{index === breadcrumbs.length - 1 ? (
													<BreadcrumbPage>{item.label}</BreadcrumbPage>
												) : (
													<Button
														variant="link"
														className="h-auto p-0"
														onClick={() => {
															void handleListLogs({
																prefixOverride: item.fullPrefix,
															});
														}}
													>
														{item.label}
													</Button>
												)}
											</BreadcrumbItem>
										</>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						) : (
							<p className="text-xs text-muted-foreground">
								配置前缀后可通过面包屑快速回退上一层目录。
							</p>
						)}
						<ScrollArea className="h-[420px] rounded border">
							<div className="p-3 space-y-2">
								{listLoading && <LoadingPlaceholder message="载入文件中..." />}
								{!listLoading && listResult?.prefixes.length ? (
									<div>
										<p className="text-xs font-medium text-muted-foreground mb-2">
											子目录
										</p>
										<div className="flex flex-wrap gap-2">
											{listResult.prefixes.map((folder) => (
												<Button
													key={folder}
													variant="outline"
													size="sm"
													className="gap-2"
													onClick={() => {
														void handleListLogs({ prefixOverride: folder });
													}}
												>
													<Folder className="h-4 w-4" aria-hidden />
													<span className="truncate max-w-[200px]">
														{folder}
													</span>
												</Button>
											))}
										</div>
									</div>
								) : null}

								{!listLoading && listResult?.objects.length ? (
									<div className="space-y-2">
										<p className="text-xs font-medium text-muted-foreground">
											日志文件
										</p>
										{listResult.objects.map((object) => {
											const isActive = selectedKey === object.key;
											return (
												<button
													key={object.key}
													type="button"
													className={cn(
														"w-full rounded border px-3 py-2 text-left text-sm transition hover:border-primary/70 hover:bg-primary/5",
														isActive && "border-primary bg-primary/10",
													)}
													onClick={() => handleSelectObject(object.key)}
												>
													<div className="flex items-center gap-2">
														<FileText
															className="h-4 w-4 text-primary"
															aria-hidden
														/>
														<span
															className="font-medium truncate"
															title={object.key}
														>
															{object.key}
														</span>
													</div>
													<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
														<span>{formatBytes(object.size)}</span>
														<span>{formatTimestamp(object.uploadedAt)}</span>
													</div>
												</button>
											);
										})}
									</div>
								) : null}

								{!listLoading &&
								!listResult?.objects.length &&
								!listResult?.prefixes.length ? (
									<div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
										<BarChart3 className="h-8 w-8" aria-hidden />
										<p>
											该前缀下没有找到日志文件，试试调整日期或检查目录拼写。
										</p>
									</div>
								) : null}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">查询条件</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Field label="搜索关键字">
									<Input
										placeholder="在原始 JSON 中模糊匹配"
										value={searchText}
										onChange={(event) => setSearchText(event.target.value)}
									/>
								</Field>
								<Field label="状态码 (逗号分隔)">
									<Input
										placeholder="200,404"
										value={statusCodesInput}
										onChange={(event) =>
											setStatusCodesInput(event.target.value)
										}
									/>
								</Field>
								<Field label="HTTP 方法">
									<Input
										placeholder="GET,POST"
										value={methodsInput}
										onChange={(event) => setMethodsInput(event.target.value)}
									/>
								</Field>
								<Field label="Host 过滤">
									<Input
										placeholder="example.com"
										value={hostsInput}
										onChange={(event) => setHostsInput(event.target.value)}
									/>
								</Field>
								<Field label="路径包含">
									<Input
										placeholder="/api/login"
										value={pathIncludesInput}
										onChange={(event) =>
											setPathIncludesInput(event.target.value)
										}
									/>
								</Field>
								<Field label="客户端 IP">
									<Input
										placeholder="多个用逗号分隔"
										value={clientIPsInput}
										onChange={(event) => setClientIPsInput(event.target.value)}
									/>
								</Field>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<Field label="单次返回条数 (<=500)">
										<Input
											type="number"
											value={queryLimit}
											onChange={(event) =>
												setQueryLimit(
													Number.parseInt(event.target.value, 10) ||
														DEFAULT_QUERY_LIMIT,
												)
											}
											min={1}
											max={500}
										/>
									</Field>
								</div>
								<Button
									onClick={() => void handleQueryLogs()}
									disabled={queryLoading}
									className="gap-2"
								>
									<BarChart3
										className={cn("h-4 w-4", queryLoading && "animate-spin")}
										aria-hidden
									/>
									开始分析
								</Button>
							</div>
							{!selectedKey ? (
								<div className="flex items-center gap-2 rounded border border-dashed p-3 text-xs text-muted-foreground">
									<AlertTriangle className="h-4 w-4" aria-hidden />
									<span>
										还未选择日志文件，先在左侧选择一个对象再发起查询。
									</span>
								</div>
							) : (
								<p className="text-xs text-muted-foreground">
									当前文件：<code>{selectedKey}</code>
								</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">统计概览</CardTitle>
							<CardDescription>基于匹配到的日志条目进行聚合。</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{summary ? (
								<div className="space-y-4">
									<div className="grid gap-3 md:grid-cols-4">
										<StatBlock label="总匹配" value={summary.matchedLines} />
										<StatBlock label="已读取行" value={summary.totalLines} />
										<StatBlock
											label="边缘响应字节"
											value={formatBytes(summary.bytes.edgeResponse)}
										/>
										<StatBlock
											label="源站响应字节"
											value={formatBytes(summary.bytes.originResponse)}
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-3">
										<SummaryList
											title="状态码"
											data={summary.byStatus}
											highlight
										/>
										<SummaryList title="Top Host" data={summary.byHost} />
										<SummaryList
											title="国家"
											data={summary.byCountry}
											uppercase
										/>
									</div>
									<SummaryList
										title="热门路径"
										data={summary.byPath}
										limit={6}
										mono
									/>
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									运行查询后会在这里展示聚合统计。
								</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">匹配日志条目</CardTitle>
							<CardDescription>
								展示前 {queryLimit} 条匹配结果，可继续加载更多。
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{queryLoading && <LoadingPlaceholder message="正在分析日志..." />}
							{!queryLoading && queryResult?.entries.length ? (
								<ScrollArea className="h-[520px] rounded border">
									<div className="space-y-3 p-3">
										{queryResult.entries.map((entry) => (
											<EntryCard
												key={`${entry.lineNumber}-${entry.raw.slice(0, 24)}`}
												entry={entry}
											/>
										))}
									</div>
								</ScrollArea>
							) : null}

							{!queryLoading && !queryResult?.entries.length ? (
								<p className="text-sm text-muted-foreground">
									暂无匹配结果，试着调整过滤条件或放宽范围。
								</p>
							) : null}

							{queryResult?.nextCursor ? (
								<div className="flex justify-end">
									<Button
										variant="outline"
										onClick={() =>
											void handleQueryLogs(queryResult.nextCursor, true)
										}
										disabled={queryLoading}
										className="gap-2"
									>
										<ChevronRight className="h-4 w-4" aria-hidden />
										加载更多
									</Button>
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="space-y-1">
			<Label className="text-xs font-medium text-muted-foreground">
				{label}
			</Label>
			{children}
		</div>
	);
}

function LoadingPlaceholder({ message }: { message: string }) {
	return (
		<div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
			<RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
			{message}
		</div>
	);
}

function StatBlock({
	label,
	value,
}: {
	label: string;
	value: number | string;
}) {
	return (
		<div className="rounded border p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-lg font-semibold">{value}</p>
		</div>
	);
}

function SummaryList({
	title,
	data,
	limit = 5,
	highlight = false,
	uppercase = false,
	mono = false,
}: {
	title: string;
	data: Record<string, number>;
	limit?: number;
	highlight?: boolean;
	uppercase?: boolean;
	mono?: boolean;
}) {
	const items = useMemo(
		() =>
			Object.entries(data)
				.sort((a, b) => b[1] - a[1])
				.slice(0, limit),
		[data, limit],
	);
	if (items.length === 0) {
		return null;
	}
	return (
		<div className="rounded border p-3">
			<p className="text-xs font-medium text-muted-foreground">{title}</p>
			<div className="mt-2 space-y-1.5">
				{items.map(([key, count]) => (
					<div
						key={key}
						className="flex items-center justify-between gap-2 text-xs"
					>
						<span
							className={cn(
								mono && "font-mono",
								uppercase && "uppercase",
								highlight && "font-semibold text-foreground",
							)}
							title={key}
						>
							{truncateMiddle(key, 36)}
						</span>
						<span className="text-muted-foreground">{count}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function EntryCard({ entry }: { entry: CfLogEntry }) {
	const data = entry.data ?? {};
	const status = (data.EdgeResponseStatus ?? data.OriginResponseStatus) as
		| number
		| string
		| undefined;
	const method = data.ClientRequestMethod as string | undefined;
	const host = (data.ClientRequestHost ?? data.ClientRequestHTTPHost) as
		| string
		| undefined;
	const path = (data.ClientRequestURI ?? data.ClientRequestPath) as
		| string
		| undefined;
	const country = (data.ClientCountry ?? data.ClientCountryCode) as
		| string
		| undefined;
	const rayId = (data.RayID ?? data.ClientRequestRayID) as string | undefined;
	const cacheStatus = data.CacheCacheStatus as string | undefined;
	const clientIP = data.ClientIP as string | undefined;
	const edgeTime = data.EdgeTimeToFirstByte as number | string | undefined;

	const handleCopy = useCallback(() => {
		const payload = entry.raw || JSON.stringify(data, null, 2);
		navigator.clipboard
			.writeText(payload)
			.then(() => toast.success("已复制日志内容"))
			.catch(() => toast.error("复制失败"));
	}, [data, entry.raw]);

	return (
		<div className="rounded border p-3 text-sm">
			<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
				<span className="font-mono text-[11px] text-foreground">
					#{entry.lineNumber}
				</span>
				{status !== undefined ? (
					<Badge variant="secondary">{status}</Badge>
				) : null}
				{method ? <Badge variant="outline">{method}</Badge> : null}
				{cacheStatus ? <Badge variant="outline">{cacheStatus}</Badge> : null}
				{country ? <Badge variant="outline">{country}</Badge> : null}
				{edgeTime ? <Badge variant="outline">TTFB {edgeTime}</Badge> : null}
			</div>
			{path ? (
				<p className="mt-2 font-mono text-xs text-foreground">{path}</p>
			) : null}
			<div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
				{host ? <InfoRow label="Host" value={host} /> : null}
				{clientIP ? <InfoRow label="Client IP" value={clientIP} /> : null}
				{rayId ? <InfoRow label="Ray ID" value={rayId} /> : null}
			</div>
			<Separator className="my-3" />
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>查看原始 JSON</span>
				<Button
					variant="link"
					className="h-auto p-0 text-xs"
					onClick={handleCopy}
				>
					<Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
					复制
				</Button>
			</div>
			<pre className="mt-2 max-h-48 overflow-auto rounded bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
				{entry.raw || JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<span className="text-[10px] uppercase tracking-wide text-muted-foreground">
				{label}
			</span>
			<span className="truncate text-xs text-foreground" title={value}>
				{value}
			</span>
		</div>
	);
}

function formatDateInput(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mergeListResults(
	previous: CfLogListResponse | null,
	current: CfLogListResponse,
): CfLogListResponse {
	if (!previous) {
		return current;
	}
	return {
		objects: [...previous.objects, ...current.objects],
		prefixes: Array.from(new Set([...previous.prefixes, ...current.prefixes])),
		truncated: current.truncated,
	};
}

function buildFilters({
	statusCodes,
	methods,
	hosts,
	path,
	clientIPs,
}: {
	statusCodes: string;
	methods: string;
	hosts: string;
	path: string;
	clientIPs: string;
}): CfLogQueryFilters | undefined {
	const filters: CfLogQueryFilters = {};

	const statusList = statusCodes
		.split(/[,\s]+/)
		.map((code) => Number.parseInt(code, 10))
		.filter((code) => !Number.isNaN(code));
	if (statusList.length) {
		filters.statusCodes = statusList;
	}

	const methodsList = methods
		.split(/[,\s]+/)
		.map((item) => item.trim().toUpperCase())
		.filter(Boolean);
	if (methodsList.length) {
		filters.methods = methodsList;
	}

	const hostsList = hosts
		.split(/[,\s]+/)
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
	if (hostsList.length) {
		filters.hosts = hostsList;
	}

	const clientIPsList = clientIPs
		.split(/[,\s]+/)
		.map((item) => item.trim())
		.filter(Boolean);
	if (clientIPsList.length) {
		filters.clientIPs = clientIPsList;
	}

	if (path.trim()) {
		filters.pathIncludes = path.trim();
	}

	return Object.keys(filters).length ? filters : undefined;
}

function formatBytes(value: number | undefined): string {
	if (!value || Number.isNaN(value)) {
		return "-";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = value;
	let unitIndex = 0;
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}
	return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

function formatTimestamp(timestamp: string): string {
	if (!timestamp) {
		return "";
	}
	try {
		return new Date(timestamp).toLocaleString();
	} catch {
		return timestamp;
	}
}

function truncateMiddle(value: string, maxLength: number) {
	if (value.length <= maxLength) {
		return value;
	}
	const half = Math.floor((maxLength - 3) / 2);
	return `${value.slice(0, half)}...${value.slice(-half)}`;
}

function buildBreadcrumbs(
	path: string,
): Array<{ label: string; fullPrefix: string }> {
	const segments = path.split("/").filter(Boolean);
	return segments.map((segment, index) => {
		const fullPrefix = `${segments.slice(0, index + 1).join("/")}/`;
		return { label: segment, fullPrefix };
	});
}
