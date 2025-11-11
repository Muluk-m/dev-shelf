"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { Route } from "./+types/url-parser";
import { useUserInfoStore } from "~/stores/user-info-store";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "域名状态检测 | DevTools Platform" },
		{
			name: "description",
			content:
				"输入域名后实时检查备案、证书和 CDN 配置状态，并展示详细检测结果。",
		},
	];
}

const ADDITIONAL_ID = "95271";
const DEFAULT_DETAIL_ID = "95281";
const ADVANCED_DETAIL_ID = "9528";

const ADVANCED_ACCESS_WHITELIST = new Set<string>([
	"梁济",
	"马启骞",
	"周杨",
	"罗耿",
]);

const DOMAIN_REGEX = /^(?!-)(?!.*?--)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

export default function RBDomainCheckPage() {
	const [inputValue, setInputValue] = useState("");
	const [domain, setDomain] = useState<string | null>(null);
	const [iframeKey, setIframeKey] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const { userInfo } = useUserInfoStore();
	const [useAdvancedDetail, setUseAdvancedDetail] = useState(false);
	const canToggleDetail = useMemo(
		() =>
			userInfo?.userName
				? ADVANCED_ACCESS_WHITELIST.has(userInfo.userName)
				: false,
		[userInfo?.userName],
	);

	useEffect(() => {
		setUseAdvancedDetail(false);
	}, [userInfo?.userName]);

	const iframeUrl = useMemo(() => {
		if (!domain) {
			return null;
		}
		const detailId = useAdvancedDetail ? ADVANCED_DETAIL_ID : DEFAULT_DETAIL_ID;
		const searchParams = new URLSearchParams({
			additional: ADDITIONAL_ID,
			check_detail: detailId,
			debug: "0",
			domain: domain.trim(),
		});
		return `https://hook-admin-prod-1.roibest.com/admin/tools/domainCheck?${searchParams.toString()}`;
	}, [domain, useAdvancedDetail]);

	const handleToggleDetail = () => {
		setUseAdvancedDetail((prev) => !prev);
		if (domain) {
			setIframeKey((value) => value + 1);
			setIsLoading(true);
		}
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const next = inputValue.trim();
		if (next.length === 0) {
			toast.error("请输入要检测的域名");
			return;
		}
		if (!DOMAIN_REGEX.test(next.toLowerCase())) {
			toast.error("请输入正确的域名");
			return;
		}

		setDomain(next);
		setIframeKey((prev) => prev + 1);
		setIsLoading(true);
	};

	return (
		<div className="bg-background flex flex-col min-h-[calc(100vh-4rem)]">
			<main className="container mx-auto px-4 py-3 flex-1 flex flex-col space-y-4">
				<div className="text-center space-y-3">
					<div>
						<h1 className="text-xl font-bold">域名状态检测</h1>
						<p className="text-xs text-muted-foreground">
							基于内部检测平台自动校验域名解析、证书、CDN
							等状态，并展示详细检测结果。
						</p>
					</div>
				</div>

				<Card>
					<CardContent className="pt-4 space-y-4">
						{canToggleDetail && (
							<div className="flex flex-col gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
								<div className="flex items-center gap-2">
									<span>当前模式</span>
									<Badge variant={useAdvancedDetail ? "default" : "outline"}>
										{useAdvancedDetail ? "高级信息" : "基础信息"}
									</Badge>
								</div>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={handleToggleDetail}
									disabled={isLoading}
									className="w-full md:w-auto"
								>
									{useAdvancedDetail ? "切换为基础模式" : "切换为高级模式"}
								</Button>
							</div>
						)}
						<form
							className="flex flex-col md:flex-row md:items-end gap-3"
							onSubmit={handleSubmit}
						>
							<div className="flex-1 space-y-1">
								<Label htmlFor="domain-input mb-4">域名</Label>
								<Input
									id="domain-input"
									placeholder="例如：example.com"
									value={inputValue}
									onChange={(event) => setInputValue(event.target.value)}
								/>
							</div>
							<Button type="submit" className="md:h-[40px]">
								开始检测
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card className="flex-1">
					<CardContent className="pt-4 flex flex-col gap-3 h-full">
						{iframeUrl ? (
							<div className="relative flex-1">
								{isLoading && (
									<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded border bg-background/70 backdrop-blur">
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
										<p className="text-xs text-muted-foreground">
											正在检测中...
										</p>
									</div>
								)}
								<iframe
									key={`${iframeKey}-${iframeUrl}`}
									src={iframeUrl}
									title="域名检测结果"
									className="w-full flex-1 min-h-[500px] border rounded"
									onLoad={() => setIsLoading(false)}
								/>
							</div>
						) : (
							<div className="flex-1 min-h-[300px] rounded border border-dashed border-muted-foreground/40 bg-muted/10 text-muted-foreground flex items-center justify-center text-sm">
								请输入域名并点击“开始检测”查看结果
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
