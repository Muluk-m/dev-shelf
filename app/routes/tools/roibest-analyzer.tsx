import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Code,
	FileText,
	Globe,
	Link as LinkIcon,
	Smartphone,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type {
	ConfigV3Data,
	PixelEvent,
	RoiBestAnalysisResult,
} from "~/types/roibest-analyzer";
import type { Route } from "./+types/roibest-analyzer";

const API_ENDPOINT = "https://fe-toolkit.qiliangjia.org/website-check/analyze";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "RoiBest Link Analyzer | DevTools Platform" },
		{
			name: "description",
			content: "Analyze RoiBest PWA landing pages - ConfigV3 and Pixel Events",
		},
	];
}

export default function RoiBestAnalyzer() {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<RoiBestAnalysisResult | null>(null);

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
				body: JSON.stringify({ url, timeout: 30000, device: "mobile" }),
			});

			if (!response.ok) {
				const errorData: any = await response.json().catch(() => null);
				const errorMessage =
					errorData?.message ||
					errorData?.error ||
					`Failed to analyze: ${response.statusText}`;
				throw new Error(errorMessage);
			}

			const data: RoiBestAnalysisResult = await response.json();
			setResult(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error occurred");
		} finally {
			setLoading(false);
		}
	};

	const formatTime = (ms: number) => {
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleString();
	};

	// Group pixel events by event_code
	const groupedPixelEvents =
		result?.pixelEvents?.reduce(
			(acc, event) => {
				if (!acc[event.event_code]) {
					acc[event.event_code] = [];
				}
				acc[event.event_code].push(event);
				return acc;
			},
			{} as Record<string, PixelEvent[]>,
		) || {};

	const configData = result?.configV3?.data;
	const currentLang = configData?.current_language_code || "en";
	const langData = configData?.language_json?.[currentLang];

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
					<Smartphone className="w-8 h-8" />
					RoiBest Link Analyzer
				</h1>
				<p className="text-muted-foreground">
					Analyze RoiBest PWA landing pages - ConfigV3 and Pixel Events
				</p>
			</div>

			{/* Search Form */}
			<Card className="mb-8">
				<CardContent className="pt-6">
					<div className="flex gap-4">
						<Input
							type="url"
							placeholder="Enter RoiBest URL (e.g., https://instalar.lunarbrl.com)"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
							className="flex-1"
						/>
						<Button onClick={handleAnalyze} disabled={loading}>
							{loading ? "Analyzing..." : "Analyze"}
						</Button>
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
					{/* Summary Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
						{/* Screenshot */}
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
												alt="Page Screenshot"
												className="w-full h-auto"
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Summary Info */}
						<div
							className={`${result.screenshot ? "lg:col-span-2" : "lg:col-span-3"}`}
						>
							<Card className="h-full">
								<CardHeader className="pb-3">
									<CardTitle className="text-base flex items-center gap-2">
										<FileText className="h-4 w-4" />
										Analysis Summary
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Page Title */}
									{result.pageTitle && (
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Page Title
											</div>
											<div className="text-sm font-medium">
												{result.pageTitle}
											</div>
										</div>
									)}

									{/* Key Metrics */}
									<div className="grid grid-cols-2 gap-4 pt-3 border-t">
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
												Analyzed At
											</div>
											<div className="text-sm font-medium text-xs">
												{formatDate(result.analyzedAt)}
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Pixel Events
											</div>
											<div className="text-sm font-medium">
												{result.pixelEvents?.length || 0} events
											</div>
										</div>
										<div>
											<div className="text-xs text-muted-foreground mb-1">
												Config Status
											</div>
											{result.configV3 ? (
												<Badge className="bg-green-600">
													<CheckCircle2 className="h-3 w-3 mr-1" />
													Loaded
												</Badge>
											) : (
												<Badge variant="destructive">Failed</Badge>
											)}
										</div>
									</div>

									{/* Quick Status */}
									{configData && (
										<div className="pt-3 border-t">
											<div className="text-xs text-muted-foreground mb-2">
												App Info
											</div>
											<div className="space-y-1 text-sm">
												<div>
													<span className="text-muted-foreground">Name:</span>{" "}
													<span className="font-medium">
														{configData.app_name}
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">
														Project ID:
													</span>{" "}
													<span className="font-mono text-xs">
														{configData.project_id}
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">Domain:</span>{" "}
													<span className="font-mono text-xs">
														{configData.domain}
													</span>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Config V3 Data */}
					{configData && langData && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
							{/* App Information */}
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<Smartphone className="h-5 w-5" />
										App Information
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* App Icon */}
									{langData.app_icon && (
										<div className="flex items-center gap-4">
											<img
												src={`https://static.roibest.com/${langData.app_icon}`}
												alt={langData.app_name}
												className="w-16 h-16 rounded-lg border"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.style.display = "none";
												}}
											/>
											<div>
												<div className="font-semibold">{langData.app_name}</div>
												<div className="text-sm text-muted-foreground">
													{langData.company_name}
												</div>
											</div>
										</div>
									)}

									{/* App Stats */}
									<div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
										<div>
											<span className="text-muted-foreground">Score:</span>{" "}
											<span className="font-medium">
												{langData.app_score} ⭐
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Downloads:</span>{" "}
											<span className="font-medium">
												{langData.app_download.toLocaleString()}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Comments:</span>{" "}
											<span className="font-medium">
												{langData.app_comments.toLocaleString()}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Language:</span>{" "}
											<span className="font-medium uppercase">
												{langData.language_code}
											</span>
										</div>
									</div>

									{/* Description */}
									{langData.app_desc && (
										<div className="pt-3 border-t">
											<div className="text-sm text-muted-foreground mb-1">
												Description
											</div>
											<p className="text-sm">{langData.app_desc}</p>
										</div>
									)}

									{/* Labels */}
									{langData.app_labels && (
										<div className="pt-3 border-t">
											<div className="text-sm text-muted-foreground mb-2">
												Labels
											</div>
											<div className="flex flex-wrap gap-2">
												{langData.app_labels.split(",").map((label, i) => (
													<Badge key={i} variant="outline">
														{label.trim()}
													</Badge>
												))}
											</div>
										</div>
									)}

									{/* Screenshots */}
									{langData.pic_list && langData.pic_list.length > 0 && (
										<div className="pt-3 border-t">
											<div className="text-sm text-muted-foreground mb-2">
												Screenshots ({langData.pic_list.length})
											</div>
											<div className="grid grid-cols-3 gap-2">
												{langData.pic_list.slice(0, 3).map((pic, i) => (
													<img
														key={i}
														src={`https://static.roibest.com/${pic}`}
														alt={`Screenshot ${i + 1}`}
														className="w-full rounded border"
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.style.display = "none";
														}}
													/>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Link Info & Configuration */}
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<LinkIcon className="h-5 w-5" />
										Link Configuration
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-3 text-sm">
										<div>
											<span className="text-muted-foreground">
												Promote URL ID:
											</span>{" "}
											<span className="font-mono text-xs">
												{configData.linkInfo.promote_url_id}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Channel ID:</span>{" "}
											<span className="font-mono text-xs">
												{configData.linkInfo.channel_id}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Pixel ID:</span>{" "}
											<span className="font-mono text-xs">
												{configData.linkInfo.rb_pixel_id}
											</span>
										</div>
										<div>
											<span className="text-muted-foreground">Pixel Type:</span>{" "}
											<Badge variant="outline">
												{configData.linkInfo.rb_pixel_type}
											</Badge>
										</div>
									</div>

									{/* Package Info */}
									<div className="pt-3 border-t space-y-2">
										<div className="text-sm font-semibold">Package Info</div>
										<div className="text-sm space-y-2">
											<div>
												<span className="text-muted-foreground">Type:</span>{" "}
												<Badge>{configData.package_type}</Badge>
											</div>
											<div>
												<span className="text-muted-foreground">Status:</span>{" "}
												<Badge
													variant={
														configData.package_status === 2
															? "default"
															: "outline"
													}
												>
													{configData.package_status}
												</Badge>
											</div>
											{configData.package_name && (
												<div>
													<span className="text-muted-foreground">Name:</span>{" "}
													<span className="font-mono text-xs">
														{configData.package_name}
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Flags */}
									<div className="pt-3 border-t">
										<div className="text-sm font-semibold mb-2">Features</div>
										<div className="flex flex-wrap gap-2">
											{configData.pre_load === 1 && (
												<Badge className="gap-1">
													<Zap className="h-3 w-3" />
													Pre-load
												</Badge>
											)}
											{configData.all_click === 1 && (
												<Badge className="gap-1">All Click</Badge>
											)}
											{configData.all_screen === 1 && (
												<Badge className="gap-1">All Screen</Badge>
											)}
											{configData.hidden === 1 && (
												<Badge variant="outline">Hidden</Badge>
											)}
										</div>
									</div>

									{/* Timestamps */}
									<div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
										<div>Created: {configData.created_at}</div>
										<div>Updated: {configData.updated_at}</div>
										{configData.notes && <div>Notes: {configData.notes}</div>}
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					{/* Pixel Events */}
					{result.pixelEvents && result.pixelEvents.length > 0 && (
						<Card className="mb-8">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									Pixel Events Tracking
									<Badge className="ml-2">
										{result.pixelEvents.length} total
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{/* Event Summary */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="p-4 border rounded-lg">
											<div className="text-2xl font-bold">
												{Object.keys(groupedPixelEvents || {}).length}
											</div>
											<div className="text-sm text-muted-foreground">
												Unique Events
											</div>
										</div>
										<div className="p-4 border rounded-lg">
											<div className="text-2xl font-bold">
												{result.pixelEvents.length}
											</div>
											<div className="text-sm text-muted-foreground">
												Total Fires
											</div>
										</div>
									</div>

									{/* Event List */}
									<div className="space-y-3">
										{Object.entries(groupedPixelEvents || {}).map(
											([eventCode, events]) => (
												<div key={eventCode} className="border rounded-lg p-4">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-2">
															<Code className="h-4 w-4 text-primary" />
															<span className="font-mono font-semibold">
																{eventCode}
															</span>
															<Badge variant="outline">{events.length}x</Badge>
														</div>
													</div>
													<div className="space-y-2">
														{events.map((event, idx) => (
															<div
																key={idx}
																className="text-sm p-2 bg-muted/50 rounded flex items-center justify-between"
															>
																<div className="flex items-center gap-2">
																	<Clock className="h-3 w-3 text-muted-foreground" />
																	<span className="text-xs text-muted-foreground">
																		{formatDate(event.timestamp)}
																	</span>
																</div>
																<span className="font-mono text-xs text-muted-foreground truncate max-w-md">
																	{event.url}
																</span>
															</div>
														))}
													</div>
												</div>
											),
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* User Comments */}
					{langData?.app_comment_list &&
						langData.app_comment_list.length > 0 && (
							<Card className="mb-8">
								<CardHeader className="pb-3">
									<CardTitle className="text-lg flex items-center gap-2">
										<Users className="h-5 w-5" />
										User Reviews
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{langData.app_comment_list.map((comment, idx) => (
											<div key={idx} className="border rounded-lg p-4">
												<div className="flex items-center gap-3 mb-2">
													<img
														src={comment.avatar}
														alt={comment.name}
														className="w-10 h-10 rounded-full"
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.src =
																"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23ddd' width='40' height='40'/%3E%3C/svg%3E";
														}}
													/>
													<div className="flex-1">
														<div className="font-semibold">{comment.name}</div>
														<div className="text-sm text-muted-foreground">
															{comment.score} ⭐
														</div>
													</div>
												</div>
												<p className="text-sm">{comment.comment}</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

					{/* Config V3 Error */}
					{result.configV3Error && (
						<Card className="mb-8 border-destructive/50">
							<CardHeader className="pb-3">
								<CardTitle className="text-lg flex items-center gap-2 text-destructive">
									<AlertCircle className="h-5 w-5" />
									Config V3 Load Error
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-destructive">
									{result.configV3Error}
								</p>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}
