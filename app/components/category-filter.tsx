import * as LucideIcons from "lucide-react";
import { useRef } from "react";
import { cn } from "~/lib/utils";
import type { ToolCategory } from "~/types/tool";

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
	const scrollRef = useRef<HTMLDivElement>(null);
	const totalCount = Object.values(toolCounts).reduce(
		(sum, count) => sum + count,
		0,
	);

	return (
		<div className="relative">
			{/* Scrollable Pills Container */}
			<div
				ref={scrollRef}
				className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
				style={{
					scrollbarWidth: "none",
					msOverflowStyle: "none",
				}}
			>
				{/* All Tools Pill */}
				<button
					type="button"
					onClick={() => onCategoryChange(null)}
					className={cn(
						"flex-shrink-0 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl",
						"text-sm font-medium transition-all duration-200 cursor-pointer",
						"border border-transparent",
						selectedCategory === null
							? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
							: "bg-secondary/50 text-secondary-foreground hover:bg-secondary hover:border-border",
					)}
				>
					<LucideIcons.LayoutGrid className="h-4 w-4" />
					<span>全部</span>
					<span
						className={cn(
							"inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md text-xs font-semibold",
							selectedCategory === null
								? "bg-white/20 text-primary-foreground"
								: "bg-muted text-muted-foreground",
						)}
					>
						{totalCount}
					</span>
				</button>

				{/* Category Pills */}
				{categories.map((category) => {
					const IconComponent = getIconComponent(category.icon);
					const isSelected = selectedCategory === category.id;
					const count = toolCounts[category.id] || 0;

					return (
						<button
							key={category.id}
							type="button"
							onClick={() => onCategoryChange(category.id)}
							className={cn(
								"flex-shrink-0 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl",
								"text-sm font-medium transition-all duration-200 cursor-pointer",
								"border",
								isSelected
									? "shadow-lg"
									: "bg-secondary/50 text-secondary-foreground hover:bg-secondary border-transparent hover:border-border",
							)}
							style={
								isSelected
									? {
											backgroundColor: category.color,
											borderColor: category.color,
											color: "white",
											boxShadow: `0 10px 15px -3px ${category.color}40, 0 4px 6px -2px ${category.color}30`,
										}
									: undefined
							}
						>
							<IconComponent
								className="h-4 w-4 transition-colors"
								style={{
									color: isSelected ? "white" : category.color,
								}}
							/>
							<span>{category.name}</span>
							<span
								className={cn(
									"inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md text-xs font-semibold transition-colors",
									isSelected
										? "bg-white/20 text-white"
										: "bg-muted text-muted-foreground",
								)}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			{/* Fade indicators for scroll */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />

			{/* Hide scrollbar style */}
			<style>{`
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
			`}</style>
		</div>
	);
}
