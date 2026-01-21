import { AlertCircle, RefreshCcw, X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ErrorStateProps {
	error: string;
	onRetry: () => void;
	onDismiss: () => void;
}

export function ErrorState({ error, onRetry, onDismiss }: ErrorStateProps) {
	return (
		<div className="flex items-center gap-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
			<div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
				<AlertCircle className="h-5 w-5 text-destructive" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-destructive">加载失败</p>
				<p className="text-sm text-destructive/80 truncate">{error}</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Button
					variant="ghost"
					size="sm"
					className="h-8 text-muted-foreground hover:text-foreground"
					onClick={onDismiss}
				>
					<X className="h-4 w-4" />
				</Button>
				<Button size="sm" className="h-8 gap-1.5" onClick={onRetry}>
					<RefreshCcw className="h-3.5 w-3.5" />
					重试
				</Button>
			</div>
		</div>
	);
}
