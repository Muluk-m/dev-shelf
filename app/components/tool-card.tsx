import {
	ArrowUpRight,
	ChevronDown,
	Clock,
	Code,
	ExternalLink,
	Globe,
	Server,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { recordToolUsage } from "~/lib/api";
import { cn } from "~/lib/utils";
import type { Tool, ToolEnvironment } from "~/types/tool";

const statusConfig = {
	active: {
		label: "正常",
		dotColor: "bg-emerald-500",
		className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
	},
	maintenance: {
		label: "维护中",
		dotColor: "bg-amber-500",
		className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
	deprecated: {
		label: "已废弃",
		dotColor: "bg-red-500",
		className: "bg-red-500/10 text-red-600 dark:text-red-400",
	},
};

interface ToolCardProps {
	tool: Tool;
	onViewDetails?: (tool: Tool) => void;
}

export function ToolCard({ tool, onViewDetails }: ToolCardProps) {
	const navigate = useNavigate();
	const statusInfo = statusConfig[tool.status];

	const [selectedEnv, setSelectedEnv] = useState<ToolEnvironment>(
		tool.environments?.[0] || {
			name: "default",
			label: "默认环境",
			url: "#",
			isExternal: false,
		},
	);

	const handleAccessTool = (environment: ToolEnvironment) => {
		void recordToolUsage(tool.id);
		if (tool.isInternal) {
			navigate(environment.url);
		} else {
			if (environment.isExternal) {
				window.open(environment.url, "_blank");
			} else {
				window.location.href = environment.url;
			}
		}
	};

	const handleViewDetails = () => {
		void recordToolUsage(tool.id);
		if (tool.isInternal) {
			navigate(`/tools/${tool.id}`);
		} else {
			if (onViewDetails) {
				onViewDetails(tool);
			} else {
				navigate(`/tools/${tool.id}`);
			}
		}
	};

	return (
		<div className="tool-card group cursor-pointer">
			{/* Card Content */}
			<div className="p-5 space-y-4">
				{/* Header with Icon and Title */}
				<div className="flex items-start gap-4">
					{/* Icon Container */}
					<div className="relative flex-shrink-0">
						<div className="tool-card-icon transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20">
							{tool.icon ? (
								<Avatar className="h-7 w-7">
									<AvatarImage src={tool.icon} className="object-contain" />
									<AvatarFallback className="text-xs bg-transparent">
										{tool.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
							) : (
								<Code className="h-6 w-6" />
							)}
						</div>
						{/* Status indicator dot */}
						<div
							className={cn(
								"absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card",
								statusInfo.dotColor,
							)}
						/>
					</div>

					{/* Title and Badges */}
					<div className="flex-1 min-w-0">
						<h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
							{tool.name}
						</h3>
						<div className="flex items-center gap-2 mt-1.5">
							<span
								className={cn(
									"inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
									statusInfo.className,
								)}
							>
								{statusInfo.label}
							</span>
							{tool.isInternal && (
								<span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
									<Sparkles className="h-3 w-3" />
									内部
								</span>
							)}
						</div>
					</div>

					{/* Quick Action */}
					<button
						type="button"
						onClick={handleViewDetails}
						className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
					>
						<ArrowUpRight className="h-4 w-4" />
					</button>
				</div>

				{/* Description */}
				<p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
					{tool.description}
				</p>

				{/* Tags */}
				{tool.tags.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{tool.tags.slice(0, 3).map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className="text-xs px-2.5 py-0.5 font-normal bg-secondary/50 hover:bg-secondary/80 transition-colors"
							>
								{tag}
							</Badge>
						))}
						{tool.tags.length > 3 && (
							<Badge
								variant="secondary"
								className="text-xs px-2.5 py-0.5 font-normal bg-secondary/50"
							>
								+{tool.tags.length - 3}
							</Badge>
						)}
					</div>
				)}

				{/* Meta Info */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Clock className="h-3.5 w-3.5" />
					<span>更新于 {tool.lastUpdated}</span>
				</div>
			</div>

			{/* Footer Actions */}
			<div className="px-5 pb-5 pt-2 flex gap-2 border-t border-border/50">
				{tool.environments.length > 1 ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="flex-1 gap-2 bg-transparent rounded-xl h-9"
							>
								{selectedEnv.isExternal ? (
									<Globe className="h-3.5 w-3.5" />
								) : (
									<Server className="h-3.5 w-3.5" />
								)}
								<span className="truncate">{selectedEnv.label}</span>
								<ChevronDown className="h-3.5 w-3.5 shrink-0" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-44 rounded-xl">
							{tool.environments.map((env) => (
								<DropdownMenuItem
									key={env.name}
									onClick={() => setSelectedEnv(env)}
									className="gap-2 cursor-pointer rounded-lg"
								>
									{env.isExternal ? (
										<Globe className="h-3.5 w-3.5" />
									) : (
										<Server className="h-3.5 w-3.5" />
									)}
									{env.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0 px-3">
						{selectedEnv.isExternal ? (
							<Globe className="h-3.5 w-3.5 shrink-0" />
						) : (
							<Server className="h-3.5 w-3.5 shrink-0" />
						)}
						<span className="truncate">{selectedEnv.label}</span>
					</div>
				)}

				<Button
					size="sm"
					className="flex-1 gap-2 rounded-xl h-9 bg-primary hover:bg-primary/90"
					onClick={() => handleAccessTool(selectedEnv)}
				>
					{!tool.isInternal && selectedEnv.isExternal && (
						<ExternalLink className="h-3.5 w-3.5" />
					)}
					{tool.isInternal ? "使用工具" : "打开工具"}
				</Button>
			</div>
		</div>
	);
}
