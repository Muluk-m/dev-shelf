import { SearchX } from "lucide-react";
import { ToolCard } from "~/components/tool-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import type { Tool } from "~/types/tool";

interface SearchResultsProps {
	tools: Tool[];
	query: string;
	totalCount: number;
	onViewDetails: (tool: Tool) => void;
}

export function SearchResults({
	tools,
	query,
	totalCount,
	onViewDetails,
}: SearchResultsProps) {
	if (tools.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<SearchX className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">未找到相关工具</h3>
					<p className="text-muted-foreground text-center max-w-md">
						{query
							? `没有找到与 "${query}" 相关的工具`
							: "没有符合筛选条件的工具"}
					</p>
					<div className="mt-4 text-sm text-muted-foreground">
						<p>建议：</p>
						<ul className="list-disc list-inside mt-1 space-y-1">
							<li>检查搜索词是否正确</li>
							<li>尝试使用更通用的关键词</li>
							<li>清除部分筛选条件</li>
						</ul>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{query && (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>搜索</span>
					<Badge variant="secondary">"{query}"</Badge>
					<span>共找到 {totalCount} 个结果</span>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{tools.map((tool) => (
					<ToolCard key={tool.id} tool={tool} onViewDetails={onViewDetails} />
				))}
			</div>
		</div>
	);
}
