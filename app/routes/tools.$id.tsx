import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { Header } from "~/components/layout/header";
import { ToolDetailView } from "~/components/tool-detail-view";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

import type { Route } from "./+types/tools.$id";

export async function loader({ params, context }: Route.LoaderArgs) {
	try {
		const toolsDb = await import("../../lib/database/tools");
		const db = context.cloudflare.env.DB;

		const tool = await toolsDb.getToolById(db, params.id);
		return { tool };
	} catch (error) {
		console.error("Failed to load tool:", error);
		return { tool: null };
	}
}

export function meta({ data }: { data: Awaited<ReturnType<typeof loader>> }) {
	const tool = data?.tool;

	if (!tool) {
		return [
			{ title: "工具未找到 | 研发平台工具站" },
			{ name: "description", content: "抱歉，您访问的工具不存在或已被移除。" },
		];
	}

	return [
		{ title: `${tool.name} | 研发平台工具站` },
		{ name: "description", content: tool.description },
	];
}

function NotFoundPage() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="container mx-auto px-4 py-16">
				<div className="max-w-md mx-auto">
					<Card>
						<CardHeader className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
								<AlertTriangle className="h-6 w-6 text-destructive" />
							</div>
							<CardTitle>工具未找到</CardTitle>
							<CardDescription>
								抱歉，您访问的工具不存在或已被移除。
							</CardDescription>
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

export default function ToolDetailPage() {
	const { tool } = useLoaderData<typeof loader>();

	if (!tool) {
		return <NotFoundPage />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<ToolDetailView tool={tool} />
		</div>
	);
}
