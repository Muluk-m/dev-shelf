import {
	AlertTriangle,
	CheckCircle2,
	Code,
	FileText,
	Smartphone,
	XCircle,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { WebsiteCheckResult } from "~/types/website-check";

interface PwaInfoCardProps {
	pwa: NonNullable<WebsiteCheckResult["pwa"]>;
	url: string;
}

export function PwaInfoCard({ pwa, url }: PwaInfoCardProps) {
	return (
		<Card
			className={`mb-4 ${
				pwa.isInstallable
					? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
					: "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
			}`}
		>
			<CardHeader>
				<CardTitle className="text-sm flex items-center gap-2">
					<Smartphone
						className={`h-4 w-4 ${
							pwa.isInstallable ? "text-green-600" : "text-yellow-600"
						}`}
					/>
					PWA
					<Badge
						className={`ml-2 text-xs ${
							pwa.isInstallable ? "bg-green-600" : "bg-yellow-600"
						}`}
					>
						{pwa.isInstallable ? "Installable" : "Not Installable"}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="px-6 space-y-2">
				{/* Installability Errors */}
				{pwa.installabilityErrors && pwa.installabilityErrors.length > 0 && (
					<div className="space-y-2 pb-3 border-b">
						<div className="font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
							<AlertTriangle className="h-4 w-4" />
							安装错误
						</div>
						<div className="space-y-1">
							{pwa.installabilityErrors.map((error, index) => (
								<div
									key={index}
									className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded"
								>
									• {error}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Service Worker */}
				{pwa.serviceWorker && (
					<div className="space-y-2 pb-3 border-b">
						<div className="font-semibold flex items-center gap-2">
							<Code className="h-4 w-4" />
							Service Worker
						</div>
						<div className="text-sm space-y-1">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">Status:</span>
								{pwa.serviceWorker.registered ? (
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
							{pwa.serviceWorker.scope && (
								<div>
									<span className="text-muted-foreground">Scope:</span>{" "}
									<span className="font-mono text-xs">
										{pwa.serviceWorker.scope}
									</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Manifest */}
				{pwa.manifest && <ManifestInfo manifest={pwa.manifest} baseUrl={url} />}
			</CardContent>
		</Card>
	);
}

function ManifestInfo({
	manifest,
	baseUrl,
}: {
	manifest: NonNullable<NonNullable<WebsiteCheckResult["pwa"]>["manifest"]>;
	baseUrl: string;
}) {
	const resolveIconUrl = (iconSrc: string, base: string) => {
		try {
			return new URL(iconSrc, base).href;
		} catch {
			return iconSrc;
		}
	};

	return (
		<div className="space-y-2">
			<div className="font-semibold flex items-center gap-2 text-sm">
				<FileText className="h-3.5 w-3.5" />
				Manifest Information
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
				{manifest.name && <ManifestField label="Name" value={manifest.name} />}
				{manifest.short_name && (
					<ManifestField label="Short Name" value={manifest.short_name} />
				)}
				{manifest.description && (
					<ManifestField
						label="Description"
						value={manifest.description}
						fullWidth
					/>
				)}
				{manifest.default_lang && (
					<ManifestField label="Default Lang" value={manifest.default_lang} />
				)}
				{manifest.start_url && (
					<ManifestField
						label="Start URL"
						value={manifest.start_url}
						fullWidth
						mono
					/>
				)}
				{manifest.display && (
					<ManifestField label="Display" value={manifest.display} />
				)}
				{manifest.theme_color && (
					<ColorField label="Theme Color" color={manifest.theme_color} />
				)}
				{manifest.background_color && (
					<ColorField
						label="Background Color"
						color={manifest.background_color}
					/>
				)}
			</div>

			{/* Icons */}
			{manifest.icons && manifest.icons.length > 0 && (
				<div className="mt-2 pt-2 border-t">
					<div className="text-xs text-muted-foreground mb-1.5">
						App Icons ({manifest.icons.length}):
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
						{manifest.icons.map((icon, i) => {
							const iconUrl = resolveIconUrl(icon.src, baseUrl);
							return (
								<div
									key={i}
									className="flex flex-col items-center gap-1 p-2 border rounded bg-background"
								>
									<div className="relative w-12 h-12 flex items-center justify-center">
										<img
											src={iconUrl}
											alt={`App icon ${icon.sizes}`}
											className="max-w-full max-h-full object-contain rounded"
											onError={(e) => {
												if (typeof document === "undefined") return;
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
												const parent = target.parentElement;
												if (parent) {
													const fallback = document.createElement("div");
													fallback.className =
														"w-12 h-12 flex items-center justify-center bg-muted rounded text-muted-foreground text-[10px]";
													fallback.textContent = "No Preview";
													parent.appendChild(fallback);
												}
											}}
										/>
									</div>
									<div className="text-center w-full">
										<div className="text-[10px] font-medium truncate">
											{icon.sizes}
										</div>
										<div className="text-[10px] text-muted-foreground truncate">
											{icon.type}
										</div>
										{icon.purpose && (
											<Badge
												variant="outline"
												className="text-[10px] h-4 px-1 mt-0.5"
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
	);
}

function ManifestField({
	label,
	value,
	fullWidth = false,
	mono = false,
}: {
	label: string;
	value: string;
	fullWidth?: boolean;
	mono?: boolean;
}) {
	return (
		<div
			className={`flex items-start gap-1.5 ${fullWidth ? "md:col-span-2" : ""}`}
		>
			<span className="text-muted-foreground flex-shrink-0">{label}:</span>
			<span className={`font-medium break-words ${mono ? "font-mono" : ""}`}>
				{value}
			</span>
		</div>
	);
}

function ColorField({ label, color }: { label: string; color: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground flex-shrink-0">{label}:</span>
			<div className="flex items-center gap-1.5">
				<div
					className="w-4 h-4 rounded border flex-shrink-0"
					style={{ backgroundColor: color }}
				/>
				<span className="font-mono">{color}</span>
			</div>
		</div>
	);
}
