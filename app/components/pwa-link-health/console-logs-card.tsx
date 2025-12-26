import { AlertTriangle, Code, XCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { filterBusinessImpactErrors } from "~/lib/pwa-link-health";
import type { ConsoleInfo } from "~/types/website-check";

interface ConsoleLogsCardProps {
	console: ConsoleInfo;
}

export function ConsoleLogsCard({ console }: ConsoleLogsCardProps) {
	const filteredErrors = filterBusinessImpactErrors(console.errors);

	if (filteredErrors.length === 0 && console.warningCount === 0) {
		return null;
	}

	return (
		<Card className="mb-4 border-red-500/100 bg-red-50/20 dark:bg-red-950/20">
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Code className="h-4 w-4" />
					Console
					{filteredErrors.length > 0 && (
						<Badge variant="destructive" className="ml-2 text-xs">
							{filteredErrors.length} Errors
						</Badge>
					)}
					{console.warningCount > 0 && (
						<Badge variant="outline" className="ml-2 text-xs">
							{console.warningCount} Warnings
						</Badge>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6 space-y-2">
				{/* Errors */}
				{filteredErrors.length > 0 && (
					<div className="space-y-1">
						<div className="font-semibold text-xs flex items-center gap-1 text-destructive">
							<XCircle className="h-3 w-3" />
							Errors ({filteredErrors.length})
						</div>
						<div className="space-y-1 max-h-48 overflow-y-auto">
							{filteredErrors.map((error, index) => (
								<ConsoleError key={index} error={error} />
							))}
						</div>
					</div>
				)}

				{/* Warnings */}
				{console.warnings.length > 0 && (
					<div className="space-y-1">
						<div className="font-semibold text-xs flex items-center gap-1 text-yellow-600">
							<AlertTriangle className="h-3 w-3" />
							Warnings ({console.warnings.length})
						</div>
						<div className="space-y-1 max-h-48 overflow-y-auto">
							{console.warnings.map((warning, index) => (
								<ConsoleWarning key={index} warning={warning} />
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function ConsoleError({ error }: { error: ConsoleInfo["errors"][0] }) {
	return (
		<div className="p-2 bg-destructive/10 rounded text-xs border border-destructive/20">
			<div className="font-mono text-xs break-all">{error.message}</div>
			{error.source && (
				<div className="text-xs text-muted-foreground mt-0.5">
					{error.source}
					{error.lineNumber && `:${error.lineNumber}`}
				</div>
			)}
		</div>
	);
}

function ConsoleWarning({ warning }: { warning: ConsoleInfo["warnings"][0] }) {
	return (
		<div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-xs border border-yellow-200 dark:border-yellow-900">
			<div className="font-mono text-xs break-all">{warning.message}</div>
			{warning.source && (
				<div className="text-xs text-muted-foreground mt-0.5">
					{warning.source}
					{warning.lineNumber && `:${warning.lineNumber}`}
				</div>
			)}
		</div>
	);
}
