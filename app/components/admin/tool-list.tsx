"use client";

import { Edit, ExternalLink, Globe, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
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
}

export function ToolList({
	tools,
	categories,
	onEdit,
	onDelete,
	showActions,
	loading = false,
	deleting = null,
}: ToolListProps) {
	const [deleteToolId, setDeleteToolId] = useState<string | null>(null);

	const getCategoryName = (categoryId: string) => {
		if (!categories || categories.length === 0) return categoryId;
		const category = categories.find((cat) => cat.id === categoryId);
		return category?.name || categoryId;
	};

	const getStatusColor = (status: Tool["status"]) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "maintenance":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			case "deprecated":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		}
	};

	const getStatusText = (status: Tool["status"]) => {
		switch (status) {
			case "active":
				return "正常";
			case "maintenance":
				return "维护中";
			case "deprecated":
				return "已废弃";
			default:
				return "未知";
		}
	};

	return (
		<div className="space-y-4">
			{loading ? (
				// Loading skeleton
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
												<Skeleton className="h-5 w-12" />
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
									<div className="flex gap-1">
										<Skeleton className="h-5 w-16" />
										<Skeleton className="h-5 w-20" />
										<Skeleton className="h-5 w-14" />
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
			) : (
				<>
					{tools.map((tool) => (
						<Card key={tool.id}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
											{tool.icon ? (
												<img
													src={tool.icon || "/placeholder.svg"}
													alt={tool.name}
													className="h-6 w-6"
												/>
											) : (
												<Settings className="h-5 w-5 text-primary" />
											)}
										</div>
										<div className="space-y-1">
											<h3 className="font-semibold">{tool.name}</h3>
											<p className="text-sm text-muted-foreground">
												{tool.description}
											</p>
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="text-xs">
													{getCategoryName(tool.category)}
												</Badge>
												<Badge className={`text-xs ${getStatusColor(tool.status)}`}>
													{getStatusText(tool.status)}
												</Badge>
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
															确定要删除工具 "{tool.name}" 吗？此操作无法撤销。
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
							<CardContent className="pt-0">
								<div className="space-y-3">
									<div className="flex flex-wrap gap-1">
										{tool.tags.map((tag) => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>

									<div className="space-y-2">
										{tool.environments?.[0] && (
											<div className="flex items-center gap-2 text-sm">
												<Globe className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">
													{tool.environments[0].label}:
												</span>
												<Badge variant="outline" className="text-xs">
													{tool.environments[0].isExternal
														? "外部链接"
														: "内部路由"}
												</Badge>
												<span className="text-muted-foreground">
													{tool.environments[0].url}
												</span>
												{tool.environments[0].isExternal && (
													<ExternalLink className="h-3 w-3 text-muted-foreground" />
												)}
											</div>
										)}

										{tool.environments?.[1] && (
											<div className="flex items-center gap-2 text-sm">
												<Settings className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">
													{tool.environments[1].label}:
												</span>
												<Badge variant="outline" className="text-xs">
													{tool.environments[1].isExternal
														? "外部链接"
														: "内部路由"}
												</Badge>
												<span className="text-muted-foreground">
													{tool.environments[1].url}
												</span>
												{tool.environments[1].isExternal && (
													<ExternalLink className="h-3 w-3 text-muted-foreground" />
												)}
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{!loading && tools.length === 0 && (
						<Card>
							<CardContent className="flex items-center justify-center py-12">
								<p className="text-muted-foreground">暂无工具</p>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}
