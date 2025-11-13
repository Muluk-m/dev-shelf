import {
	Clock,
	Download,
	Edit2,
	Heart,
	History,
	Search,
	Star,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
	clearNonFavoriteHistory,
	deleteQueryFromHistory,
	exportQueryHistory,
	filterQueryHistory,
	getQueryHistory,
	importQueryHistory,
	type QueryHistoryItem,
	toggleQueryFavorite,
	updateQueryName,
} from "~/lib/query-history-storage";

interface QueryHistoryProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onLoadQuery: (item: QueryHistoryItem) => void;
}

export function QueryHistory({
	open,
	onOpenChange,
	onLoadQuery,
}: QueryHistoryProps) {
	const [history, setHistory] = useState<QueryHistoryItem[]>([]);
	const [searchText, setSearchText] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	// Load history
	useEffect(() => {
		if (open) {
			loadHistory();
		}
	}, [open, searchText, typeFilter, activeTab]);

	const loadHistory = () => {
		const filters = {
			searchText: searchText || undefined,
			type:
				typeFilter === "all"
					? undefined
					: (typeFilter as QueryHistoryItem["type"]),
			favorite: activeTab === "favorites" ? true : undefined,
		};
		const filtered = filterQueryHistory(filters);
		setHistory(filtered);
	};

	const handleToggleFavorite = (id: string) => {
		toggleQueryFavorite(id);
		loadHistory();
	};

	const handleStartEdit = (item: QueryHistoryItem) => {
		setEditingId(item.id);
		setEditName(item.name || "");
	};

	const handleSaveEdit = () => {
		if (editingId) {
			updateQueryName(editingId, editName);
			setEditingId(null);
			loadHistory();
		}
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditName("");
	};

	const handleDeleteClick = (id: string) => {
		setDeletingId(id);
		setShowDeleteConfirm(true);
	};

	const handleConfirmDelete = () => {
		if (deletingId) {
			deleteQueryFromHistory(deletingId);
			setShowDeleteConfirm(false);
			setDeletingId(null);
			loadHistory();
		}
	};

	const handleClearHistory = () => {
		if (confirm("确定要清空所有非收藏的查询历史吗?")) {
			clearNonFavoriteHistory();
			loadHistory();
		}
	};

	const handleExport = () => {
		const json = exportQueryHistory();
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `query-history-${new Date().toISOString().split("T")[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					try {
						const content = event.target?.result as string;
						importQueryHistory(content);
						loadHistory();
						alert("导入成功!");
					} catch (error) {
						alert("导入失败: " + (error as Error).message);
					}
				};
				reader.readAsText(file);
			}
		};
		input.click();
	};

	const formatTimestamp = (timestamp: number) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "刚刚";
		if (diffMins < 60) return `${diffMins} 分钟前`;
		if (diffHours < 24) return `${diffHours} 小时前`;
		if (diffDays < 7) return `${diffDays} 天前`;

		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getTypeLabel = (type: QueryHistoryItem["type"]) => {
		const labels = {
			natural: "自然语言",
			template: "预设模板",
			custom: "自定义SQL",
		};
		return labels[type];
	};

	const getTypeColor = (type: QueryHistoryItem["type"]) => {
		const colors = {
			natural: "default",
			template: "secondary",
			custom: "outline",
		};
		return colors[type] as "default" | "secondary" | "outline";
	};

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="right" className="w-full sm:max-w-2xl p-0">
					<div className="flex flex-col h-full">
						<SheetHeader className="p-6 pb-4 border-b">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<History className="w-5 h-5" />
									<SheetTitle>查询历史</SheetTitle>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={handleExport}
										title="导出历史"
									>
										<Download className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleImport}
										title="导入历史"
									>
										<Upload className="w-4 h-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleClearHistory}
										title="清空历史"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
							<SheetDescription>
								查看和管理你的查询历史记录，快速复用之前的查询
							</SheetDescription>
						</SheetHeader>

						<div className="p-6 pt-4 space-y-4 border-b">
							{/* Search and Filter */}
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										placeholder="搜索查询..."
										value={searchText}
										onChange={(e) => setSearchText(e.target.value)}
										className="pl-9"
									/>
								</div>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">全部类型</SelectItem>
										<SelectItem value="natural">自然语言</SelectItem>
										<SelectItem value="template">预设模板</SelectItem>
										<SelectItem value="custom">自定义SQL</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Tabs */}
							<Tabs
								value={activeTab}
								onValueChange={(v) => setActiveTab(v as any)}
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="all">
										全部 ({getQueryHistory().length})
									</TabsTrigger>
									<TabsTrigger value="favorites">
										<Star className="w-3 h-3 mr-1" />
										收藏 ({getQueryHistory().filter((q) => q.favorite).length})
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						<ScrollArea className="flex-1">
							<div className="p-6 pt-4 space-y-3">
								{history.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<History className="w-12 h-12 text-muted-foreground mb-3" />
										<p className="text-muted-foreground">
											{activeTab === "favorites"
												? "暂无收藏的查询"
												: "暂无查询历史"}
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											执行查询后会自动保存到历史记录
										</p>
									</div>
								) : (
									history.map((item) => (
										<div
											key={item.id}
											className="border rounded-lg p-4 hover:border-primary/50 transition-colors space-y-3"
										>
											{/* Header */}
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													{editingId === item.id ? (
														<div className="flex items-center gap-2">
															<Input
																value={editName}
																onChange={(e) => setEditName(e.target.value)}
																className="h-7 text-sm"
																placeholder="输入查询名称..."
																autoFocus
																onKeyDown={(e) => {
																	if (e.key === "Enter") handleSaveEdit();
																	if (e.key === "Escape") handleCancelEdit();
																}}
															/>
															<Button
																size="sm"
																variant="ghost"
																onClick={handleSaveEdit}
																className="h-7 px-2"
															>
																保存
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={handleCancelEdit}
																className="h-7 px-2"
															>
																<X className="w-3 h-3" />
															</Button>
														</div>
													) : (
														<div className="flex items-center gap-2">
															<h4 className="font-medium text-sm truncate">
																{item.name || "未命名查询"}
															</h4>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => handleStartEdit(item)}
																className="h-5 w-5 p-0 shrink-0"
															>
																<Edit2 className="w-3 h-3" />
															</Button>
														</div>
													)}
													<div className="flex items-center gap-2 mt-1">
														<Badge
															variant={getTypeColor(item.type)}
															className="text-xs"
														>
															{getTypeLabel(item.type)}
														</Badge>
														<span className="text-xs text-muted-foreground">
															<Clock className="w-3 h-3 inline mr-1" />
															{formatTimestamp(item.timestamp)}
														</span>
													</div>
												</div>
												<div className="flex items-center gap-1 shrink-0">
													<Button
														size="sm"
														variant="ghost"
														onClick={() => handleToggleFavorite(item.id)}
														className={`h-7 w-7 p-0 ${item.favorite ? "text-yellow-500" : ""}`}
													>
														{item.favorite ? (
															<Star className="w-4 h-4 fill-current" />
														) : (
															<Star className="w-4 h-4" />
														)}
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => handleDeleteClick(item.id)}
														className="h-7 w-7 p-0 text-destructive"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>

											{/* Query Content */}
											<div className="space-y-2">
												<div className="text-sm">
													<Label className="text-xs text-muted-foreground">
														查询内容
													</Label>
													<p className="mt-1 text-muted-foreground line-clamp-2">
														{item.query}
													</p>
												</div>

												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<span>项目: {item.projectIds}</span>
													{item.resultCount !== undefined && (
														<span>结果: {item.resultCount} 条</span>
													)}
													{item.executionTime !== undefined && (
														<span>耗时: {item.executionTime.toFixed(2)}ms</span>
													)}
												</div>
											</div>

											{/* Actions */}
											<div className="flex gap-2">
												<Button
													size="sm"
													onClick={() => {
														onLoadQuery(item);
														onOpenChange(false);
													}}
													className="flex-1"
												>
													加载查询
												</Button>
											</div>
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</div>
				</SheetContent>
			</Sheet>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认删除</DialogTitle>
						<DialogDescription>
							确定要删除这条查询历史吗？此操作无法撤销。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteConfirm(false)}
						>
							取消
						</Button>
						<Button variant="destructive" onClick={handleConfirmDelete}>
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
