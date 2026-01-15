import {
	ArrowUpDown,
	BarChart3,
	Check,
	Copy,
	Filter,
	Globe,
	Link2,
	Plus,
	QrCode,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/url-parser";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "URL分析器 | DevTools Platform" },
		{
			name: "description",
			content: "可视化、编辑、分析和比较 URL，支持编辑参数值并生成新URL",
		},
	];
}

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

// URLAnalyzer 对外上报的状态
interface URLAnalyzerState {
	inputUrl: string;
	parsedUrl: ParsedURL | null;
	editedParams: Array<{ key: string; value: string }>;
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
	index,
	editedKey,
	editedValue,
	onKeyChange,
	onValueChange,
	copiedItems,
	onCopy,
	onDelete,
}: {
	index: number;
	editedKey: string;
	editedValue: string;
	onKeyChange: (value: string) => void;
	onValueChange: (value: string) => void;
	copiedItems: Set<string>;
	onCopy: (text: string, label: string) => void;
	onDelete: (index: number) => void;
}) => {
	const keyCopyKey = `参数名-${editedKey}`;
	const valueCopyKey = `参数值-${editedValue}`;
	const isKeyCopied = copiedItems.has(keyCopyKey);
	const isValueCopied = copiedItems.has(valueCopyKey);

	return (
		<div className="flex items-center mb-2">
			<div className="w-[40px] flex items-center justify-center text-muted-foreground mr-2">
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
						<Input
							className="font-mono text-xs h-[28px] py-1 px-2 bg-background/50"
							value={editedKey}
							onChange={(e) => onKeyChange(e.target.value)}
							placeholder="key"
						/>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className={`h-6 w-6 p-0 ml-2 flex-shrink-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
							isKeyCopied
								? "text-green-600 bg-green-100 dark:bg-green-900/30"
								: ""
						}`}
						onClick={() => onCopy(editedKey, "参数名")}
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
					<div className="flex items-center gap-1 ml-2">
						<Button
							size="sm"
							variant="ghost"
							className={`h-6 w-6 p-0 flex-shrink-0 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 ${
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
						{/* 删除按钮 */}
						<Button
							size="sm"
							variant="ghost"
							className="h-6 w-6 p-0 flex-shrink-0 transition-all duration-200 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 active:scale-95"
							onClick={() => onDelete(index)}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
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
	onParamKeyChange,
	onParamValueChange,
	onCopy,
	onDelete,
	onAddParam,
}: {
	parsedUrl: ParsedURL | null;
	editedParams: Array<{ key: string; value: string }>;
	newUrl: string;
	copiedItems: Set<string>;
	onParamKeyChange: (index: number, value: string) => void;
	onParamValueChange: (index: number, value: string) => void;
	onCopy: (text: string, label: string) => void;
	onDelete: (index: number) => void;
	onAddParam: () => void;
}) => {
	if (!parsedUrl) {
		return null;
	}

	const hasChanges =
		editedParams.length !== parsedUrl.params.length ||
		editedParams.some(
			(edited, i) =>
				edited.key !== parsedUrl.params[i]?.key ||
				edited.value !== parsedUrl.params[i]?.value,
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
							{editedParams.length} 个参数
						</div>
					</div>
				</div>
				<div className="space-y-1">
					{editedParams.map((param, index) => (
						<QueryParamRow
							key={index}
							index={index}
							editedKey={editedParams[index]?.key || ""}
							editedValue={editedParams[index]?.value || ""}
							onKeyChange={(value) => onParamKeyChange(index, value)}
							onValueChange={(value) => onParamValueChange(index, value)}
							copiedItems={copiedItems}
							onCopy={onCopy}
							onDelete={onDelete}
						/>
					))}
				</div>

				{/* 底部操作区域 */}
				<div className="mt-3 pt-3 border-t flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							className="h-7 text-xs gap-1"
							onClick={onAddParam}
						>
							<Plus className="h-3 w-3" />
							添加参数
						</Button>
						{hasChanges && newUrl && (
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
						)}
					</div>
					{hasChanges && newUrl && (
						<div className="flex items-center gap-2">
							<RefreshCw className="h-3.5 w-3.5 text-blue-600" />
							<span className="text-xs font-medium text-blue-600">
								生成的新URL
							</span>
						</div>
					)}
					{hasChanges && newUrl && (
						<div className="font-mono text-xs break-all p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
							{newUrl}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

// URL分析器组件
const URLAnalyzer = ({
	label,
	onStateChange,
}: {
	label?: string;
	onStateChange?: (state: URLAnalyzerState) => void;
}) => {
	const [inputUrl, setInputUrl] = useState(
		"https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash",
	);
	const [parsedUrl, setParsedUrl] = useState<ParsedURL | null>(null);
	const [editedParams, setEditedParams] = useState<
		Array<{ key: string; value: string }>
	>([]);
	const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
	const [showQrCode, setShowQrCode] = useState(false);

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

	// 上报当前状态给父级（用于对比）
	useEffect(() => {
		if (onStateChange) {
			onStateChange({ inputUrl, parsedUrl, editedParams });
		}
	}, [inputUrl, parsedUrl, editedParams, onStateChange]);

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

	const handleParamKeyChange = (index: number, newKey: string) => {
		setEditedParams((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], key: newKey };
			return updated;
		});
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

	const handleAddParam = () => {
		setEditedParams((prev) => [...prev, { key: "", value: "" }]);
	};

	const handleDeleteParam = (index: number) => {
		setEditedParams((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<div className="flex flex-col space-y-3 w-full">
			{label && (
				<div className="text-center flex-shrink-0">
					<h2 className="text-sm font-medium">{label}</h2>
				</div>
			)}

			{/* 输入框 */}
			<Card>
				<CardContent className="pt-3">
					<div className="mb-2 text-sm flex items-center justify-between">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Globe className="h-4 w-4" />
							Your url to parse:
						</div>
						<Button
							size="sm"
							variant="outline"
							className="h-7 text-xs gap-1"
							onClick={() => setShowQrCode(true)}
							disabled={!inputUrl.trim()}
						>
							<QrCode className="h-3.5 w-3.5" />
							生成二维码
						</Button>
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

			{/* 二维码对话框 */}
			<Dialog open={showQrCode} onOpenChange={setShowQrCode}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<QrCode className="h-5 w-5" />
							URL 二维码
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-4">
						{/* 二维码显示 */}
						<div className="p-4 bg-white rounded-lg border-2 border-gray-200">
							<QRCodeSVG
								value={inputUrl}
								size={240}
								level="M"
								includeMargin={false}
								className="qr-code-svg"
							/>
						</div>
						{/* URL 显示 */}
						<div className="w-full">
							<div className="text-xs text-muted-foreground mb-1">URL:</div>
							<div className="font-mono text-xs break-all p-2 bg-muted/30 rounded border max-h-20 overflow-y-auto">
								{inputUrl}
							</div>
						</div>
						{/* 操作按钮 */}
						<div className="flex gap-2 w-full">
							<Button
								variant="outline"
								className="flex-1 text-xs"
								onClick={() => {
									const canvas = document.createElement("canvas");
									const qrSvg = document.querySelector(
										".qr-code-svg",
									) as SVGElement;
									if (qrSvg) {
										const svgData = new XMLSerializer().serializeToString(
											qrSvg,
										);
										const img = new Image();
										img.onload = () => {
											canvas.width = img.width;
											canvas.height = img.height;
											const ctx = canvas.getContext("2d");
											if (ctx) {
												ctx.fillStyle = "white";
												ctx.fillRect(0, 0, canvas.width, canvas.height);
												ctx.drawImage(img, 0, 0);
												canvas.toBlob((blob) => {
													if (blob) {
														const url = URL.createObjectURL(blob);
														const a = document.createElement("a");
														a.href = url;
														a.download = "qrcode.png";
														a.click();
														URL.revokeObjectURL(url);
														toast.success("二维码已下载");
													}
												});
											}
										};
										img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
									}
								}}
							>
								下载二维码
							</Button>
							<Button
								variant="default"
								className="flex-1 text-xs"
								onClick={() => setShowQrCode(false)}
							>
								关闭
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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
					{/* <CopyRow
								label="Params"
								value={parsedUrl?.search || ""}
								copiedItems={copiedItems}
								onCopy={copyToClipboard}
          /> */}
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
				onParamKeyChange={handleParamKeyChange}
				onParamValueChange={handleParamValueChange}
				onCopy={copyToClipboard}
				onDelete={handleDeleteParam}
				onAddParam={handleAddParam}
			/>
		</div>
	);
};

// 主组件
export default function URLParserPage() {
	const [compareMode, setCompareMode] = useState(false);
	const [leftState, setLeftState] = useState<URLAnalyzerState | null>(null);
	const [rightState, setRightState] = useState<URLAnalyzerState | null>(null);
	const [showOnlyDiff, setShowOnlyDiff] = useState(false);
	const [sortByKey, setSortByKey] = useState(true);

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-3 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-7xl mx-auto flex flex-col h-full space-y-3 w-full">
					{/* 标题和模式切换 */}
					<ToolPageHeader
						icon={<Link2 className="h-5 w-5" />}
						title="URL分析器"
						description="可视化、编辑、分析和比较 URL，支持编辑参数值并生成新URL"
						actions={
							<div className="flex items-center gap-2">
								<span
									className={`text-sm font-medium transition-colors ${
										!compareMode ? "text-primary" : "text-muted-foreground"
									}`}
								>
									单URL模式
								</span>
								<Switch
									checked={compareMode}
									onCheckedChange={setCompareMode}
								/>
								<span
									className={`text-sm font-medium transition-colors ${
										compareMode ? "text-primary" : "text-muted-foreground"
									}`}
								>
									对比模式
								</span>
							</div>
						}
					/>

					{/* URL分析器 */}
					<div
						className={
							compareMode
								? "grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
								: "w-full"
						}
					>
						<div className="flex flex-col">
							<URLAnalyzer
								label={compareMode ? "URL 1" : undefined}
								onStateChange={setLeftState}
							/>
						</div>
						{compareMode && (
							<div className="flex flex-col">
								<URLAnalyzer label="URL 2" onStateChange={setRightState} />
							</div>
						)}
					</div>

					{/* 对比结果区域 */}
					{compareMode && leftState && rightState && (
						<Card>
							<CardContent className="pt-3">
								<div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b">
									<div className="flex items-center gap-2">
										<RefreshCw className="h-3.5 w-3.5 text-blue-600" />
										<span className="text-xs font-medium text-blue-600">
											参数差异
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="outline"
											className={`h-7 text-xs gap-1 ${
												sortByKey ? "bg-blue-50 dark:bg-blue-900/20" : ""
											}`}
											onClick={() => setSortByKey(!sortByKey)}
										>
											<ArrowUpDown className="h-3 w-3" />
											按Key排序
										</Button>
										<Button
											size="sm"
											variant="outline"
											className={`h-7 text-xs gap-1 ${
												showOnlyDiff ? "bg-amber-50 dark:bg-amber-900/20" : ""
											}`}
											onClick={() => setShowOnlyDiff(!showOnlyDiff)}
										>
											<Filter className="h-3 w-3" />
											{showOnlyDiff ? "显示全部" : "仅显示差异"}
										</Button>
									</div>
								</div>

								{/* 统计信息 */}
								{(() => {
									const leftMap = new Map<string, string>(
										(leftState.editedParams || []).map((p) => [p.key, p.value]),
									);
									const rightMap = new Map<string, string>(
										(rightState.editedParams || []).map((p) => [
											p.key,
											p.value,
										]),
									);
									const allKeys = Array.from(
										new Set<string>([
											...leftState.editedParams.map((p) => p.key),
											...rightState.editedParams.map((p) => p.key),
										]),
									);

									const total = allKeys.length;
									let same = 0;
									let diff = 0;
									let missing = 0;

									allKeys.forEach((k) => {
										const lv = leftMap.get(k);
										const rv = rightMap.get(k);
										if (lv === rv) {
											same++;
										} else {
											diff++;
											if (lv === undefined || rv === undefined) {
												missing++;
											}
										}
									});

									return (
										<div className="flex items-center gap-4 mb-3 pb-2 border-b">
											<div className="flex items-center gap-1.5">
												<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
												<span className="text-xs text-muted-foreground">
													统计:
												</span>
											</div>
											<div className="flex items-center gap-4 text-xs">
												<span className="text-muted-foreground">
													总计{" "}
													<span className="font-medium text-foreground">
														{total}
													</span>
												</span>
												<span className="text-green-600">
													相同 <span className="font-medium">{same}</span>
												</span>
												<span className="text-red-600 dark:text-amber-400">
													不同 <span className="font-medium">{diff}</span>
												</span>
												{missing > 0 && (
													<span className="text-orange-600">
														缺失 <span className="font-medium">{missing}</span>
													</span>
												)}
											</div>
										</div>
									);
								})()}

								{/* 对比表格 */}
								<div className="text-xs">
									{(() => {
										const leftMap = new Map<string, string>(
											(leftState.editedParams || []).map((p) => [
												p.key,
												p.value,
											]),
										);
										const rightMap = new Map<string, string>(
											(rightState.editedParams || []).map((p) => [
												p.key,
												p.value,
											]),
										);
										let allKeys = Array.from(
											new Set<string>([
												...leftState.editedParams.map((p) => p.key),
												...rightState.editedParams.map((p) => p.key),
											]),
										);

										// 排序
										if (sortByKey) {
											allKeys = allKeys.sort((a, b) => {
												// 空key放在最后
												if (!a && !b) return 0;
												if (!a) return 1;
												if (!b) return -1;
												return a.localeCompare(b);
											});
										}

										// 构建rows数据
										const rowsData = allKeys.map((k) => {
											const lv = leftMap.get(k);
											const rv = rightMap.get(k);
											const same = lv === rv;
											return { k, lv, rv, same };
										});

										// 筛选
										const filteredRows = showOnlyDiff
											? rowsData.filter((row) => !row.same)
											: rowsData;

										const renderValue = (v: string | undefined) => {
											if (v === undefined) {
												return (
													<span className="text-muted-foreground">
														(missing)
													</span>
												);
											}
											if (v === "") {
												return (
													<span className="text-muted-foreground">(empty)</span>
												);
											}
											return v;
										};

										const rows = filteredRows.map((row, idx) => (
											<div
												key={row.k || `__empty_${idx}`}
												className={`grid grid-cols-12 gap-2 items-start py-1 px-2 rounded text-[12px] ${
													row.same
														? "bg-muted/30"
														: "bg-amber-50 dark:bg-amber-900/20"
												}`}
											>
												<div className="col-span-3 font-mono break-all">
													{row.k ? (
														row.k
													) : (
														<span className="text-muted-foreground">
															(empty)
														</span>
													)}
												</div>
												<div className="col-span-4 font-mono break-all">
													{renderValue(row.lv)}
												</div>
												<div className="col-span-4 font-mono break-all">
													{renderValue(row.rv)}
												</div>
												<div
													className={`col-span-1 text-[12px] text-right ${
														row.same
															? "text-green-600"
															: "text-red-600 dark:text-amber-400"
													}`}
												>
													{row.same ? "相同" : "不同"}
												</div>
											</div>
										));

										return (
											<div className="space-y-1">
												<div className="grid grid-cols-12 gap-2 text-[12px] text-muted-foreground px-2">
													<div className="col-span-3">Key</div>
													<div className="col-span-4">URL 1</div>
													<div className="col-span-4">URL 2</div>
													<div className="col-span-1 text-right">状态</div>
												</div>
												{rows.length ? (
													rows
												) : (
													<div className="text-muted-foreground text-xs px-2 py-1">
														{showOnlyDiff ? "无差异参数" : "无参数"}
													</div>
												)}
											</div>
										);
									})()}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</main>
		</div>
	);
}
