import { Info } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import type { PageInfoProps } from "./types";

export function PageInfoCard({
	result,
	formatBytes,
	formatTime,
	formatAppVersion,
}: PageInfoProps) {
	return (
		<div className="space-y-3 pt-3 border-t">
			<div className="text-sm font-semibold mb-2 flex items-center gap-2">
				<Info className="h-4 w-4" />
				页面信息/性能指标
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
				<MetricBox label="Status">
					<Badge
						variant={
							result.status >= 200 && result.status < 300
								? "default"
								: "destructive"
						}
						className="text-xs font-medium"
					>
						{result.status}
					</Badge>
				</MetricBox>

				<MetricBox label="Load Time">
					<span className="text-xs font-medium">
						{formatTime(result.loadTime)}
					</span>
				</MetricBox>

				<MetricBox label="Requests">
					<span className="text-xs font-medium">
						{result.totalRequests}
						{result.failedRequests > 0 && (
							<Badge variant="destructive" className="ml-1 text-xs">
								{result.failedRequests} failed
							</Badge>
						)}
					</span>
				</MetricBox>

				<MetricBox label="Total Size">
					<span className="text-xs font-medium">
						{formatBytes(result.totalSize)}
					</span>
				</MetricBox>

				{result.meta?.appVersion && (
					<MetricBox label="App Version">
						<span className="text-xs font-medium font-mono">
							{formatAppVersion(result.meta.appVersion)}
						</span>
					</MetricBox>
				)}

				{result.performance?.fcp !== undefined && (
					<MetricBox label="FCP">
						<span className="text-xs font-medium">
							{formatTime(result.performance.fcp)}
						</span>
					</MetricBox>
				)}

				{result.performance?.lcp !== undefined && (
					<MetricBox label="LCP">
						<span className="text-xs font-medium">
							{formatTime(result.performance.lcp)}
						</span>
					</MetricBox>
				)}

				{result.performance?.domContentLoaded !== undefined && (
					<MetricBox label="DCL">
						<span className="text-xs font-medium">
							{formatTime(result.performance.domContentLoaded)}
						</span>
					</MetricBox>
				)}

				{result.performance?.loadEvent !== undefined && (
					<MetricBox label="Load Event">
						<span className="text-xs font-medium">
							{formatTime(result.performance.loadEvent)}
						</span>
					</MetricBox>
				)}
			</div>
		</div>
	);
}

function MetricBox({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-lg border">
			<Badge variant="outline" className="text-xs">
				{label}
			</Badge>
			{children}
		</div>
	);
}
