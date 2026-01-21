import {
	Check,
	Copy,
	ExternalLink,
	Globe2,
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
import type { LinkConfig, LinkMode } from "~/types/ab-router";

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
};

interface LinkTableProps {
	links: LinkConfig[];
	copiedId: string | null;
	onCopy: (url: string, id: string) => void;
	onEdit: (link: LinkConfig) => void;
	onPreview?: (link: LinkConfig) => void;
	onDelete: (link: LinkConfig) => void;
}

export function LinkTable({
	links,
	copiedId,
	onCopy,
	onEdit,
	onPreview,
	onDelete,
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
								<TableHead className="w-[120px] font-semibold text-foreground/80">
									统计
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
								/>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

interface LinkTableRowProps {
	link: LinkConfig;
	copiedId: string | null;
	onCopy: (url: string, id: string) => void;
	onEdit: (link: LinkConfig) => void;
	onPreview?: (link: LinkConfig) => void;
	onDelete: (link: LinkConfig) => void;
}

function LinkTableRow({
	link,
	copiedId,
	onCopy,
	onEdit,
	onPreview,
	onDelete,
}: LinkTableRowProps) {
	const goUrl = getABRouterGoUrl(link.id);
	const mode = modeConfig[link.mode] || modeConfig.review;
	const ModeIcon = mode.icon;

	// 投放地区显示
	const countries = link.rules.countries || [];
	const hasCountries = countries.length > 0;

	// 统计数据
	const totalCount =
		(link.stats?.reviewCount ?? 0) + (link.stats?.realCount ?? 0);
	const todayCount =
		(link.stats?.todayReviewCount ?? 0) + (link.stats?.todayRealCount ?? 0);

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
											{countries.length > 2
												? `${countries.slice(0, 2).join(", ")}...`
												: countries.join(", ")}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<div className="text-xs">
											投放地区: {countries.join(", ")}
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

				{/* 统计 - 简化为关键数据 */}
				<TableCell className="py-3">
					<div className="text-sm">
						<div className="font-medium text-foreground">{totalCount}</div>
						<div className="text-xs text-muted-foreground">
							今日 +{todayCount}
						</div>
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
