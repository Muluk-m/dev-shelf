"use client";

import { Check, Copy, Globe, Link2, RefreshCw } from "lucide-react";
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

// 复制行组件
const CopyRow = ({
	label,
	value,
	copiedItems,
	onCopy,
}: {
	label: string;
	value: string;
	copiedItems: Set<string>;
	onCopy: (text: string, label: string) => void;
}) => {
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
						onClick={() => onCopy(value, label)}
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

// 查询参数行组件
const QueryParamRow = ({
	param,
	index,
	editedValue,
	onValueChange,
	copiedItems,
	onCopy,
}: {
	param: { key: string; value: string };
	index: number;
	editedValue: string;
	onValueChange: (value: string) => void;
	copiedItems: Set<string>;
	onCopy: (text: string, label: string) => void;
}) => {
	const keyCopyKey = `参数名-${param.key}`;
	const valueCopyKey = `参数值-${editedValue}`;
	const isKeyCopied = copiedItems.has(keyCopyKey);
	const isValueCopied = copiedItems.has(valueCopyKey);

	return (
		<div className="flex items-center mb-2 group">
			<div className="w-[110px] flex items-center justify-end text-muted-foreground mr-2">
				<span className="text-xs bg-muted px-2 rounded-full py-1 mr-2 min-w-[20px] text-center">
					{index + 1}
				</span>
			</div>
			<div className="flex-1 flex items-stretch border rounded bg-muted/20 overflow-hidden">
				{/* Key 部分 */}
				<div className="flex items-start w-1/3 px-3 py-2 border-r bg-background/50">
					<div className="flex-1 min-w-0">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
							Key
						</div>
						<span className="font-mono text-xs font-medium break-all block">
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
						onClick={() => onCopy(param.key, "参数名")}
					>
						{isKeyCopied ? (
							<Check className="h-3 w-3" />
						) : (
							<Copy className="h-3 w-3" />
						)}
					</Button>
				</div>
				{/* Value 部分 */}
				<div className="flex items-start w-2/3 px-3 py-2">
					<div className="flex-1 min-w-0">
						<div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
							Value
						</div>
						<Textarea
							className="font-mono text-xs min-h-[28px] py-1 px-2 bg-background/50 resize-none"
							value={editedValue}
							onChange={(e) => onValueChange(e.target.value)}
							placeholder="empty"
							rows={1}
						/>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className={`h-6 w-6 p-0 ml-2 flex-shrink-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
							isValueCopied
								? "text-green-600 bg-green-100 dark:bg-green-900/30"
								: ""
						}`}
						onClick={() => onCopy(editedValue, "参数值")}
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

// 查询参数区域组件
const QueryParamsSection = ({
	parsedUrl,
	editedParams,
	newUrl,
	copiedItems,
	onParamValueChange,
	onCopy,
}: {
	parsedUrl: ParsedURL | null;
	editedParams: Array<{ key: string; value: string }>;
	newUrl: string;
	copiedItems: Set<string>;
	onParamValueChange: (index: number, value: string) => void;
	onCopy: (text: string, label: string) => void;
}) => {
	if (!parsedUrl?.params || parsedUrl.params.length === 0) {
		return null;
	}

	const hasChanges = editedParams.some(
		(edited, i) => edited.value !== parsedUrl.params[i]?.value,
	);
	const isNewUrlCopied = copiedItems.has(`新URL-${newUrl}`);

	return (
		<Card>
			<CardContent className="pt-3">
				<div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b">
					<div className="flex items-center gap-2">
						<div className="text-sm font-medium text-foreground">
							Query Parameters
						</div>
						<div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
							{parsedUrl.params.length} 个参数
						</div>
					</div>
					{hasChanges && newUrl && (
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								className={`h-7 text-xs gap-1 transition-all ${
									isNewUrlCopied
										? "bg-green-100 dark:bg-green-900/30 text-green-600"
										: ""
								}`}
								onClick={() => onCopy(newUrl, "新URL")}
							>
								{isNewUrlCopied ? (
									<Check className="h-3 w-3" />
								) : (
									<Copy className="h-3 w-3" />
								)}
								复制新URL
							</Button>
						</div>
					)}
				</div>
				<div className="space-y-1">
					{parsedUrl.params.map((param, index) => (
						<QueryParamRow
							key={`${param.key}-${param.value}-${index}`}
							param={param}
							index={index}
							editedValue={editedParams[index]?.value || ""}
							onValueChange={(value) => onParamValueChange(index, value)}
							copiedItems={copiedItems}
							onCopy={onCopy}
						/>
					))}
				</div>
				{hasChanges && newUrl && (
					<div className="mt-3 pt-3 border-t">
						<div className="flex items-center gap-2 mb-2">
							<RefreshCw className="h-3.5 w-3.5 text-blue-600" />
							<span className="text-xs font-medium text-blue-600">
								生成的新URL
							</span>
						</div>
						<div className="font-mono text-xs break-all p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
							{newUrl}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default function URLParserPage() {
	const [inputUrl, setInputUrl] = useState(
		"https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash",
	);
	const [parsedUrl, setParsedUrl] = useState<ParsedURL | null>(null);
	const [editedParams, setEditedParams] = useState<
		Array<{ key: string; value: string }>
	>([]);
	const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

	const parseURL = (urlString: string) => {
		try {
			const url = new URL(urlString);
			const params: Array<{ key: string; value: string }> = [];
			url.searchParams.forEach((value, key) => {
				params.push({ key, value });
			});

			const parsed = {
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
			};
			setParsedUrl(parsed);
			setEditedParams(params);
		} catch {
			setParsedUrl(null);
			setEditedParams([]);
			toast.error("解析失败，请输入有效的URL地址");
		}
	};

	useEffect(() => {
		parseURL(inputUrl);
	}, []);

	const generateNewURL = () => {
		if (!parsedUrl) return "";

		try {
			const url = new URL(inputUrl);
			// 清空现有参数
			url.search = "";
			// 添加编辑后的参数
			editedParams.forEach((param) => {
				if (param.key) {
					url.searchParams.append(param.key, param.value);
				}
			});
			return url.toString();
		} catch {
			return "";
		}
	};

	const handleParamValueChange = (index: number, newValue: string) => {
		setEditedParams((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], value: newValue };
			return updated;
		});
	};

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

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-3 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-5xl mx-auto flex flex-col h-full space-y-3 w-full">
					{/* 标题 */}
					<div className="text-center flex-shrink-0">
						<div className="flex items-center justify-center gap-2 mb-1">
							<div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
								<Link2 className="h-5 w-5" />
							</div>
							<h1 className="text-xl font-bold">URL分析器</h1>
						</div>
					<p className="text-xs text-muted-foreground">
						解析URL中各种部分（协议、来源、参数、端口...），支持编辑参数值并生成新URL
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
							<CopyRow
								label="Protocol"
								value={parsedUrl?.protocol || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Username"
								value={parsedUrl?.username || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Password"
								value={parsedUrl?.password || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Hostname"
								value={parsedUrl?.hostname || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Port"
								value={parsedUrl?.port || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Path"
								value={parsedUrl?.pathname || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Params"
								value={parsedUrl?.search || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
							<CopyRow
								label="Hash"
								value={parsedUrl?.hash || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
							/>
						</CardContent>
					</Card>

					{/* Query 参数 */}
					<QueryParamsSection
						parsedUrl={parsedUrl}
						editedParams={editedParams}
						newUrl={generateNewURL()}
						copiedItems={copiedItems}
						onParamValueChange={handleParamValueChange}
						onCopy={copyToClipboard}
					/>
				</div>
			</main>
		</div>
	);
}
