import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Code,
	Eye,
	FileText,
	Globe,
	Smartphone,
	Tag,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type {
	ResourceInfo,
	ResourceType,
	WebsiteCheckResult,
} from "~/types/website-check";

const API_ENDPOINT = "https://fe-toolkit.qiliangjia.org/website-check/analyze";

const RESOURCE_TYPE_COLORS: Record<ResourceType, string> = {
	document: "#3b82f6",
	stylesheet: "#8b5cf6",
	image: "#10b981",
	media: "#f59e0b",
	font: "#ef4444",
	script: "#ec4899",
	texttrack: "#14b8a6",
	xhr: "#06b6d4",
	fetch: "#0ea5e9",
	eventsource: "#6366f1",
	websocket: "#a855f7",
	manifest: "#f97316",
	other: "#6b7280",
};

export function meta() {
	return [
		{ title: "Website Check | DevTools Platform" },
		{
			name: "description",
			content: "Check website performance and resource loading",
		},
	];
}

export default function WebsiteCheck() {
	const [url, setUrl] = useState("");
	const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<WebsiteCheckResult | null>(null);
	const [sortBy, setSortBy] = useState<keyof ResourceInfo>("startTime");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const [filterType, setFilterType] = useState<ResourceType | "all">("all");
	const [expandedRow, setExpandedRow] = useState<number | null>(null);

	const handleAnalyze = async () => {
		if (!url.trim()) {
			setError("Please enter a valid URL");
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const response = await fetch(API_ENDPOINT, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ url, timeout: 30000, device }),
			});

			if (!response.ok) {
				const errorData: any = await response.json().catch(() => null);
				const errorMessage =
					errorData?.message ||
					errorData?.error ||
					`Failed to analyze website: ${response.statusText}`;
				throw new Error(errorMessage);
			}

			const data: WebsiteCheckResult = await response.json();
			setResult(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleSort = (field: keyof ResourceInfo) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	const getSortedAndFilteredResources = () => {
		if (!result) return [];

		let filtered = result.resources;
		if (filterType !== "all") {
			filtered = filtered.filter((r) => r.type === filterType);
		}

		return [...filtered].sort((a, b) => {
			const aVal = a[sortBy];
			const bVal = b[sortBy];

			if (aVal === null || aVal === undefined) return 1;
			if (bVal === null || bVal === undefined) return -1;

			if (typeof aVal === "string" && typeof bVal === "string") {
				return sortOrder === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}

			return sortOrder === "asc"
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
	};

	const formatBytes = (bytes: number | null) => {
		if (bytes === null || bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatTime = (ms: number | null) => {
		if (ms === null) return "N/A";
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const resolveIconUrl = (iconSrc: string, baseUrl: string) => {
		try {
			// Try to create absolute URL, if iconSrc is already absolute, it will use it
			// If iconSrc is relative, it will resolve against baseUrl
			return new URL(iconSrc, baseUrl).href;
		} catch {
			// If URL construction fails, return original src
			return iconSrc;
		}
	};

	const formatAppVersion = (timestamp: string) => {
		try {
			const date = new Date(Number(timestamp));
			if (Number.isNaN(date.getTime())) {
				return timestamp; // Return original if not a valid timestamp
			}
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			const seconds = String(date.getSeconds()).padStart(2, "0");
			return `${year}-${month}-${day}/${hours}:${minutes}:${seconds}`;
		} catch {
			return timestamp; // Return original if formatting fails
		}
	};

	const resourceTypeStats =
		result?.resourceStats.map((stat) => ({
			name: stat.type,
			count: stat.count,
			size: stat.totalSize,
			failedCount: stat.failedCount,
			color: RESOURCE_TYPE_COLORS[stat.type],
		})) || [];

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<ToolPageHeader
					icon={<Globe className="h-5 w-5" />}
					title="Website Performance Analyzer"
					description="Analyze website performance and resource loading"
				/>
			</div>

			{/* Search Form */}
			<Card className="mb-8">
				<CardContent className="pt-6">
					<div className="space-y-4">
						<div className="flex gap-4">
							<Input
								type="url"
								placeholder="Enter website URL (e.g., https://example.com)"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
								className="flex-1"
							/>
							<Button onClick={handleAnalyze} disabled={loading}>
								{loading ? "Analyzing..." : "Analyze"}
							</Button>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-sm font-medium">Device:</span>
							<div className="flex gap-2">
								<Button
									type="button"
									variant={device === "desktop" ? "default" : "outline"}
									size="sm"
									onClick={() => setDevice("desktop")}
									disabled={loading}
									className="gap-2"
								>
									<Globe className="w-4 h-4" />
									Desktop
								</Button>
								<Button
									type="button"
									variant={device === "mobile" ? "default" : "outline"}
									size="sm"
									onClick={() => setDevice("mobile")}
									disabled={loading}
									className="gap-2"
								>
									<Smartphone className="w-4 h-4" />
									Mobile
								</Button>
							</div>
						</div>
					</div>
					{error && (
						<div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
							<AlertCircle className="w-4 h-4" />
							{error}
						</div>
					)}
				</CardContent>
			</Card>

			{result && (
				<>
					{/* Page Info & Screenshot Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
						{/* Left Column - Screenshot */}
						{result.screenshot && (
							<div className="lg:col-span-1">
								<Card className="h-full">
									<CardHeader className="pb-3">
										<CardTitle className="text-base">Page Screenshot</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="rounded-md border overflow-hidden">
											<img
												src={`data:image/png;base64,${result.screenshot}`}
												alt="Website Screenshot"
												className="w-full h-auto"
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Right Column - Page Summary */}
						<div
							className={`${result.screenshot ? "lg:col-span-2" : "lg:col-span-3"}`}
						>
							<Card className="h-full">
								<CardHeader className="pb-3">
									<CardTitle className="text-base flex items-center gap-2">
										<FileText className="h-4 w-4" />
										Page Summary
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Page Title */}
									{result.pageTitle && (
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Title
											</div>
											<div className="text-sm font-medium">
												{result.pageTitle}
											</div>
										</div>
									)}

									{/* App Version */}
									{result.meta?.appVersion && (
										<div className="pt-2">
											<div className="text-xs text-muted-foreground mb-1">
												App Version
											</div>
											<div className="text-sm font-mono">
												{formatAppVersion(result.meta.appVersion)}
											</div>
											<div className="text-xs text-muted-foreground mt-0.5">
												{result.meta.appVersion}
											</div>
										</div>
									)}

									{/* Key Metrics Grid */}
									<div className="grid grid-cols-2 gap-4 pt-3 border-t">
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Status
											</div>
											<Badge
												variant={
													result.status >= 200 && result.status < 300
														? "default"
														: "destructive"
												}
											>
												{result.status}
											</Badge>
										</div>
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Load Time
											</div>
											<div className="text-sm font-medium">
												{formatTime(result.loadTime)}
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Requests
											</div>
											<div className="text-sm font-medium">
												{result.totalRequests}
												{result.failedRequests > 0 && (
													<span className="text-destructive ml-1">
														({result.failedRequests} failed)
													</span>
												)}
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Total Size
											</div>
											<div className="text-sm font-medium">
												{formatBytes(result.totalSize)}
											</div>
										</div>
									</div>

									{/* Performance Highlights */}
									{result.performance && (
										<div className="pt-3 border-t">
											<div className="text-xs text-muted-foreground mb-2">
												Performance Metrics
											</div>
											<div className="grid grid-cols-2 gap-2 text-xs">
												{result.performance.fcp !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">FCP:</span>
														<span className="font-medium">
															{formatTime(result.performance.fcp)}
														</span>
													</div>
												)}
												{result.performance.lcp !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">LCP:</span>
														<span className="font-medium">
															{formatTime(result.performance.lcp)}
														</span>
													</div>
												)}
												{result.performance.domContentLoaded !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">DCL:</span>
														<span className="font-medium">
															{formatTime(result.performance.domContentLoaded)}
														</span>
													</div>
												)}
												{result.performance.loadEvent !== undefined && (
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Load Event:
														</span>
														<span className="font-medium">
															{formatTime(result.performance.loadEvent)}
														</span>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Quick Status Indicators */}
									<div className="pt-3 border-t space-y-2">
										<div className="text-xs text-muted-foreground mb-2">
											Quick Status
										</div>
										<div className="flex flex-wrap gap-2">
											{result.pwa?.isInstallable && (
												<Badge className="bg-green-600 gap-1">
													<Smartphone className="h-3 w-3" />
													PWA Ready
												</Badge>
											)}
											{result.console && result.console.errorCount > 0 && (
												<Badge variant="destructive" className="gap-1">
													<XCircle className="h-3 w-3" />
													{result.console.errorCount} Errors
												</Badge>
											)}
											{result.console && result.console.warningCount > 0 && (
												<Badge variant="outline" className="gap-1">
													<AlertTriangle className="h-3 w-3" />
													{result.console.warningCount} Warnings
												</Badge>
											)}
											{result.failedRequests > 0 && (
												<Badge variant="destructive" className="gap-1">
													<AlertTriangle className="h-3 w-3" />
													{result.failedRequests} Failed Requests
												</Badge>
											)}
											{result.meta?.og && (
												<Badge variant="outline" className="gap-1">
													<CheckCircle2 className="h-3 w-3" />
													Open Graph
												</Badge>
											)}
											{result.meta?.robots && (
												<Badge variant="outline" className="gap-1">
													<CheckCircle2 className="h-3 w-3" />
													Robots Meta
												</Badge>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* PWA & Meta Information Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
						{/* PWA Information */}
						{result.pwa?.isInstallable && (
							<Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<Smartphone className="h-5 w-5 text-green-600" />
										PWA - Progressive Web App
										<Badge className="ml-2 bg-green-600">Installable</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{result.pwa.manifest && (
										<div className="space-y-3">
											<div className="font-semibold flex items-center gap-2">
												<FileText className="h-4 w-4" />
												Manifest Information
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
												{result.pwa.manifest.name && (
													<div>
														<span className="text-muted-foreground">Name:</span>{" "}
														<span className="font-medium">
															{result.pwa.manifest.name}
														</span>
													</div>
												)}
												{result.pwa.manifest.short_name && (
													<div>
														<span className="text-muted-foreground">
															Short Name:
														</span>{" "}
														<span className="font-medium">
															{result.pwa.manifest.short_name}
														</span>
													</div>
												)}
												{result.pwa.manifest.description && (
													<div className="md:col-span-2">
														<span className="text-muted-foreground">
															Description:
														</span>{" "}
														<span className="font-medium">
															{result.pwa.manifest.description}
														</span>
													</div>
												)}
												{result.pwa.manifest.start_url && (
													<div>
														<span className="text-muted-foreground">
															Start URL:
														</span>{" "}
														<span className="font-medium">
															{result.pwa.manifest.start_url}
														</span>
													</div>
												)}
												{result.pwa.manifest.display && (
													<div>
														<span className="text-muted-foreground">
															Display:
														</span>{" "}
														<span className="font-medium">
															{result.pwa.manifest.display}
														</span>
													</div>
												)}
												{result.pwa.manifest.theme_color && (
													<div className="flex items-center gap-2">
														<span className="text-muted-foreground">
															Theme Color:
														</span>
														<div className="flex items-center gap-2">
															<div
																className="w-6 h-6 rounded border"
																style={{
																	backgroundColor:
																		result.pwa.manifest.theme_color,
																}}
															/>
															<span className="font-mono text-xs">
																{result.pwa.manifest.theme_color}
															</span>
														</div>
													</div>
												)}
												{result.pwa.manifest.background_color && (
													<div className="flex items-center gap-2">
														<span className="text-muted-foreground">
															Background Color:
														</span>
														<div className="flex items-center gap-2">
															<div
																className="w-6 h-6 rounded border"
																style={{
																	backgroundColor:
																		result.pwa.manifest.background_color,
																}}
															/>
															<span className="font-mono text-xs">
																{result.pwa.manifest.background_color}
															</span>
														</div>
													</div>
												)}
											</div>
											{result.pwa.manifest.icons &&
												result.pwa.manifest.icons.length > 0 && (
													<div className="mt-3">
														<div className="text-sm text-muted-foreground mb-2">
															App Icons ({result.pwa.manifest.icons.length}):
														</div>
														<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
															{result.pwa.manifest.icons.map((icon, i) => {
																const iconUrl = resolveIconUrl(
																	icon.src,
																	result.url,
																);
																return (
																	<div
																		key={i}
																		className="flex flex-col items-center gap-2 p-3 border rounded-lg bg-background"
																	>
																		<div className="relative w-16 h-16 flex items-center justify-center">
																			<img
																				src={iconUrl}
																				alt={`App icon ${icon.sizes}`}
																				className="max-w-full max-h-full object-contain rounded"
																				onError={(e) => {
																					// Handle image load error
																					const target =
																						e.target as HTMLImageElement;
																					target.style.display = "none";
																					const parent = target.parentElement;
																					if (parent) {
																						const fallback =
																							document.createElement("div");
																						fallback.className =
																							"w-16 h-16 flex items-center justify-center bg-muted rounded text-muted-foreground text-xs";
																						fallback.textContent = "No Preview";
																						parent.appendChild(fallback);
																					}
																				}}
																			/>
																		</div>
																		<div className="text-center">
																			<div className="text-xs font-medium">
																				{icon.sizes}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				{icon.type}
																			</div>
																			{icon.purpose && (
																				<Badge
																					variant="outline"
																					className="text-xs mt-1"
																				>
																					{icon.purpose}
																				</Badge>
																			)}
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}
										</div>
									)}
									{result.pwa.serviceWorker && (
										<div className="space-y-2 pt-3 border-t">
											<div className="font-semibold flex items-center gap-2">
												<Code className="h-4 w-4" />
												Service Worker
											</div>
											<div className="text-sm space-y-1">
												<div className="flex items-center gap-2">
													<span className="text-muted-foreground">Status:</span>
													{result.pwa.serviceWorker.registered ? (
														<Badge className="bg-green-600">
															<CheckCircle2 className="h-3 w-3 mr-1" />
															Registered
														</Badge>
													) : (
														<Badge variant="destructive">
															<XCircle className="h-3 w-3 mr-1" />
															Not Registered
														</Badge>
													)}
												</div>
												{result.pwa.serviceWorker.scope && (
													<div>
														<span className="text-muted-foreground">
															Scope:
														</span>{" "}
														<span className="font-mono text-xs">
															{result.pwa.serviceWorker.scope}
														</span>
													</div>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Meta Tags Information */}
						{result.meta && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<Tag className="h-5 w-5" />
										SEO & Meta Tags
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										{result.meta.title && (
											<div className="md:col-span-2">
												<span className="text-muted-foreground">Title:</span>{" "}
												<span className="font-medium">{result.meta.title}</span>
											</div>
										)}
										{result.meta.description && (
											<div className="md:col-span-2">
												<span className="text-muted-foreground">
													Description:
												</span>{" "}
												<span className="font-medium">
													{result.meta.description}
												</span>
											</div>
										)}
										{result.meta.keywords && (
											<div className="md:col-span-2">
												<span className="text-muted-foreground">Keywords:</span>{" "}
												<span className="font-medium">
													{result.meta.keywords}
												</span>
											</div>
										)}
										{result.meta.author && (
											<div>
												<span className="text-muted-foreground">Author:</span>{" "}
												<span className="font-medium">
													{result.meta.author}
												</span>
											</div>
										)}
										{result.meta.robots && (
											<div>
												<span className="text-muted-foreground">Robots:</span>{" "}
												<span className="font-medium">
													{result.meta.robots}
												</span>
											</div>
										)}
										{result.meta.canonical && (
											<div className="md:col-span-2">
												<span className="text-muted-foreground">
													Canonical URL:
												</span>{" "}
												<span className="font-mono text-xs break-all">
													{result.meta.canonical}
												</span>
											</div>
										)}
										{result.meta.language && (
											<div>
												<span className="text-muted-foreground">Language:</span>{" "}
												<span className="font-medium">
													{result.meta.language}
												</span>
											</div>
										)}
										{result.meta.viewport && (
											<div>
												<span className="text-muted-foreground">Viewport:</span>{" "}
												<span className="font-mono text-xs">
													{result.meta.viewport}
												</span>
											</div>
										)}
										{result.meta.appVersion && (
											<div className="md:col-span-2">
												<span className="text-muted-foreground">
													App Version:
												</span>{" "}
												<span className="font-mono text-xs">
													{formatAppVersion(result.meta.appVersion)}
												</span>
												<span className="text-xs text-muted-foreground ml-2">
													({result.meta.appVersion})
												</span>
											</div>
										)}
									</div>

									{/* Open Graph Tags */}
									{result.meta.og && Object.keys(result.meta.og).length > 0 && (
										<div className="pt-3 border-t space-y-2">
											<div className="font-semibold text-sm">Open Graph</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
												{result.meta.og.title && (
													<div>
														<span className="text-muted-foreground">
															OG Title:
														</span>{" "}
														<span className="font-medium">
															{result.meta.og.title}
														</span>
													</div>
												)}
												{result.meta.og.description && (
													<div className="md:col-span-2">
														<span className="text-muted-foreground">
															OG Description:
														</span>{" "}
														<span className="font-medium">
															{result.meta.og.description}
														</span>
													</div>
												)}
												{result.meta.og.image && (
													<div className="md:col-span-2">
														<span className="text-muted-foreground">
															OG Image:
														</span>{" "}
														<span className="font-mono text-xs break-all">
															{result.meta.og.image}
														</span>
													</div>
												)}
												{result.meta.og.type && (
													<div>
														<span className="text-muted-foreground">Type:</span>{" "}
														<span className="font-medium">
															{result.meta.og.type}
														</span>
													</div>
												)}
												{result.meta.og.site_name && (
													<div>
														<span className="text-muted-foreground">
															Site Name:
														</span>{" "}
														<span className="font-medium">
															{result.meta.og.site_name}
														</span>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Twitter Card Tags */}
									{result.meta.twitter &&
										Object.keys(result.meta.twitter).length > 0 && (
											<div className="pt-3 border-t space-y-2">
												<div className="font-semibold text-sm">
													Twitter Card
												</div>
												<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
													{result.meta.twitter.card && (
														<div>
															<span className="text-muted-foreground">
																Card:
															</span>{" "}
															<span className="font-medium">
																{result.meta.twitter.card}
															</span>
														</div>
													)}
													{result.meta.twitter.site && (
														<div>
															<span className="text-muted-foreground">
																Site:
															</span>{" "}
															<span className="font-medium">
																{result.meta.twitter.site}
															</span>
														</div>
													)}
													{result.meta.twitter.creator && (
														<div>
															<span className="text-muted-foreground">
																Creator:
															</span>{" "}
															<span className="font-medium">
																{result.meta.twitter.creator}
															</span>
														</div>
													)}
													{result.meta.twitter.title && (
														<div className="md:col-span-2">
															<span className="text-muted-foreground">
																Title:
															</span>{" "}
															<span className="font-medium">
																{result.meta.twitter.title}
															</span>
														</div>
													)}
													{result.meta.twitter.description && (
														<div className="md:col-span-2">
															<span className="text-muted-foreground">
																Description:
															</span>{" "}
															<span className="font-medium">
																{result.meta.twitter.description}
															</span>
														</div>
													)}
													{result.meta.twitter.image && (
														<div className="md:col-span-2">
															<span className="text-muted-foreground">
																Image:
															</span>{" "}
															<span className="font-mono text-xs break-all">
																{result.meta.twitter.image}
															</span>
														</div>
													)}
												</div>
											</div>
										)}
								</CardContent>
							</Card>
						)}
					</div>

					{/* Console Logs */}
					{result.console &&
						(result.console.errorCount > 0 ||
							result.console.warningCount > 0) && (
							<Card className="mb-8">
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<Code className="h-5 w-5" />
										Console Logs
										{result.console.errorCount > 0 && (
											<Badge variant="destructive" className="ml-2">
												{result.console.errorCount} Errors
											</Badge>
										)}
										{result.console.warningCount > 0 && (
											<Badge variant="outline" className="ml-2">
												{result.console.warningCount} Warnings
											</Badge>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Errors */}
									{result.console.errors.length > 0 && (
										<div className="space-y-2">
											<div className="font-semibold text-sm flex items-center gap-2 text-destructive">
												<XCircle className="h-4 w-4" />
												Errors ({result.console.errors.length})
											</div>
											<div className="space-y-2 max-h-64 overflow-y-auto">
												{result.console.errors.map((error, index) => (
													<div
														key={index}
														className="p-3 bg-destructive/10 rounded-md text-sm border border-destructive/20"
													>
														<div className="font-mono text-xs break-all">
															{error.message}
														</div>
														{error.source && (
															<div className="text-xs text-muted-foreground mt-1">
																Source: {error.source}
																{error.lineNumber && `:${error.lineNumber}`}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Warnings */}
									{result.console.warnings.length > 0 && (
										<div className="space-y-2">
											<div className="font-semibold text-sm flex items-center gap-2 text-yellow-600">
												<AlertTriangle className="h-4 w-4" />
												Warnings ({result.console.warnings.length})
											</div>
											<div className="space-y-2 max-h-64 overflow-y-auto">
												{result.console.warnings.map((warning, index) => (
													<div
														key={index}
														className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md text-sm border border-yellow-200 dark:border-yellow-900"
													>
														<div className="font-mono text-xs break-all">
															{warning.message}
														</div>
														{warning.source && (
															<div className="text-xs text-muted-foreground mt-1">
																Source: {warning.source}
																{warning.lineNumber && `:${warning.lineNumber}`}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

					{/* Charts */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
						{/* Resource Type Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Resource Type Distribution</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={resourceTypeStats}
											dataKey="count"
											nameKey="name"
											cx="50%"
											cy="50%"
											outerRadius={100}
											label={(entry) => `${entry.name}: ${entry.count}`}
										>
											{resourceTypeStats.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Resource Size by Type */}
						<Card>
							<CardHeader>
								<CardTitle>Size by Resource Type</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={resourceTypeStats}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="name"
											angle={-45}
											textAnchor="end"
											height={80}
										/>
										<YAxis />
										<Tooltip
											formatter={(value: number) => formatBytes(value)}
										/>
										<Bar dataKey="size" fill="#8884d8">
											{resourceTypeStats.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					{/* Failed Requests Chart */}
					{result.failedRequests > 0 && (
						<Card className="mb-8">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-destructive" />
									Failed Requests by Type
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart
										data={resourceTypeStats.filter(
											(stat) => stat.failedCount > 0,
										)}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="failedCount"
											fill="#ef4444"
											name="Failed Requests"
										/>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					)}

					{/* Resources Table */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Resource Details</span>
								<div className="flex gap-2">
									<select
										className="text-sm border rounded px-2 py-1"
										value={filterType}
										onChange={(e) =>
											setFilterType(e.target.value as ResourceType | "all")
										}
									>
										<option value="all">All Types</option>
										{Object.keys(RESOURCE_TYPE_COLORS).map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b">
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("type")}
											>
												Type{" "}
												{sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th className="text-left p-2">URL</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("method")}
											>
												Method{" "}
												{sortBy === "method" &&
													(sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("status")}
											>
												Status{" "}
												{sortBy === "status" &&
													(sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("size")}
											>
												Size{" "}
												{sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th
												className="text-left p-2 cursor-pointer hover:bg-muted"
												onClick={() => handleSort("time")}
											>
												Time{" "}
												{sortBy === "time" && (sortOrder === "asc" ? "↑" : "↓")}
											</th>
											<th className="text-left p-2">Response</th>
										</tr>
									</thead>
									<tbody>
										{getSortedAndFilteredResources().map((resource, index) => (
											<>
												<tr key={index} className="border-b hover:bg-muted/50">
													<td className="p-2">
														<Badge
															style={{
																backgroundColor:
																	RESOURCE_TYPE_COLORS[resource.type],
															}}
														>
															{resource.type}
														</Badge>
													</td>
													<td
														className="p-2 max-w-md truncate"
														title={resource.url}
													>
														{resource.url}
													</td>
													<td className="p-2">{resource.method}</td>
													<td className="p-2">
														<Badge
															variant={
																resource.status &&
																resource.status >= 200 &&
																resource.status < 300
																	? "default"
																	: "destructive"
															}
														>
															{resource.status || "N/A"}
														</Badge>
													</td>
													<td className="p-2">{formatBytes(resource.size)}</td>
													<td className="p-2">{formatTime(resource.time)}</td>
													<td className="p-2">
														{resource.response ? (
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	setExpandedRow(
																		expandedRow === index ? null : index,
																	)
																}
															>
																<Eye className="w-4 h-4" />
															</Button>
														) : (
															<span className="text-muted-foreground">-</span>
														)}
													</td>
												</tr>
												{expandedRow === index && resource.response && (
													<tr key={`${index}-detail`} className="bg-muted/30">
														<td colSpan={7} className="p-4">
															<div className="space-y-2">
																<div className="font-semibold text-sm">
																	Response Data:
																</div>
																<pre className="bg-background p-3 rounded-md text-xs overflow-x-auto max-h-96 border">
																	{JSON.stringify(resource.response, null, 2)}
																</pre>
															</div>
														</td>
													</tr>
												)}
											</>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
