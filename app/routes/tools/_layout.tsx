"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Link, Outlet, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

import type { Route } from "./+types/_layout";

export async function loader({ request, context }: Route.LoaderArgs) {
	try {
		const toolsDb = await import("../../../lib/database/tools");
		const { checkToolAccess } = await import("../../../lib/database/tool-permissions");
		const { getCurrentUserId } = await import("../../../workers/utils/auth");

		const db = context.cloudflare.env.DB;

		// 从 URL 路径获取工具 slug（例如 /tools/json-formatter → json-formatter）
		const url = new URL(request.url);
		const toolSlug = url.pathname.replace(/^\/tools\//, "").split("/")[0];

		// 获取所有工具
		const allTools = await toolsDb.getTools(db);

		// 根据 URL 查找工具
		const tool = allTools.find((t) => {
			const prodEnv = t.environments.find((e) => e.name === "production");
			if (!prodEnv || prodEnv.isExternal) return false;

			// 提取内部路由的 slug
			const slug = prodEnv.url.startsWith("/tools/")
				? prodEnv.url.slice("/tools/".length)
				: prodEnv.url.replace(/^\/+/, "");

			return slug === toolSlug;
		});

		// 如果找不到工具，允许访问（可能是新工具还未在数据库中配置）
		if (!tool) {
			return { hasAccess: true, error: null };
		}

		// 如果工具没有配置权限要求，直接允许访问（性能优化）
		if (!tool.permissionId) {
			return { hasAccess: true, error: null };
		}

		// 只有配置了权限的工具才检查权限
		const userId = await getCurrentUserId({
			env: context.cloudflare.env,
			req: { headers: request.headers } as any,
		} as any);

		// 检查访问权限
		const accessCheck = await checkToolAccess(db, tool.id, userId);

		return {
			hasAccess: accessCheck.allowed,
			error: accessCheck.allowed ? null : accessCheck.reason || "无权限访问此工具",
		};
	} catch (error) {
		console.error("Failed to check tool access:", error);
		// 出错时允许访问，避免阻塞所有工具
		return { hasAccess: true, error: null };
	}
}

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
	const { hasAccess, error } = useLoaderData<typeof loader>();

	if (!hasAccess && error) {
		return <AccessDeniedPage error={error} />;
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

			<main className="container mx-auto px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}
