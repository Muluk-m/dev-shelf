import {
	Check,
	ChevronLeft,
	ChevronRight,
	Clock,
	Copy,
	ExternalLink,
	Globe2,
	Leaf,
	List,
	Loader2,
	MoreHorizontal,
	Pencil,
	Play,
	Shield,
	ShieldAlert,
	Trash2,
	Zap,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import { getABRouterGoUrl } from "~/lib/api";
import {
	COMMON_COUNTRIES,
	type LinkConfig,
	type LinkMode,
} from "~/types/ab-router";

// 模式配置
const modeConfig: Record<
	LinkMode,
	{ label: string; className: string; icon: typeof Shield }
> = {
	all_open: {
		label: "全开放",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
		icon: Zap,
	},
	review: {
		label: "审核",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
		icon: Shield,
	},
	final_link: {
		label: "全审核",
		className:
			"bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
		icon: ShieldAlert,
	},
	green: {
		label: "绿色",
		className:
			"bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
		icon: Leaf,
	},
};

interface LinkTableProps {
	links: LinkConfig[];
	copiedId: string | null;
	onCopy: (url: string, id: string) => void;
	onEdit: (link: LinkConfig) => void;
	onPreview?: (link: LinkConfig) => void;
	onDelete: (link: LinkConfig) => void;
	onViewLogs?: (linkId: string) => void;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasMore: boolean;
	};
	onPageChange?: (page: number) => void;
	statsLoading?: boolean;
}

export function LinkTable({
	links,
	copiedId,
	onCopy,
	onEdit,
	onPreview,
	onDelete,
	onViewLogs,
	pagination,
	onPageChange,
	statsLoading = false,
}: LinkTableProps) {
	if (links.length === 0) {
		return null;
	}

	return (
		<Card className="border-border/60 shadow-sm">
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/60 hover:bg-muted/60">
								<TableHead className="w-[200px] font-semibold text-foreground/80">
									链路信息
								</TableHead>
								<TableHead className="min-w-[320px] font-semibold text-foreground/80">
									跳转链接
								</TableHead>
								<TableHead className="w-[100px] font-semibold text-foreground/80">
									模式
								</TableHead>
								<TableHead className="w-[180px] font-semibold text-foreground/80">
									统计
								</TableHead>
								<TableHead className="w-[140px] font-semibold text-foreground/80">
									时间
								</TableHead>
								<TableHead className="w-[100px] text-right font-semibold text-foreground/80">
									操作
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{links.map((link) => (
								<LinkTableRow
									key={link.id}
									link={link}
									copiedId={copiedId}
									onCopy={onCopy}
									onEdit={onEdit}
									onPreview={onPreview}
									onDelete={onDelete}
									onViewLogs={onViewLogs}
									statsLoading={statsLoading}
								/>
							))}
						</TableBody>
					</Table>
				</div>

				{/* 分页控件 */}
				{pagination && onPageChange && pagination.totalPages > 1 && (
					<div className="flex items-center justify-between px-6 py-4 border-t border-border/60">
						<div className="text-sm text-muted-foreground">
							共 {pagination.total} 条记录，第 {pagination.page} /{" "}
							{pagination.totalPages} 页
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pagination.page - 1)}
								disabled={pagination.page === 1}
								className="gap-1"
							>
								<ChevronLeft className="h-4 w-4" />
								上一页
							</Button>
							<div className="flex items-center gap-1">
								{generatePageNumbers(
									pagination.page,
									pagination.totalPages,
								).map((pageNum, idx) =>
									pageNum === "..." ? (
										<span
											key={`ellipsis-${idx}`}
											className="px-2 text-muted-foreground"
										>
											...
										</span>
									) : (
										<Button
											key={pageNum}
											variant={
												pageNum === pagination.page ? "default" : "outline"
											}
											size="sm"
											onClick={() => onPageChange(pageNum as number)}
											className="min-w-[36px]"
										>
											{pageNum}
										</Button>
									),
								)}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pagination.page + 1)}
								disabled={!pagination.hasMore}
								className="gap-1"
							>
								下一页
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// 生成页码数组，带省略号
function generatePageNumbers(
	currentPage: number,
	totalPages: number,
): (number | string)[] {
	const pages: (number | string)[] = [];

	if (totalPages <= 7) {
		// 总页数小于等于7，全部显示
		for (let i = 1; i <= totalPages; i++) {
			pages.push(i);
		}
	} else {
		// 总页数大于7，使用省略号
		if (currentPage <= 4) {
			// 当前页靠前
			for (let i = 1; i <= 5; i++) {
				pages.push(i);
			}
			pages.push("...");
			pages.push(totalPages);
		} else if (currentPage >= totalPages - 3) {
			// 当前页靠后
			pages.push(1);
			pages.push("...");
			for (let i = totalPages - 4; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// 当前页在中间
			pages.push(1);
			pages.push("...");
			for (let i = currentPage - 1; i <= currentPage + 1; i++) {
				pages.push(i);
			}
			pages.push("...");
			pages.push(totalPages);
		}
	}

	return pages;
}

interface LinkTableRowProps {
	link: LinkConfig;
	copiedId: string | null;
	onCopy: (url: string, id: string) => void;
	onEdit: (link: LinkConfig) => void;
	onPreview?: (link: LinkConfig) => void;
	onDelete: (link: LinkConfig) => void;
	onViewLogs?: (linkId: string) => void;
	statsLoading?: boolean;
}

function LinkTableRow({
	link,
	copiedId,
	onCopy,
	onEdit,
	onPreview,
	onDelete,
	onViewLogs,
	statsLoading = false,
}: LinkTableRowProps) {
	const goUrl = getABRouterGoUrl(link.id);
	const mode = modeConfig[link.mode] || modeConfig.review;
	const ModeIcon = mode.icon;

	// 投放地区显示 - 绿色模式下不显示（因为绿色模式下countries表示审核区域，逻辑相反）
	const countries = link.rules.countries || [];
	const hasCountries = countries.length > 0 && link.mode !== "green";

	// 格式化国家显示：中文名 + 代码
	const formatCountry = (code: string) => {
		const country = COMMON_COUNTRIES.find((c) => c.code === code);
		return country ? `${country.name}(${code})` : code;
	};

	const countriesDisplay =
		countries.length > 2
			? `${countries.slice(0, 2).map(formatCountry).join(", ")}...`
			: countries.map(formatCountry).join(", ");

	const countriesFullDisplay = countries.map(formatCountry).join(", ");

	// 统计数据
	const reviewCount = link.stats?.reviewCount ?? 0;
	const realCount = link.stats?.realCount ?? 0;
	const todayReviewCount = link.stats?.todayReviewCount ?? 0;
	const todayRealCount = link.stats?.todayRealCount ?? 0;

	// 格式化时间
	const formatTime = (dateStr?: string) => {
		if (!dateStr) return "-";
		try {
			const date = new Date(dateStr);
			if (Number.isNaN(date.getTime())) return "-";
			return date.toLocaleString("zh-CN", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return "-";
		}
	};

	return (
		<TooltipProvider delayDuration={200}>
			<TableRow className="group hover:bg-muted/40 transition-colors">
				{/* 链路信息 - 合并 ID、名称、地区 */}
				<TableCell className="py-3">
					<div className="space-y-1">
						<div className="font-medium text-sm text-foreground">
							{link.name}
						</div>
						<div className="flex items-center gap-2">
							<code className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
								{link.id}
							</code>
							{hasCountries && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help">
											<Globe2 className="h-3 w-3" />
											{countriesDisplay}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<div className="text-xs">
											投放地区: {countriesFullDisplay}
										</div>
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					</div>
				</TableCell>

				{/* 跳转链接 - 简化显示 */}
				<TableCell className="py-3">
					<div className="space-y-1.5">
						<LinkRow label="真实" url={link.realLink} variant="success" />
						<LinkRow label="审核" url={link.reviewLink} variant="warning" />
					</div>
				</TableCell>

				{/* 模式 */}
				<TableCell className="py-3">
					<Badge
						variant="secondary"
						className={`gap-1 font-medium ${mode.className}`}
					>
						<ModeIcon className="h-3 w-3" />
						{mode.label}
					</Badge>
				</TableCell>

				{/* 统计 - 分别显示审核和真实访问次数 */}
				<TableCell className="py-3">
					{statsLoading ? (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" />
							<span>加载中...</span>
						</div>
					) : (
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-xs">
								<span className="inline-flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-amber-500" />
									<span className="text-muted-foreground">审核</span>
									<span className="font-medium text-foreground">
										{reviewCount}
									</span>
								</span>
								<span className="text-muted-foreground/50">|</span>
								<span className="inline-flex items-center gap-1">
									<span className="w-2 h-2 rounded-full bg-emerald-500" />
									<span className="text-muted-foreground">真实</span>
									<span className="font-medium text-foreground">
										{realCount}
									</span>
								</span>
							</div>
							<div className="text-[11px] text-muted-foreground">
								今日: 审核 +{todayReviewCount} / 真实 +{todayRealCount}
							</div>
						</div>
					)}
				</TableCell>

				{/* 时间 */}
				<TableCell className="py-3">
					<div className="space-y-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
									<Clock className="h-3 w-3" />
									<span>{formatTime(link.createdAt)}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<div className="text-xs">创建时间: {link.createdAt || "-"}</div>
							</TooltipContent>
						</Tooltip>
						{link.updatedAt && link.updatedAt !== link.createdAt && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="text-[11px] text-muted-foreground/70 cursor-help">
										更新: {formatTime(link.updatedAt)}
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<div className="text-xs">
										更新时间: {link.updatedAt || "-"}
									</div>
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</TableCell>

				{/* 操作 */}
				<TableCell className="py-3">
					<div className="flex items-center justify-end gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-muted-foreground hover:text-foreground"
									onClick={() => onCopy(goUrl, link.id)}
								>
									{copiedId === link.id ? (
										<Check className="h-4 w-4 text-emerald-600" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{copiedId === link.id ? "已复制" : "复制跳转链接"}
							</TooltipContent>
						</Tooltip>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-muted-foreground hover:text-foreground"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-36">
								{onViewLogs && (
									<DropdownMenuItem
										onClick={() => onViewLogs(link.id)}
										className="cursor-pointer gap-2"
									>
										<List className="h-4 w-4" />
										查看日志
									</DropdownMenuItem>
								)}
								{onPreview && (
									<DropdownMenuItem
										onClick={() => onPreview(link)}
										className="cursor-pointer gap-2"
									>
										<Play className="h-4 w-4" />
										预览决策
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => onEdit(link)}
									className="cursor-pointer gap-2"
								>
									<Pencil className="h-4 w-4" />
									编辑
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => onDelete(link)}
									className="cursor-pointer gap-2 text-destructive focus:text-destructive"
								>
									<Trash2 className="h-4 w-4" />
									删除
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</TableCell>
			</TableRow>
		</TooltipProvider>
	);
}

// 链接行子组件
function LinkRow({
	label,
	url,
	variant,
}: {
	label: string;
	url: string;
	variant: "success" | "warning";
}) {
	const colors = {
		success:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
		warning:
			"bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
	};

	return (
		<div className="flex items-center gap-2 group/link">
			<span
				className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[variant]}`}
			>
				{label}
			</span>
			<Tooltip>
				<TooltipTrigger asChild>
					<span className="text-xs text-foreground/70 truncate max-w-[220px] cursor-help hover:text-foreground transition-colors">
						{url}
					</span>
				</TooltipTrigger>
				<TooltipContent side="bottom" className="max-w-md">
					<p className="text-xs break-all font-mono">{url}</p>
				</TooltipContent>
			</Tooltip>
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0"
				onClick={(e) => e.stopPropagation()}
			>
				<ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
			</a>
		</div>
	);
}
