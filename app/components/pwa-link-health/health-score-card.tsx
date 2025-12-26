import { AlertTriangle, CheckCircle2, Heart, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { HealthScore } from "./types";

interface HealthScoreCardProps {
	healthScore: HealthScore;
	requiredApiEndpoints: string[];
}

export function HealthScoreCard({
	healthScore,
	requiredApiEndpoints,
}: HealthScoreCardProps) {
	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<Card
			className={`mb-4 ${
				healthScore.issues.length === 0
					? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
					: "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
			}`}
		>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					{healthScore.issues.length === 0 ? (
						<CheckCircle2 className="h-4 w-4 text-green-600" />
					) : (
						<AlertTriangle className="h-4 w-4 text-red-600" />
					)}
					健康检查与问题
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6">
				<div className="space-y-4">
					{/* 健康分 */}
					<div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
						<div className="flex items-center gap-2">
							<Heart className="h-4 w-4" />
							<span className="text-xs font-medium">健康分</span>
						</div>
						<div
							className={`text-sm font-bold ${getHealthScoreColor(healthScore.score)}`}
						>
							{healthScore.score}
						</div>
					</div>

					{/* Health Checks */}
					<div>
						<div className="text-xs text-muted-foreground mb-2">
							Health Checks
						</div>
						<div className="grid grid-cols-2 gap-2">
							<HealthCheckItem
								label="PWA"
								passed={healthScore.checks.isPwaInstallable}
							/>
							<HealthCheckItem
								label="Status"
								passed={healthScore.checks.isPageStatusOk}
							/>
							<HealthCheckItem
								label="Requests"
								passed={!healthScore.checks.hasFailedRequests}
							/>
							<HealthCheckItem
								label="Console"
								passed={!healthScore.checks.hasConsoleErrors}
							/>
						</div>

						{/* API Checks */}
						<div className="mt-2 pt-2 border-t">
							<div className="text-xs text-muted-foreground mb-2">
								API Checks
							</div>
							<div className="grid grid-cols-2 gap-1.5">
								{requiredApiEndpoints.map((endpoint) => (
									<div
										key={endpoint}
										className="flex items-center gap-1.5 text-xs"
									>
										{healthScore.checks.apiCheckResults?.[endpoint] ? (
											<CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
										) : (
											<XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
										)}
										<span className="truncate">{endpoint}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Issues */}
					<div className="pt-2 border-t">
						<div className="text-xs text-muted-foreground mb-1.5">
							Issues ({healthScore.issues.length})
						</div>
						{healthScore.issues.length > 0 ? (
							<ul className="space-y-1">
								{healthScore.issues.map((issue, index) => (
									<li key={index} className="text-sm text-muted-foreground">
										• {issue}
									</li>
								))}
							</ul>
						) : (
							<div className="text-sm text-green-600">No issues</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function HealthCheckItem({
	label,
	passed,
}: {
	label: string;
	passed: boolean;
}) {
	return (
		<div className="flex items-center gap-1.5 text-sm">
			{passed ? (
				<CheckCircle2 className="h-4 w-4 text-green-600" />
			) : (
				<XCircle className="h-4 w-4 text-red-600" />
			)}
			<span>{label}</span>
		</div>
	);
}
