import { Copy, Info, Link, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
	appendTokenToUrl,
	DEFAULT_PARAM_NAME,
	DEFAULT_VALIDITY_MINUTES,
	generateWhitelistToken,
	SECRET_KEY,
} from "~/lib/whitelist-token";

export function meta() {
	return [
		{ title: "Whitelist Token Generator | DevTools Platform" },
		{
			name: "description",
			content: "Generate whitelist token for Green Shield preview environment",
		},
	];
}

export default function WhitelistTokenPage() {
	const [validityMinutes, setValidityMinutes] = useState<string>(
		String(DEFAULT_VALIDITY_MINUTES),
	);
	const [paramName, setParamName] = useState<string>(DEFAULT_PARAM_NAME);
	const [targetUrl, setTargetUrl] = useState<string>("");
	const [generatedToken, setGeneratedToken] = useState<string>("");
	const [fullUrl, setFullUrl] = useState<string>("");
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedToken, setCopiedToken] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);

	const handleGenerate = async () => {
		const minutes = Number.parseInt(validityMinutes, 10);

		if (Number.isNaN(minutes) || minutes <= 0) {
			alert("请输入有效的时长（分钟）");
			return;
		}

		if (!paramName.trim()) {
			alert("请输入参数名");
			return;
		}

		setLoading(true);
		try {
			const token = await generateWhitelistToken(SECRET_KEY, minutes);
			setGeneratedToken(token);
			setExpiresAt(new Date(Date.now() + minutes * 60 * 1000));

			// Generate full URL if target URL is provided
			if (targetUrl.trim()) {
				const url = appendTokenToUrl(targetUrl.trim(), token, paramName.trim());
				setFullUrl(url);
			} else {
				setFullUrl("");
			}
		} catch (error) {
			console.error("Token generation failed:", error);
			alert("生成token失败，请稍后重试");
		} finally {
			setLoading(false);
		}
	};

	const handleCopyToken = async () => {
		try {
			await navigator.clipboard.writeText(generatedToken);
			setCopiedToken(true);
			setTimeout(() => setCopiedToken(false), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
			alert("复制失败，请手动复制");
		}
	};

	const handleCopyUrl = async () => {
		try {
			await navigator.clipboard.writeText(fullUrl);
			setCopiedUrl(true);
			setTimeout(() => setCopiedUrl(false), 2000);
		} catch (error) {
			console.error("Copy failed:", error);
			alert("复制失败，请手动复制");
		}
	};

	const formatDateTime = (date: Date): string => {
		return date.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	};

	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="mb-8">
					<ToolPageHeader
						icon={<Shield className="h-5 w-5" />}
						title="绿盾预览 Token 生成器"
						description="生成用于绿盾预览的临时访问令牌，支持自定义有效期和参数名"
					/>
				</div>

				<div className="space-y-6">
					{/* Token Generator Card */}
					<Card>
						<CardHeader>
							<CardTitle>生成 Token</CardTitle>
							<CardDescription>配置参数并生成带签名的访问令牌</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="validity">有效期（分钟）</Label>
									<Input
										id="validity"
										type="number"
										min="1"
										value={validityMinutes}
										onChange={(e) => setValidityMinutes(e.target.value)}
										placeholder="输入有效期时长"
									/>
									<p className="text-xs text-muted-foreground">
										推荐: 60分钟（测试）或 1440分钟（演示）
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="paramName">参数名</Label>
									<Input
										id="paramName"
										value={paramName}
										onChange={(e) => setParamName(e.target.value)}
										placeholder="例如: _wt"
									/>
									<p className="text-xs text-muted-foreground">
										默认: _wt（可自定义）
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="targetUrl">
									目标 URL（可选）
									<Badge variant="secondary" className="ml-2 text-xs">
										选填
									</Badge>
								</Label>
								<Textarea
									id="targetUrl"
									value={targetUrl}
									onChange={(e) => setTargetUrl(e.target.value)}
									placeholder="输入目标URL，系统将自动追加token参数&#10;例如: https://example.com/preview"
									rows={3}
									className="font-mono text-sm"
								/>
								<p className="text-xs text-muted-foreground">
									填写后将自动生成完整的访问链接
								</p>
							</div>

							<Button
								onClick={handleGenerate}
								disabled={loading}
								className="w-full gap-2"
							>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										生成中...
									</>
								) : (
									<>
										<Shield className="w-4 h-4" />
										生成 Token
									</>
								)}
							</Button>

							{generatedToken && (
								<div className="space-y-4 pt-4 border-t">
									{/* Generated Token */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>生成的 Token</Label>
											{expiresAt && (
												<Badge variant="outline" className="gap-1">
													<Info className="w-3 h-3" />
													过期时间: {formatDateTime(expiresAt)}
												</Badge>
											)}
										</div>
										<div className="relative">
											<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
												{generatedToken}
											</div>
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={handleCopyToken}
												className="absolute top-2 right-2"
											>
												{copiedToken ? (
													<span className="text-xs text-green-600">已复制</span>
												) : (
													<Copy className="w-4 h-4" />
												)}
											</Button>
										</div>
									</div>

									{/* Full URL */}
									{fullUrl && (
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Link className="w-4 h-4 text-primary" />
												<Label>完整访问链接</Label>
												<Badge variant="secondary" className="text-xs">
													已追加参数
												</Badge>
											</div>
											<div className="relative">
												<div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
													{fullUrl}
												</div>
												<Button
													type="button"
													variant="secondary"
													size="sm"
													onClick={handleCopyUrl}
													className="absolute top-2 right-2"
												>
													{copiedUrl ? (
														<span className="text-xs text-green-600">
															已复制
														</span>
													) : (
														<Copy className="w-4 h-4" />
													)}
												</Button>
											</div>
											<p className="text-xs text-muted-foreground">
												直接使用此链接访问，Token 已自动添加为 {paramName} 参数
											</p>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Usage Instructions */}
					<Card>
						<CardHeader>
							<CardTitle>使用说明</CardTitle>
							<CardDescription>
								如何在绿盾预览环境中使用生成的 Token
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert>
								<Info className="w-4 h-4" />
								<AlertDescription>
									<div className="space-y-2">
										<p className="font-semibold">Token 使用方式：</p>
										<ol className="list-decimal list-inside space-y-1 ml-2">
											<li>
												<strong>方式一（推荐）</strong>:
												填写目标URL后直接使用生成的完整链接
											</li>
											<li>
												<strong>方式二</strong>: 手动将 Token 添加到 URL 参数：
												<code className="block mt-1 p-2 bg-muted rounded text-sm">
													https://your-url.com?{paramName || "_wt"}=YOUR_TOKEN
												</code>
											</li>
										</ol>
									</div>
								</AlertDescription>
							</Alert>

							<div className="space-y-2">
								<h4 className="font-semibold text-sm">安全提示：</h4>
								<ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
									<li>Token 具有时效性，请在有效期内使用</li>
									<li>不要在公开场合分享 Token 或完整链接</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
