import * as LucideIcons from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { ToolCategory } from "~/types/tool";

// 动态获取图标组件
const getIconComponent = (iconName: string) => {
	const IconComponent = (LucideIcons as any)[iconName];
	return IconComponent || LucideIcons.Code;
};

interface CategoryFilterProps {
	categories: ToolCategory[];
	selectedCategory: string | null;
	onCategoryChange: (categoryId: string | null) => void;
	toolCounts: Record<string, number>;
}

export function CategoryFilter({
	categories,
	selectedCategory,
	onCategoryChange,
	toolCounts,
}: CategoryFilterProps) {
	return (
		<div className="flex flex-wrap gap-2 mb-8">
			<Button
				variant={selectedCategory === null ? "default" : "outline"}
				size="sm"
				onClick={() => onCategoryChange(null)}
				className="gap-2"
			>
				<LucideIcons.Grid3X3 className="h-4 w-4" />
				全部工具
				<Badge variant="secondary" className="ml-1">
					{Object.values(toolCounts).reduce((sum, count) => sum + count, 0)}
				</Badge>
			</Button>

			{categories.map((category) => {
				const IconComponent = getIconComponent(category.icon);
				const isSelected = selectedCategory === category.id;
				const count = toolCounts[category.id] || 0;

				return (
					<Button
						key={category.id}
						variant={isSelected ? "default" : "outline"}
						size="sm"
						onClick={() => onCategoryChange(category.id)}
						className="gap-2"
						style={
							isSelected
								? {
										backgroundColor: category.color,
										borderColor: category.color,
										color: "white",
									}
								: {
										borderColor: `${category.color}40`,
									}
						}
					>
						<IconComponent
							className="h-4 w-4"
							style={
								isSelected ? { color: "white" } : { color: category.color }
							}
						/>
						{category.name}
						<Badge
							variant="secondary"
							className="ml-1"
							style={
								isSelected
									? { backgroundColor: "rgba(255,255,255,0.2)", color: "white" }
									: {}
							}
						>
							{count}
						</Badge>
					</Button>
				);
			})}
		</div>
	);
}
