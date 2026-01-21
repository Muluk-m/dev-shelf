import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { useToolAccess } from "~/hooks/use-tools-query";

function AccessDeniedPage({ error }: { error: string }) {
	return (
		<div className="min-h-screen bg-background">
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							返回首页
						</Button>
					</Link>
				</div>
			</div>

			<main className="container mx-auto px-4 py-16">
				<div className="max-w-md mx-auto">
					<Card>
						<CardHeader className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
								<AlertTriangle className="h-6 w-6 text-destructive" />
							</div>
							<CardTitle>无权限访问</CardTitle>
							<CardDescription>{error}</CardDescription>
						</CardHeader>
						<CardContent className="text-center space-y-4">
							<Link to="/">
								<Button className="gap-2">
									<ArrowLeft className="h-4 w-4" />
									返回首页
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

export default function ToolsLayout() {
	const location = useLocation();

	// Extract tool slug from URL (e.g., /tools/json-formatter → json-formatter)
	const toolSlug = location.pathname.replace(/^\/tools\//, "").split("/")[0];

	// Check tool access permission using React Query
	const { data, isLoading } = useToolAccess(toolSlug);

	// Show access denied page if no access
	if (!isLoading && data && !data.hasAccess && data.error) {
		return <AccessDeniedPage error={data.error} />;
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="border-b">
				<div className="container mx-auto px-4 py-4">
					<Link to="/">
						<Button variant="ghost" className="gap-2">
							<ArrowLeft className="h-4 w-4" />
							返回首页
						</Button>
					</Link>
				</div>
			</div>

			<main className="container mx-auto px-4 py-2">
				<Outlet />
			</main>
		</div>
	);
}
