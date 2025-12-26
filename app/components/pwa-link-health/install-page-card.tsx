import { FileText, Info, Loader2, Smartphone } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RESOURCE_TYPE_COLORS } from "~/lib/pwa-link-health";
import type { WebsiteCheckResult } from "~/types/website-check";

interface InstallPageCardProps {
	installPageResult: WebsiteCheckResult | null;
	loading: boolean;
	formatTime: (ms: number | null) => string;
	formatBytes: (bytes: number | null) => string;
}

export function InstallPageCard({
	installPageResult,
	loading,
	formatTime,
	formatBytes,
}: InstallPageCardProps) {
	if (!loading && !installPageResult) {
		return null;
	}

	return (
		<Card className="mb-4 border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20">
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Smartphone className="h-4 w-4 text-purple-600" />
					安装页检查
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6 py-4">
				{installPageResult ? (
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
						{installPageResult.screenshot && (
							<div className="lg:col-span-1">
								<div className="rounded border overflow-hidden bg-white">
									<img
										src={`data:image/png;base64,${installPageResult.screenshot}`}
										alt="安装页截图"
										className="w-full h-auto"
									/>
								</div>
							</div>
						)}

						<div
							className={`${
								installPageResult.screenshot ? "lg:col-span-4" : "lg:col-span-5"
							} space-y-4`}
						>
							{/* 页面信息 */}
							<div className="space-y-2">
								<div className="text-sm font-semibold mb-2 flex items-center gap-2">
									<Info className="h-4 w-4" />
									页面信息
								</div>
								<InstallPageInfo
									result={installPageResult}
									formatTime={formatTime}
									formatBytes={formatBytes}
								/>
							</div>

							{/* 请求统计 */}
							<div className="space-y-2">
								<div className="text-sm font-semibold mb-2 flex items-center gap-2">
									<FileText className="h-4 w-4" />
									请求统计
								</div>
								{installPageResult.resourceStats && (
									<ResourceStats stats={installPageResult.resourceStats} />
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						正在检查安装页...
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function InstallPageInfo({
	result,
	formatTime,
	formatBytes,
}: {
	result: WebsiteCheckResult;
	formatTime: (ms: number | null) => string;
	formatBytes: (bytes: number | null) => string;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
			<InfoField label="URL" value={result.url} fullWidth />
			<InfoField
				label="Status"
				value={
					<Badge
						variant={
							result.status >= 200 && result.status < 300
								? "default"
								: "destructive"
						}
						className="text-xs"
					>
						{result.status}
					</Badge>
				}
			/>
			<InfoField label="Load" value={formatTime(result.loadTime)} />
			<InfoField
				label="Requests"
				value={
					<>
						{result.totalRequests}
						{result.failedRequests > 0 && (
							<span className="text-destructive ml-1">
								({result.failedRequests})
							</span>
						)}
					</>
				}
			/>
			<InfoField label="Size" value={formatBytes(result.totalSize)} />
			{result.performance?.fcp !== undefined && (
				<InfoField label="FCP" value={formatTime(result.performance.fcp)} />
			)}
			{result.performance?.lcp !== undefined && (
				<InfoField label="LCP" value={formatTime(result.performance.lcp)} />
			)}
			{result.performance?.domContentLoaded !== undefined && (
				<InfoField
					label="DCL"
					value={formatTime(result.performance.domContentLoaded)}
				/>
			)}
			{result.performance?.loadEvent !== undefined && (
				<InfoField
					label="Load"
					value={formatTime(result.performance.loadEvent)}
				/>
			)}
		</div>
	);
}

function InfoField({
	label,
	value,
	fullWidth = false,
}: {
	label: string;
	value: React.ReactNode;
	fullWidth?: boolean;
}) {
	return (
		<div
			className={`flex items-start gap-1.5 py-0.5 min-w-0 w-full ${fullWidth ? "md:col-span-2 lg:col-span-3" : ""}`}
		>
			<span className="text-muted-foreground text-xs flex-shrink-0">
				{label}:
			</span>
			<span className="font-medium text-xs flex-1 break-words min-w-0 break-all">
				{value}
			</span>
		</div>
	);
}

function ResourceStats({
	stats,
}: {
	stats: Array<{
		type: string;
		count: number;
		totalSize: number;
		failedCount: number;
	}>;
}) {
	return (
		<div className="space-y-3">
			{stats.map((stat) => {
				const successCount = stat.count - stat.failedCount;
				return (
					<div
						key={stat.type}
						className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
					>
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded"
								style={{
									backgroundColor:
										RESOURCE_TYPE_COLORS[
											stat.type as keyof typeof RESOURCE_TYPE_COLORS
										],
								}}
							/>
							<span className="text-xs font-medium capitalize">
								{stat.type}
							</span>
						</div>
						<div className="flex items-center gap-3 text-xs">
							<span className="text-muted-foreground">总计: {stat.count}</span>
							<span className="text-green-600">成功: {successCount}</span>
							{stat.failedCount > 0 && (
								<span className="text-destructive">
									失败: {stat.failedCount}
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
