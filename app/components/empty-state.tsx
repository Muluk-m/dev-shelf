import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface EmptyStateProps {
	icon?: ReactNode;
	title?: string;
	description: string;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div className={cn("empty-state py-16", className)}>
			{/* Decorative background */}
			<div className="relative mb-6">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted/50 rounded-full blur-2xl scale-150" />
				<div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 border border-border/50 backdrop-blur-sm">
					{icon || <Search className="h-7 w-7 text-muted-foreground" />}
				</div>
			</div>

			{title && (
				<h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
			)}
			<p className="text-muted-foreground text-sm max-w-md leading-relaxed">
				{description}
			</p>
			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}
