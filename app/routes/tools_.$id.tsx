import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
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
		const { getAuthToken, getJwtSecret, verifyAccessToken } = await import(
			"../../workers/utils/auth"
		);

		const db = context.cloudflare.env.DB;

		const tool = await toolsDb.getToolById(db, params.id);
		if (!tool) {
			return { tool: null, error: null };
		}

		// Public tool — no permission check needed
		if (!tool.permissionId) {
			await toolsDb.recordToolUsage(db, tool.id);
			return { tool, error: null };
		}

		// Extract userId from JWT cookie for permission check
		let userId: string | null = null;
		try {
			const cookieHeader = request.headers.get("Cookie") || "";
			const match = cookieHeader.match(/access_token=([^;]+)/);
			if (match?.[1]) {
				const secret = getJwtSecret(context.cloudflare.env);
				const payload = await verifyAccessToken(match[1], secret);
				userId = payload?.sub ?? null;
			}
		} catch {
			// No valid token — proceed as anonymous
		}

		const accessCheck = await checkToolAccess(db, params.id, userId);
		if (!accessCheck.allowed) {
			return {
				tool: null,
				error: accessCheck.reason || "Insufficient permissions",
			};
		}

		await toolsDb.recordToolUsage(db, tool.id);
		return { tool, error: null };
	} catch (error) {
		console.error("Failed to load tool:", error);
		return { tool: null, error: "Failed to load tool" };
	}
}

export function meta({ data }: { data: Awaited<ReturnType<typeof loader>> }) {
	const tool = data?.tool;

	if (!tool) {
		return [
			{ title: "Tool Not Found | DevShelf" },
			{ name: "description", content: "抱歉，您访问的工具不存在或已被移除。" },
		];
	}

	return [
		{ title: `${tool.name} | DevShelf` },
		{ name: "description", content: tool.description },
	];
}

function NotFoundPage({ error }: { error?: string | null }) {
	const { t } = useTranslation();
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
							<CardTitle>
								{error ? t("toolDetail.noAccess") : t("toolDetail.notFound")}
							</CardTitle>
							<CardDescription>
								{error || t("toolDetail.notFound.description")}
							</CardDescription>
						</CardHeader>
						<CardContent className="text-center space-y-4">
							<Link to="/">
								<Button className="gap-2">
									<ArrowLeft className="h-4 w-4" />
									{t("toolDetail.backHome")}
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
