import { Link2, Plus, Search } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EmptyStateProps {
	searchQuery: string;
	onCreateClick: () => void;
}

export function EmptyState({ searchQuery, onCreateClick }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-20 px-4">
			<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
				{searchQuery ? (
					<Search className="h-8 w-8 text-muted-foreground/60" />
				) : (
					<Link2 className="h-8 w-8 text-muted-foreground/60" />
				)}
			</div>
			<h3 className="text-lg font-semibold text-foreground mb-2">
				{searchQuery ? "没有找到匹配的链接" : "开始创建你的第一个链接"}
			</h3>
			<p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
				{searchQuery
					? `没有找到包含 "${searchQuery}" 的链接配置，请尝试其他关键词或清除搜索条件`
					: "创建 A/B 链接配置，根据规则智能路由访问者到不同的目标页面"}
			</p>
			{!searchQuery && (
				<Button onClick={onCreateClick} className="gap-2">
					<Plus className="h-4 w-4" />
					创建链接
				</Button>
			)}
		</div>
	);
}
