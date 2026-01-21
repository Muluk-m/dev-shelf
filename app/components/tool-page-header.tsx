import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface ToolPageHeaderProps {
	icon: ReactNode;
	title: string;
	description: string;
	actions?: ReactNode;
	showBackButton?: boolean;
}

export function ToolPageHeader({
	icon,
	title,
	description,
	actions,
	showBackButton = false,
}: ToolPageHeaderProps) {
	return (
		<div className="relative">
			{/* Background gradient effect */}
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />

			<div className="py-6 py-4">
				{/* Back navigation */}
				{showBackButton && (
					<div className="flex items-center gap-2 mb-4">
						<Link to="/">
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 text-muted-foreground hover:text-foreground rounded-lg"
							>
								<ArrowLeft className="h-4 w-4" />
								<span className="hidden sm:inline">返回首页</span>
							</Button>
						</Link>
					</div>
				)}

				{/* Main header content */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
					{/* Icon */}
					<div className="relative">
						<div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-2xl blur-xl opacity-30" />
						<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/10">
							{icon}
						</div>
					</div>

					{/* Title and description */}
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							{title}
						</h1>
						<p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
							{description}
						</p>
					</div>

					{/* Actions */}
					{actions && (
						<div className="flex items-center gap-2 mt-2 sm:mt-0">
							{actions}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
