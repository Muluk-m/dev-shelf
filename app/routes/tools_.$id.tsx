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

import type { Route } from "./+types/tools_.$id";

export async function loader({ params, context, request }: Route.LoaderArgs) {
	try {
		const toolsDb = await import("../../lib/database/tools");
		const { checkToolAccess } = await import(
			"../../lib/database/tool-permissions"
		);
		const { getCurrentUserId } = await import("../../workers/utils/auth");

		const db = context.cloudflare.env.DB;

		// 先获取工具信息
		const tool = await toolsDb.getToolById(db, params.id);

		if (!tool) {
			return { tool: null, error: null };
		}

		// 如果工具没有配置权限要求，直接允许访问（性能优化）
		if (!tool.permissionId) {
			await toolsDb.recordToolUsage(db, tool.id);
			return { tool, error: null };
		}

		// 只有配置了权限的工具才检查权限
		const userId = await getCurrentUserId({
			env: context.cloudflare.env,
			req: { headers: request.headers } as any,
		} as any);

		// 检查访问权限
		const accessCheck = await checkToolAccess(db, params.id, userId);
		if (!accessCheck.allowed) {
			return {
				tool: null,
				error: accessCheck.reason || "无权限访问此工具",
			};
		}

		await toolsDb.recordToolUsage(db, tool.id);
		return { tool, error: null };
	} catch (error) {
		console.error("Failed to load tool:", error);
		return { tool: null, error: "加载工具失败" };
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

function NotFoundPage({ error }: { error?: string | null }) {
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
							<CardTitle>{error ? "无权限访问" : "工具未找到"}</CardTitle>
							<CardDescription>
								{error || "抱歉，您访问的工具不存在或已被移除。"}
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
	const { tool, error } = useLoaderData<typeof loader>();

	if (!tool) {
		return <NotFoundPage error={error} />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<ToolDetailView tool={tool} />
		</div>
	);
}
