import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Filter,
	Globe2,
	RefreshCcw,
	Search,
	ShieldAlert,
	Smartphone,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import type {
	AccessLog,
	DeviceType,
	Direction,
	LinkConfig,
	LogQueryParams,
} from "~/types/ab-router";
import { COMMON_COUNTRIES } from "~/types/ab-router";

// ============ 筛选器组件 ============

interface LogTableFilterProps {
	links: LinkConfig[];
	filter: LogQueryParams;
	onFilterChange: (filter: LogQueryParams) => void;
	onSearch: () => void;
}

export function LogTableFilter({
	links: _links,
	filter,
	onFilterChange,
	onSearch,
}: LogTableFilterProps) {
	const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

	// 将日期字符串转换为 Date 对象
	const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
	const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

	// 将 Date 对象转换为日期字符串 (YYYY-MM-DD)
	const dateToString = (date: Date | undefined): string | undefined => {
		if (!date) return undefined;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	// 计算活跃的筛选数量
	const activeFiltersCount = [
		filter.linkId,
		filter.startDate,
		filter.endDate,
		filter.device,
		filter.direction,
		filter.ip,
		filter.country,
		filter.isProxy !== undefined,
		filter.isSpider !== undefined,
	].filter(Boolean).length;

	const hasFilters = activeFiltersCount > 0;

	const handleClear = () => {
		onFilterChange({ page: 1, limit: filter.limit || 20 });
		setIsAdvancedOpen(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			onSearch();
		}
	};

	const handleLinkIdChange = (value: string) => {
		onFilterChange({
			...filter,
			linkId: value.trim() || undefined,
			page: 1,
		});
	};

	return (
		<Card className="border-border/60 shadow-sm">
			<CardContent className="p-4">
				<div className="flex flex-wrap items-center gap-3">
					{/* 筛选图标和标签 */}
					<div className="flex items-center gap-2 text-foreground/70">
						<Filter className="h-4 w-4" />
						<span className="text-sm font-medium">筛选</span>
						{hasFilters && (
							<Badge
								variant="secondary"
								className="h-5 px-1.5 text-xs font-medium"
							>
								{activeFiltersCount}
							</Badge>
						)}
					</div>

					{/* 链路 ID 输入 */}
					<div className="relative">
						<Input
							value={filter.linkId || ""}
							onChange={(e) => handleLinkIdChange(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="链路 ID"
							className="w-[140px] h-9 bg-background border-border/60"
						/>
					</div>

					{/* 日期范围 */}
					<DatePicker
						value={startDate}
						onChange={(date) =>
							onFilterChange({
								...filter,
								startDate: dateToString(date),
								page: 1,
							})
						}
						placeholder="开始日期"
						className="w-[140px] h-9"
					/>
					<span className="text-muted-foreground text-sm">至</span>
					<DatePicker
						value={endDate}
						onChange={(date) =>
							onFilterChange({
								...filter,
								endDate: dateToString(date),
								page: 1,
							})
						}
						placeholder="结束日期"
						className="w-[140px] h-9"
					/>

					{/* 去向 */}
					<Select
						value={filter.direction || "all"}
						onValueChange={(value) =>
							onFilterChange({
								...filter,
								direction: value === "all" ? undefined : (value as Direction),
								page: 1,
							})
						}
					>
						<SelectTrigger className="w-[120px] h-9 bg-background border-border/60">
							<SelectValue placeholder="全部去向" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部去向</SelectItem>
							<SelectItem value="real">真实链接</SelectItem>
							<SelectItem value="review">审核链接</SelectItem>
						</SelectContent>
					</Select>

					{/* 设备类型 */}
					<Select
						value={filter.device || "all"}
						onValueChange={(value) =>
							onFilterChange({
								...filter,
								device: value === "all" ? undefined : (value as DeviceType),
								page: 1,
							})
						}
					>
						<SelectTrigger className="w-[120px] h-9 bg-background border-border/60">
							<SelectValue placeholder="全部设备" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部设备</SelectItem>
							<SelectItem value="Mobile">移动端</SelectItem>
							<SelectItem value="PC">桌面端</SelectItem>
							<SelectItem value="Tablet">平板</SelectItem>
						</SelectContent>
					</Select>

					{/* 高级筛选按钮 */}
					<Button
						variant="ghost"
						size="sm"
						className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
						onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
					>
						高级筛选
						<ChevronDown
							className={`h-4 w-4 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
						/>
					</Button>

					{/* 搜索和清除 */}
					<div className="flex items-center gap-2 ml-auto">
						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								className="h-9 text-muted-foreground hover:text-foreground gap-1"
								onClick={handleClear}
							>
								<X className="h-4 w-4" />
								清除
							</Button>
						)}
						<Button size="sm" className="h-9 gap-1.5" onClick={onSearch}>
							<Search className="h-4 w-4" />
							搜索
						</Button>
					</div>
				</div>

				{/* 高级筛选面板 */}
				{isAdvancedOpen && (
					<div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-border/40">
						{/* IP 过滤 */}
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								value={filter.ip || ""}
								onChange={(e) =>
									onFilterChange({
										...filter,
										ip: e.target.value || undefined,
									})
								}
								onKeyDown={handleKeyDown}
								placeholder="IP 地址 (支持 192.168.*.*)"
								className="w-[200px] h-9 pl-8 bg-background border-border/60"
							/>
						</div>

						{/* 国家选择 */}
						<Select
							value={filter.country || "all"}
							onValueChange={(value) =>
								onFilterChange({
									...filter,
									country: value === "all" ? undefined : value,
									page: 1,
								})
							}
						>
							<SelectTrigger className="w-[120px] h-9 bg-background border-border/60">
								<SelectValue placeholder="全部国家" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部国家</SelectItem>
								{COMMON_COUNTRIES.map((country) => (
									<SelectItem key={country.code} value={country.code}>
										{country.code} - {country.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* 代理过滤 */}
						<Select
							value={
								filter.isProxy === undefined
									? "all"
									: filter.isProxy
										? "true"
										: "false"
							}
							onValueChange={(value) =>
								onFilterChange({
									...filter,
									isProxy: value === "all" ? undefined : value === "true",
									page: 1,
								})
							}
						>
							<SelectTrigger className="w-[110px] h-9 bg-background border-border/60">
								<SelectValue placeholder="代理" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="true">是代理</SelectItem>
								<SelectItem value="false">非代理</SelectItem>
							</SelectContent>
						</Select>

						{/* 蜘蛛过滤 */}
						<Select
							value={
								filter.isSpider === undefined
									? "all"
									: filter.isSpider
										? "true"
										: "false"
							}
							onValueChange={(value) =>
								onFilterChange({
									...filter,
									isSpider: value === "all" ? undefined : value === "true",
									page: 1,
								})
							}
						>
							<SelectTrigger className="w-[110px] h-9 bg-background border-border/60">
								<SelectValue placeholder="蜘蛛" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">全部</SelectItem>
								<SelectItem value="true">是蜘蛛</SelectItem>
								<SelectItem value="false">非蜘蛛</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ============ 表格骨架屏 ============

export function LogTableSkeleton() {
	return (
		<Table>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					<TableHead className="w-[180px]">访问信息</TableHead>
					<TableHead className="w-[180px]">时间</TableHead>
					<TableHead className="w-[120px]">网络状态</TableHead>
					<TableHead className="w-[100px]">去向</TableHead>
					<TableHead>设备信息</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{Array.from({ length: 8 }).map((_, i) => (
					<TableRow key={i} className="hover:bg-transparent">
						<TableCell>
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-32" />
							</div>
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-32" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-5 w-16 rounded-full" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-6 w-14 rounded-full" />
						</TableCell>
						<TableCell>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-3 w-16" />
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

// ============ 空状态 ============

export function LogTableEmpty() {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-4">
			<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
				<Clock className="h-8 w-8 text-muted-foreground/60" />
			</div>
			<h3 className="text-base font-semibold text-foreground mb-1">
				暂无访问日志
			</h3>
			<p className="text-sm text-muted-foreground text-center max-w-sm">
				当有用户访问链接时，日志将显示在这里
			</p>
		</div>
	);
}

// ============ 表格行组件 ============

interface LogTableRowProps {
	log: AccessLog;
}

function LogTableRow({ log }: LogTableRowProps) {
	return (
		<TooltipProvider delayDuration={200}>
			<TableRow className="group hover:bg-muted/40 transition-colors">
				{/* 访问信息：链路 ID + IP */}
				<TableCell className="py-3">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<code className="text-xs font-mono font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
								{log.linkId}
							</code>
							{log.ipInfo.countryCode !== "-" && (
								<span className="text-xs font-medium text-amber-600 dark:text-amber-400">
									{log.ipInfo.countryCode}
								</span>
							)}
						</div>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="text-xs text-muted-foreground font-mono cursor-help">
									{log.ip}
									{log.ipInfo.city !== "-" && (
										<span className="ml-1.5 font-sans">
											· {log.ipInfo.city}
										</span>
									)}
								</div>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="max-w-xs">
								<div className="space-y-1 text-xs">
									<div>IP: {log.ip}</div>
									<div>
										国家: {log.ipInfo.countryName} ({log.ipInfo.countryCode})
									</div>
									<div>区域: {log.ipInfo.region}</div>
									<div>城市: {log.ipInfo.city}</div>
									{log.ipInfo.isp !== "-" && <div>ISP: {log.ipInfo.isp}</div>}
								</div>
							</TooltipContent>
						</Tooltip>
					</div>
				</TableCell>

				{/* 时间 */}
				<TableCell className="py-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="cursor-help">
								<div className="flex items-center gap-1.5 text-sm text-foreground">
									<Clock className="h-3.5 w-3.5 text-muted-foreground" />
									{log.timeInfo.beijing}
								</div>
								{log.timeInfo.local !== log.timeInfo.beijing && (
									<div className="text-xs text-muted-foreground pl-5 mt-0.5">
										{log.timeInfo.local}
									</div>
								)}
							</div>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<div className="space-y-1 text-xs">
								<div>北京时间: {log.timeInfo.beijing}</div>
								<div>本地时间: {log.timeInfo.local}</div>
							</div>
						</TooltipContent>
					</Tooltip>
				</TableCell>

				{/* 网络状态 */}
				<TableCell className="py-3">
					<div className="flex flex-wrap items-center gap-1">
						{log.network.isProxy && (
							<Badge
								variant="secondary"
								className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] px-1.5 h-5 gap-0.5"
							>
								<ShieldAlert className="h-3 w-3" />
								代理
							</Badge>
						)}
						{log.network.isVpn && (
							<Badge
								variant="secondary"
								className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 text-[10px] px-1.5 h-5"
							>
								VPN
							</Badge>
						)}
						{log.network.isSpider && (
							<Badge
								variant="secondary"
								className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 text-[10px] px-1.5 h-5"
							>
								蜘蛛
							</Badge>
						)}
						{!log.network.isProxy &&
							!log.network.isVpn &&
							!log.network.isSpider && (
								<Badge
									variant="secondary"
									className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] px-1.5 h-5"
								>
									正常
								</Badge>
							)}
					</div>
				</TableCell>

				{/* 去向 */}
				<TableCell className="py-3">
					<Tooltip>
						<TooltipTrigger asChild>
							<Badge
								variant="secondary"
								className={`cursor-help font-medium ${
									log.directionInfo.result === "real"
										? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
										: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
								}`}
							>
								{log.directionInfo.result === "real" ? "真实" : "审核"}
							</Badge>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-sm">
							<div className="space-y-1.5 text-xs">
								{log.directionInfo.finalUrl !== "-" && (
									<div className="break-all font-mono">
										{log.directionInfo.finalUrl}
									</div>
								)}
								{log.directionInfo.reasons.length > 0 && (
									<div className="pt-1.5 border-t border-border/50">
										<div className="font-medium mb-1">决策原因:</div>
										{log.directionInfo.reasons.map((reason, i) => (
											<div key={i} className="text-foreground/80">
												• {reason}
											</div>
										))}
									</div>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				</TableCell>

				{/* 设备信息 */}
				<TableCell className="py-3">
					<div className="space-y-0.5">
						<div className="flex items-center gap-1.5 text-sm text-foreground">
							<Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
							{log.deviceDisplay}
						</div>
						<div className="text-xs text-muted-foreground pl-5">
							{log.browserDisplay}
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-5">
							<Globe2 className="h-3 w-3" />
							{log.languageDisplay}
						</div>
					</div>
				</TableCell>
			</TableRow>
		</TooltipProvider>
	);
}

// ============ 分页组件 ============

interface PaginationProps {
	page: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
}

function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
	const totalPages = Math.ceil(total / pageSize);
	const canGoPrev = page > 1;
	const canGoNext = page < totalPages;

	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				disabled={!canGoPrev}
				onClick={() => onPageChange(page - 1)}
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>
			<span className="text-sm text-muted-foreground min-w-[80px] text-center">
				{page} / {totalPages}
			</span>
			<Button
				variant="outline"
				size="icon"
				className="h-8 w-8"
				disabled={!canGoNext}
				onClick={() => onPageChange(page + 1)}
			>
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

// ============ 主表格组件 ============

interface LogTableProps {
	logs: AccessLog[];
	total: number;
	loading: boolean;
	error: string | null;
	pagination?: {
		page: number;
		limit: number;
		hasMore: boolean;
	};
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onRefresh: () => void;
	onDismissError: () => void;
}

export function LogTable({
	logs,
	total,
	loading,
	error,
	pagination,
	onPageChange,
	onLimitChange: _onLimitChange,
	onRefresh,
	onDismissError,
}: LogTableProps) {
	void _onLimitChange; // Reserved for future use
	const page = pagination?.page ?? 1;
	const pageSize = pagination?.limit ?? 50;
	if (error) {
		return (
			<Card className="border-border/60 shadow-sm">
				<CardContent className="py-12">
					<div className="flex flex-col items-center justify-center text-center">
						<div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
							<X className="h-6 w-6 text-destructive" />
						</div>
						<p className="text-sm text-destructive font-medium mb-4">{error}</p>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={onDismissError}>
								忽略
							</Button>
							<Button size="sm" onClick={onRefresh}>
								重试
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (loading && logs.length === 0) {
		return (
			<Card className="border-border/60 shadow-sm">
				<CardContent className="p-0">
					<LogTableSkeleton />
				</CardContent>
			</Card>
		);
	}

	if (logs.length === 0) {
		return (
			<Card className="border-border/60 shadow-sm">
				<CardContent className="p-0">
					<LogTableEmpty />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-border/60 shadow-sm">
			<CardContent className="p-0">
				<div className="max-h-[600px] overflow-auto">
					<Table>
						<TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[180px] font-semibold text-foreground/80">
									访问信息
								</TableHead>
								<TableHead className="w-[180px] font-semibold text-foreground/80">
									时间
								</TableHead>
								<TableHead className="w-[120px] font-semibold text-foreground/80">
									网络状态
								</TableHead>
								<TableHead className="w-[100px] font-semibold text-foreground/80">
									去向
								</TableHead>
								<TableHead className="font-semibold text-foreground/80">
									设备信息
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.map((log) => (
								<LogTableRow key={log.id} log={log} />
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
			<CardFooter className="flex items-center justify-between py-3 px-4 border-t border-border/50 bg-muted/30">
				<div className="flex items-center gap-3 text-sm text-muted-foreground">
					<span>
						共 <span className="font-medium text-foreground">{total}</span>{" "}
						条记录
					</span>
					{loading && (
						<RefreshCcw className="h-4 w-4 animate-spin text-primary" />
					)}
				</div>
				<div className="flex items-center gap-3">
					{onPageChange && (
						<Pagination
							page={page}
							total={total}
							pageSize={pageSize}
							onPageChange={onPageChange}
						/>
					)}
					<Button
						variant="outline"
						size="sm"
						className="h-8 gap-1.5"
						onClick={onRefresh}
						disabled={loading}
					>
						<RefreshCcw
							className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
						/>
						刷新
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
