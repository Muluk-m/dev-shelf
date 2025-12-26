import { useMemo } from "react";
import type { HealthScore } from "~/components/pwa-link-health/types";
import { filterBusinessImpactErrors } from "~/lib/pwa-link-health";
import type { WebsiteCheckResult } from "~/types/website-check";

const REQUIRED_API_ENDPOINTS = [
	"/app.webmanifest",
	"/app/setV2",
	"/init/configV3",
	"/dns.json",
	"/prefetch.json",
	"/create/uuid",
	"/create/link",
	"/event/isInstall",
];

export function useHealthScore(
	result: WebsiteCheckResult | null,
	installPageResult: WebsiteCheckResult | null,
): HealthScore | null {
	return useMemo(() => {
		if (!result) return null;

		let score = 100;
		const issues: string[] = [];

		// 1. PWA 可安装性检查（-30 分）
		if (!result.pwa?.isInstallable) {
			score -= 30;
			issues.push("PWA 不可安装");
		}

		// 2. 页面加载状态检查（-40 分）
		if (result.status < 200 || result.status >= 300) {
			score -= 40;
			issues.push(`页面状态码异常: ${result.status}`);
		}

		// 3. 失败请求数检查（-10 分）
		if (result.failedRequests > 0) {
			score -= 10;
			issues.push(`存在 ${result.failedRequests} 个失败请求`);
		}

		// 4. 控制台错误检查（-10 分）
		const allConsoleErrors = result.console?.errors ?? [];
		const filteredConsoleErrors = filterBusinessImpactErrors(allConsoleErrors);
		const consoleErrorCount = filteredConsoleErrors.length;
		if (consoleErrorCount > 0) {
			score -= 10;
			issues.push(`存在 ${consoleErrorCount} 个控制台错误`);
		}

		// 5. 业务接口调用检查（-10 分）
		const apiCheckResults: Record<string, boolean> = {};
		const failedApis: string[] = [];
		const missingApis: string[] = [];

		REQUIRED_API_ENDPOINTS.forEach((endpoint) => {
			const request = result.resources?.find((r) => r.url.includes(endpoint));
			if (!request) {
				apiCheckResults[endpoint] = false;
				missingApis.push(endpoint);
			} else if (
				!request.status ||
				request.status < 200 ||
				request.status >= 300
			) {
				apiCheckResults[endpoint] = false;
				failedApis.push(`${endpoint} (${request.status || "N/A"})`);
			} else {
				apiCheckResults[endpoint] = true;
			}
		});

		if (missingApis.length > 0 || failedApis.length > 0) {
			score -= 10;
			if (missingApis.length > 0) {
				issues.push(
					`业务接口未调用: ${missingApis.slice(0, 3).join(", ")}${missingApis.length > 3 ? ` 等 ${missingApis.length} 个` : ""}`,
				);
			}
			if (failedApis.length > 0) {
				issues.push(
					`业务接口调用失败: ${failedApis.slice(0, 3).join(", ")}${failedApis.length > 3 ? ` 等 ${failedApis.length} 个` : ""}`,
				);
			}
		}

		// 6. 安装页可访问性检查（-10 分）
		const installPageStatus = installPageResult?.status;
		const isInstallPageAccessible =
			installPageStatus !== undefined &&
			installPageStatus >= 200 &&
			installPageStatus < 300;
		if (installPageResult && !isInstallPageAccessible) {
			score -= 10;
			issues.push(`安装页不可访问: 状态码 ${installPageStatus ?? "N/A"}`);
		}

		const allApisSuccess = Object.values(apiCheckResults).every(
			(v) => v === true,
		);

		return {
			score: Math.max(0, score),
			issues,
			checks: {
				isPwaInstallable: result.pwa?.isInstallable ?? false,
				isPageStatusOk: result.status >= 200 && result.status < 300,
				hasFailedRequests: (result.failedRequests ?? 0) > 0,
				hasConsoleErrors: consoleErrorCount > 0,
				isApiCallSuccess: allApisSuccess,
				isInstallPageAccessible: installPageResult
					? isInstallPageAccessible
					: true,
				apiCheckResults,
			},
		};
	}, [result, installPageResult]);
}

export { REQUIRED_API_ENDPOINTS };
