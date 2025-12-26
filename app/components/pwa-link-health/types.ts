import type { WebsiteCheckResult } from "~/types/website-check";

export interface HealthScore {
	score: number;
	issues: string[];
	checks: {
		isPwaInstallable: boolean;
		isPageStatusOk: boolean;
		hasFailedRequests: boolean;
		hasConsoleErrors: boolean;
		isApiCallSuccess: boolean;
		isInstallPageAccessible: boolean;
		apiCheckResults: Record<string, boolean>;
	};
}

export interface MetricItem {
	label: string;
	value: string | number;
	variant?: "default" | "destructive" | "outline";
	badge?: boolean;
}

export interface PageInfoProps {
	result: WebsiteCheckResult;
	formatBytes: (bytes: number | null) => string;
	formatTime: (ms: number | null) => string;
	formatAppVersion: (timestamp: string) => string;
}
