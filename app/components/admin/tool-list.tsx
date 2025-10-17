"use client";

import {
	Edit,
	ExternalLink,
	Globe,
	Server,
	Settings,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import type { Tool, ToolCategory } from "~/types/tool";

interface ToolListProps {
	tools: Tool[];
	categories: ToolCategory[];
	onEdit: (tool: Tool) => void;
	onDelete: (toolId: string) => void;
	showActions: boolean;
	loading?: boolean;
	deleting?: string | null;
	searchTerm?: string;
	statusFilter?: "all" | Tool["status"];
}

const statusStyles: Record<Tool["status"], { badge: string; text: string }> = {
	active: {
		badge:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
		text: "正常",
	},
	maintenance: {
		badge:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
		text: "维护中",
	},
	deprecated: {
		badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
		text: "已废弃",
	},
};

export function ToolList({
	tools,
	categories,
	onEdit,
	onDelete,
	showActions,
	loading = false,
	deleting = null,
	searchTerm = "",
	statusFilter = "all",
}: ToolListProps) {
	const [deleteToolId, setDeleteToolId] = useState<string | null>(null);

	const getCategoryName = (categoryId: string) => {
		if (!categories || categories.length === 0) return categoryId;
		const category = categories.find((cat) => cat.id === categoryId);
		return category?.name || categoryId;
	};

	const filteredTools = useMemo(() => {
		const normalizedTerm = searchTerm.trim().toLowerCase();
		return tools.filter((tool) => {
			const matchesStatus =
				statusFilter === "all" ? true : tool.status === statusFilter;
			if (!matchesStatus) {
				return false;
			}

			if (!normalizedTerm) {
				return true;
			}

			const haystack = [
				tool.name,
				tool.description,
				tool.category,
				tool.tags.join(" "),
				(tool.environments || [])
					.map((env) => `${env.label} ${env.url}`)
					.join(" "),
			]
				.join(" ")
				.toLowerCase();

			return haystack.includes(normalizedTerm);
		});
	}, [tools, searchTerm, statusFilter]);

	const renderSkeleton = () => (
		<>
			{[...Array(3)].map((_, index) => (
				<Card key={index}>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="space-y-2">
									<Skeleton className="h-5 w-32" />
									<Skeleton className="h-4 w-48" />
									<div className="flex gap-2">
										<Skeleton className="h-5 w-16" />
										<Skeleton className="h-5 w-20" />
									</div>
								</div>
							</div>
							{showActions && (
								<div className="flex items-center gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
								</div>
							)}
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="space-y-3">
							<div className="flex gap-2">
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-5 w-20" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</>
	);

	return (
		<div className="space-y-4">
			{loading
				? renderSkeleton()
				: filteredTools.map((tool) => {
						const statusMeta = statusStyles[tool.status];

						return (
							<Card key={tool.id} className="transition-all hover:shadow-sm">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
												{tool.icon ? (
													<img
														src={tool.icon}
														alt={tool.name}
														className="h-6 w-6"
													/>
												) : (
													<Settings className="h-5 w-5 text-primary" />
												)}
											</div>
											<div className="space-y-1">
												<h3 className="text-base font-semibold leading-tight">
													{tool.name}
												</h3>
												<p className="text-sm text-muted-foreground line-clamp-2">
													{tool.description}
												</p>
												<div className="flex flex-wrap items-center gap-2 text-xs">
													<Badge variant="outline">
														{getCategoryName(tool.category)}
													</Badge>
													<Badge className={statusMeta.badge}>
														{statusMeta.text}
													</Badge>
													{tool.isInternal && (
														<Badge variant="secondary">内部</Badge>
													)}
												</div>
											</div>
										</div>
										{showActions && (
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => onEdit(tool)}
													disabled={deleting === tool.id}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => setDeleteToolId(tool.id)}
															disabled={deleting === tool.id}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>确认删除</AlertDialogTitle>
															<AlertDialogDescription>
																确定要删除工具 "{tool.name}"
																吗？此操作无法撤销。
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>取消</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => {
																	onDelete(tool.id);
																	setDeleteToolId(null);
																}}
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
																disabled={deleting === tool.id}
															>
																{deleting === tool.id ? "删除中..." : "删除"}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-3 pt-0">
									{tool.tags.length > 0 && (
										<div className="flex flex-wrap gap-2">
											{tool.tags.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs"
												>
													{tag}
												</Badge>
											))}
										</div>
									)}

									{tool.environments.length > 0 && (
										<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											{tool.environments.slice(0, 3).map((env) => (
												<Badge
													key={`${tool.id}-${env.name}`}
													variant="outline"
													className="flex items-center gap-1"
												>
													{env.isExternal ? (
														<Globe className="h-3 w-3" />
													) : (
														<Server className="h-3 w-3" />
													)}
													{env.label}
												</Badge>
											))}
											{tool.environments.length > 3 && (
												<Badge variant="outline">
													+{tool.environments.length - 3}
												</Badge>
											)}
										</div>
									)}

									<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
										<span>最近更新：{tool.lastUpdated}</span>
										{tool.environments[0] && (
											<button
												type="button"
												className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
												onClick={() =>
													window.open(tool.environments[0].url, "_blank")
												}
											>
												<ExternalLink className="h-3 w-3" />
												快速访问
											</button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}

			{!loading && filteredTools.length === 0 && (
				<Card className="border-dashed">
					<CardContent className="py-12 text-center text-sm text-muted-foreground">
						未找到符合条件的工具，试试调整搜索关键字或状态筛选。
					</CardContent>
				</Card>
			)}
		</div>
	);
}
