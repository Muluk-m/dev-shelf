"use client";

import { Check, Copy, Globe, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface ParsedURL {
	protocol: string;
	username: string;
	password: string;
	hostname: string;
	port: string;
	pathname: string;
	search: string;
	hash: string;
	params: Array<{ key: string; value: string }>;
}

export default function URLParserPage() {
	const [inputUrl, setInputUrl] = useState(
		"https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash",
	);
	const [parsedUrl, setParsedUrl] = useState<ParsedURL | null>(null);
	const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

	const parseURL = (urlString: string) => {
		try {
			const url = new URL(urlString);
			const params: Array<{ key: string; value: string }> = [];
			url.searchParams.forEach((value, key) => {
				params.push({ key, value });
			});

			setParsedUrl({
				protocol: url.protocol,
				username: url.username,
				password: url.password,
				hostname: url.hostname,
				port:
					url.port ||
					(url.protocol === "https:"
						? "443"
						: url.protocol === "http:"
							? "80"
							: ""),
				pathname: url.pathname,
				search: url.search,
				hash: url.hash,
				params,
			});
		} catch {
			setParsedUrl(null);
			toast.error("解析失败，请输入有效的URL地址");
		}
	};

	useEffect(() => {
		parseURL(inputUrl);
	}, []);

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text).then(() => {
			toast.success(`${label} 已复制到剪贴板`);
			// 添加到已复制列表，1秒后移除
			const key = `${label}-${text}`;
			setCopiedItems((prev) => new Set(prev).add(key));
			setTimeout(() => {
				setCopiedItems((prev) => {
					const newSet = new Set(prev);
					newSet.delete(key);
					return newSet;
				});
			}, 1000);
		});
	};

	// biome-ignore lint/correctness/noNestedComponentDefinitions: -
	const CopyRow = ({ label, value }: { label: string; value: string }) => {
		const copyKey = `${label}-${value}`;
		const isCopied = copiedItems.has(copyKey);

		return (
			<div className="flex items-center mb-2">
				<Label className="w-[110px] text-right text-sm text-muted-foreground mr-2 shrink-0">
					{label}
				</Label>
				<div className="flex-1 flex items-center border rounded px-2 py-1 bg-muted/20">
					<span className="font-mono text-xs break-all flex-1">
						{value || "-"}
					</span>
					{value && (
						<Button
							size="sm"
							variant="ghost"
							className={`ml-2 h-5 w-5 p-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
								isCopied ? "text-green-600" : ""
							}`}
							onClick={() => copyToClipboard(value, label)}
						>
							{isCopied ? (
								<Check className="h-3 w-3" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</Button>
					)}
				</div>
			</div>
		);
	};

	// biome-ignore lint/correctness/noNestedComponentDefinitions: -
	const QueryParamRow = ({
		param,
		index,
	}: {
		param: { key: string; value: string };
		index: number;
	}) => {
		const keyCopyKey = `参数名-${param.key}`;
		const valueCopyKey = `参数值-${param.value}`;
		const isKeyCopied = copiedItems.has(keyCopyKey);
		const isValueCopied = copiedItems.has(valueCopyKey);

		return (
			<div className="flex items-center mb-2 group">
				<div className="w-[110px] flex items-center justify-end text-muted-foreground mr-2">
					<span className="text-xs bg-muted px-2 rounded-full py-1 mr-2 min-w-[20px] text-center">
						{index + 1}
					</span>
					{/* <span className="text-lg">↘</span> */}
				</div>
				<div className="flex-1 flex items-center border rounded bg-muted/20 overflow-hidden">
					{/* Key 部分 */}
					<div className="flex items-center w-1/2 px-3 py-2 border-r bg-background/50">
						<div className="flex-1 min-w-0">
							<div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
								Key
							</div>
							<span className="font-mono text-xs font-medium truncate block">
								{param.key}
							</span>
						</div>
						<Button
							size="sm"
							variant="ghost"
							className={`h-6 w-6 p-0 ml-2 flex-shrink-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
								isKeyCopied
									? "text-green-600 bg-green-100 dark:bg-green-900/30"
									: ""
							}`}
							onClick={() => copyToClipboard(param.key, "参数名")}
						>
							{isKeyCopied ? (
								<Check className="h-3 w-3" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</Button>
					</div>
					{/* Value 部分 */}
					<div className="flex items-center w-1/2 px-3 py-2">
						<div className="flex-1 min-w-0">
							<div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
								Value
							</div>
							<span className="font-mono text-xs truncate block">
								{param.value || (
									<span className="text-muted-foreground italic">empty</span>
								)}
							</span>
						</div>
						<Button
							size="sm"
							variant="ghost"
							className={`h-6 w-6 p-0 ml-2 flex-shrink-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
								isValueCopied
									? "text-green-600 bg-green-100 dark:bg-green-900/30"
									: ""
							}`}
							onClick={() => copyToClipboard(param.value, "参数值")}
						>
							{isValueCopied ? (
								<Check className="h-3 w-3" />
							) : (
								<Copy className="h-3 w-3" />
							)}
						</Button>
					</div>
				</div>
			</div>
		);
	};

	// biome-ignore lint/correctness/noNestedComponentDefinitions: -
	const QueryParamsSection = () => {
		if (!parsedUrl?.params || parsedUrl.params.length === 0) {
			return null;
		}

		return (
			<Card>
				<CardContent className="pt-3">
					<div className="flex items-center gap-2 mb-3 pb-2 border-b">
						<div className="text-sm font-medium text-foreground">
							Query Parameters
						</div>
						<div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
							{parsedUrl.params.length} 个参数
						</div>
					</div>
					<div className="space-y-1">
						{parsedUrl.params.map((param, index) => (
							<QueryParamRow
								key={`${param.key}-${param.value}-${index}`}
								param={param}
								index={index}
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	};

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-3 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-3xl mx-auto flex flex-col h-full space-y-3 w-full">
					{/* 标题 */}
					<div className="text-center flex-shrink-0">
						<div className="flex items-center justify-center gap-2 mb-1">
							<div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
								<Link2 className="h-5 w-5" />
							</div>
							<h1 className="text-xl font-bold">URL分析器</h1>
						</div>
						<p className="text-xs text-muted-foreground">
							解析URL中各种部分（协议、来源、参数、端口...）
						</p>
					</div>

					{/* 输入框 */}
					<Card>
						<CardContent className="pt-3">
							<div className="mb-2 text-sm flex items-center gap-2 text-muted-foreground">
								<Globe className="h-4 w-4" />
								Your url to parse:
							</div>
							<Textarea
								className="font-mono text-sm resize-none h-12"
								value={inputUrl}
								onChange={(e) => {
									setInputUrl(e.target.value);
									parseURL(e.target.value);
								}}
							/>
						</CardContent>
					</Card>

					{/* 基本字段 */}
					<Card>
						<CardContent className="pt-3">
							<CopyRow label="Protocol" value={parsedUrl?.protocol || ""} />
							<CopyRow label="Username" value={parsedUrl?.username || ""} />
							<CopyRow label="Password" value={parsedUrl?.password || ""} />
							<CopyRow label="Hostname" value={parsedUrl?.hostname || ""} />
							<CopyRow label="Port" value={parsedUrl?.port || ""} />
							<CopyRow label="Path" value={parsedUrl?.pathname || ""} />
							<CopyRow label="Params" value={parsedUrl?.search || ""} />
							<CopyRow label="Hash" value={parsedUrl?.hash || ""} />
						</CardContent>
					</Card>

					{/* Query 参数 */}
					<QueryParamsSection />
				</div>
			</main>
		</div>
	);
}
