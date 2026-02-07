import * as LucideIcons from "lucide-react";
import { Edit, Trash2 } from "lucide-react";
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
import type { ToolCategory } from "~/types/tool";

interface CategoryListProps {
	categories: ToolCategory[];
	onEdit: (category: ToolCategory) => void;
	onDelete: (categoryId: string) => void;
	loading?: boolean;
	deleting?: string | null;
	toolCounts?: Record<string, number>;
}

// 动态获取图标组件
const getIconComponent = (iconName: string) => {
	const IconComponent = (LucideIcons as any)[iconName];
	return IconComponent || LucideIcons.Code;
};

export function CategoryList({
	categories,
	onEdit,
	onDelete,
	loading = false,
	deleting = null,
	toolCounts = {},
}: CategoryListProps) {
	const renderSkeleton = () => (
		<>
			{[...Array(6)].map((_, index) => (
				<Card key={index}>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="space-y-2">
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-4 w-32" />
								</div>
							</div>
							<div className="flex gap-2">
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>
					</CardHeader>
				</Card>
			))}
		</>
	);

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{renderSkeleton()}
			</div>
		);
	}

	if (categories.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<p className="text-muted-foreground mb-4">还没有分类</p>
					<p className="text-sm text-muted-foreground">
						添加第一个分类来组织您的工具
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{categories.map((category) => {
				const IconComponent = getIconComponent(category.icon);
				const toolCount = toolCounts[category.id] || 0;
				const isDeleting = deleting === category.id;

				return (
					<Card key={category.id} className="relative">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div
										className="p-2 rounded-lg"
										style={{ backgroundColor: `${category.color}20` }}
									>
										<IconComponent
											className="h-6 w-6"
											style={{ color: category.color }}
										/>
									</div>
									<div className="space-y-1">
										<h3 className="text-base font-semibold leading-tight">
											{category.name}
										</h3>
										<div className="flex items-center gap-2">
											<Badge variant="secondary" className="text-xs">
												{toolCount} 个工具
											</Badge>
										</div>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onEdit(category)}
										className="h-8 w-8 p-0"
									>
										<Edit className="h-4 w-4" />
									</Button>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												disabled={isDeleting}
												className="h-8 w-8 p-0 text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>确认删除</AlertDialogTitle>
												<AlertDialogDescription>
													确定要删除分类 "{category.name}" 吗？
													{toolCount > 0 && (
														<span className="text-destructive">
															<br />
															注意：该分类下还有 {toolCount}{" "}
															个工具，删除后这些工具将失去分类。
														</span>
													)}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>取消</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => onDelete(category.id)}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												>
													确认删除
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
							{category.description && (
								<p className="text-sm text-muted-foreground mt-2 line-clamp-2">
									{category.description}
								</p>
							)}
						</CardHeader>
					</Card>
				);
			})}
		</div>
	);
}
