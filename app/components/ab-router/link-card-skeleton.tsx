export function LinkCardSkeleton() {
	return (
		<div className="rounded-xl border border-border/50 bg-card p-5 animate-pulse">
			<div className="flex items-start justify-between mb-4">
				<div className="space-y-2">
					<div className="h-5 w-32 bg-muted rounded" />
					<div className="h-3 w-20 bg-muted rounded" />
				</div>
				<div className="h-6 w-16 bg-muted rounded-full" />
			</div>
			<div className="space-y-2 mb-4">
				<div className="h-3 w-full bg-muted rounded" />
				<div className="h-3 w-3/4 bg-muted rounded" />
			</div>
			<div className="flex gap-2">
				<div className="h-8 flex-1 bg-muted rounded" />
				<div className="h-8 w-8 bg-muted rounded" />
			</div>
		</div>
	);
}
