import {
	Check,
	Copy,
	Globe2,
	Monitor,
	MoreHorizontal,
	Pencil,
	Play,
	Trash2,
	Wifi,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { getABRouterGoUrl } from "~/lib/api";
import type { LinkConfig } from "~/types/ab-router";
import { ModeBadge } from "./mode-badge";

interface LinkCardProps {
	link: LinkConfig;
	copiedId: string | null;
	onCopy: (url: string, id: string) => void;
	onEdit: (link: LinkConfig) => void;
	onPreview: (link: LinkConfig) => void;
	onDelete: (link: LinkConfig) => void;
}

export function LinkCard({
	link,
	copiedId,
	onCopy,
	onEdit,
	onPreview,
	onDelete,
}: LinkCardProps) {
	const goUrl = getABRouterGoUrl(link.id);

	return (
		<TooltipProvider delayDuration={200}>
			<div className="group rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
				{/* 顶部区域 */}
				<div className="p-4 pb-3">
					<div className="flex items-start justify-between gap-3 mb-3">
						<div className="min-w-0 flex-1">
							<h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
								{link.name}
							</h3>
							<code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
								{link.id}
							</code>
						</div>
						<ModeBadge mode={link.mode} />
					</div>

					{/* 规则标签 */}
					{link.mode === "review" && (
						<div className="flex flex-wrap gap-1.5 mb-3">
							{link.rules.countries && link.rules.countries.length > 0 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-foreground/70 cursor-help">
											<Globe2 className="h-3 w-3" />
											{link.rules.countries.length} 国家
										</span>
									</TooltipTrigger>
									<TooltipContent>
										<div className="text-xs">
											{link.rules.countries.join(", ")}
										</div>
									</TooltipContent>
								</Tooltip>
							)}
							{link.rules.blockPC && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-foreground/70">
									<Monitor className="h-3 w-3" />
									屏蔽 PC
								</span>
							)}
							{link.rules.blockProxy && (
								<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-foreground/70">
									<Wifi className="h-3 w-3" />
									屏蔽代理
								</span>
							)}
							{link.rules.blockEmptyLanguage && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-foreground/70">
									空语言
								</span>
							)}
						</div>
					)}

					{/* 链接预览 */}
					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-xs">
							<span className="w-8 text-emerald-600 dark:text-emerald-400 font-medium">
								真实
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="text-foreground/60 truncate flex-1 cursor-help hover:text-foreground/80 transition-colors">
										{link.realLink}
									</span>
								</TooltipTrigger>
								<TooltipContent side="bottom" className="max-w-sm">
									<p className="text-xs font-mono break-all">{link.realLink}</p>
								</TooltipContent>
							</Tooltip>
						</div>
						<div className="flex items-center gap-2 text-xs">
							<span className="w-8 text-amber-600 dark:text-amber-400 font-medium">
								审核
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<span className="text-foreground/60 truncate flex-1 cursor-help hover:text-foreground/80 transition-colors">
										{link.reviewLink}
									</span>
								</TooltipTrigger>
								<TooltipContent side="bottom" className="max-w-sm">
									<p className="text-xs font-mono break-all">
										{link.reviewLink}
									</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</div>
				</div>

				{/* 底部操作区 */}
				<div className="px-4 py-2.5 bg-muted/40 border-t border-border/50 flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						className="flex-1 h-8 text-xs gap-1.5 font-medium"
						onClick={(e) => {
							e.stopPropagation();
							onCopy(goUrl, link.id);
						}}
					>
						{copiedId === link.id ? (
							<>
								<Check className="h-3.5 w-3.5 text-emerald-600" />
								已复制
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5" />
								复制链接
							</>
						)}
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36">
							<DropdownMenuItem
								onClick={() => onPreview(link)}
								className="cursor-pointer gap-2"
							>
								<Play className="h-4 w-4" />
								预览决策
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onEdit(link)}
								className="cursor-pointer gap-2"
							>
								<Pencil className="h-4 w-4" />
								编辑配置
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
			</div>
		</TooltipProvider>
	);
}
