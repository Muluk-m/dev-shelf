import { Binary, Check, Copy, RefreshCw, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import type { BuiltinToolMeta } from "~/types/tool";
import type { Route } from "./+types/tools.base64-converter";

export const toolMeta: BuiltinToolMeta = {
	id: "base64-converter",
	name: "Base64 编解码",
	description: "Encode and decode Base64 data with customizable options",
	icon: "Binary",
	category: "builtin",
	tags: ["base64", "encode", "decode"],
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Base64 Encoder/Decoder | DevShelf" },
		{
			name: "description",
			content: "Encode and decode Base64 data with customizable options",
		},
	];
}

const encodeBase64 = (
	value: string,
	wrapLines: boolean,
	lineLength: number,
) => {
	const encoder = new TextEncoder();
	const bytes = encoder.encode(value);
	let binary = "";
	bytes.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});
	let base64 = btoa(binary);

	if (wrapLines && lineLength > 0) {
		const regex = new RegExp(`(.{${lineLength}})`, "g");
		base64 = base64.replace(regex, "$1\n").trim();
	}

	return base64;
};

const decodeBase64 = (value: string) => {
	const cleaned = value.replace(/\s+/g, "");
	const binary = atob(cleaned);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	return new TextDecoder().decode(bytes);
};

export default function Base64ConverterPage() {
	const [mode, setMode] = useState<"encode" | "decode">("encode");
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState("");
	const [wrapLines, setWrapLines] = useState(true);
	const [lineLength, setLineLength] = useState("76");
	const [copied, setCopied] = useState(false);

	// Auto-convert when input, mode, or encoding options change
	useEffect(() => {
		if (!input.trim()) {
			setOutput("");
			setError("");
			return;
		}

		try {
			if (mode === "encode") {
				const parsedLength = Number.parseInt(lineLength, 10);
				setOutput(
					encodeBase64(
						input,
						wrapLines,
						Number.isNaN(parsedLength) ? 76 : parsedLength,
					),
				);
			} else {
				setOutput(decodeBase64(input));
			}
			setError("");
		} catch (err) {
			setError(`转换失败：${(err as Error).message}`);
			setOutput("");
		}
	}, [input, mode, wrapLines, lineLength]);

	const handleSwap = () => {
		setInput(output);
		setOutput(input);
		setError("");
		setMode((prev) => (prev === "encode" ? "decode" : "encode"));
	};

	const handleCopy = async () => {
		if (!output) return;
		try {
			await navigator.clipboard.writeText(output);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			setError(`复制失败：${(err as Error).message}`);
		}
	};

	const reset = () => {
		setInput("");
		setOutput("");
		setError("");
		setCopied(false);
	};

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-7xl mx-auto flex flex-col h-full space-y-3">
					<ToolPageHeader
						icon={<Binary className="h-5 w-5" />}
						title="Base64 编解码工具"
						description="支持文本编码/解码、按列换行以及结果一键复制，方便处理日志和令牌"
					/>

					<Card className="flex-1 flex flex-col min-h-0">
						<CardHeader className="pb-3">
							<CardTitle className="flex flex-wrap items-center justify-between gap-4 text-base">
								<span>转换面板</span>
								<div className="flex items-center gap-2">
									<Button variant="outline" size="sm" onClick={handleSwap}>
										<Repeat className="mr-2 h-4 w-4" />
										交换输入与输出
									</Button>
									<Button variant="outline" size="sm" onClick={reset}>
										<RefreshCw className="mr-2 h-4 w-4" />
										清空
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 flex flex-col space-y-4">
							<Tabs
								value={mode}
								onValueChange={(value) => {
									setMode(value as "encode" | "decode");
									setOutput("");
									setError("");
								}}
								className="flex-1 flex flex-col"
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="encode">Base64 编码</TabsTrigger>
									<TabsTrigger value="decode">Base64 解码</TabsTrigger>
								</TabsList>

								<div className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-2 min-h-0 mt-4">
									<div className="flex flex-col space-y-3 min-h-0">
										<Label htmlFor="base64-input" className="text-sm">
											{mode === "encode" ? "待编码文本" : "Base64 字符串"}
										</Label>
										<Textarea
											id="base64-input"
											value={input}
											onChange={(event) => setInput(event.target.value)}
											className="flex-1 font-mono text-sm resize-none"
											placeholder={
												mode === "encode"
													? "粘贴需要编码的内容，例如 JSON、日志或明文"
													: "粘贴 Base64 字符串，例如 token、配置或日志片段"
											}
										/>

										{mode === "encode" && (
											<div className="flex items-center justify-between rounded-md border p-2">
												<div>
													<p className="text-sm font-medium">启用换行</p>
													<p className="text-xs text-muted-foreground">
														超过指定列长后自动换行
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Switch
														id="wrap-lines"
														checked={wrapLines}
														onCheckedChange={setWrapLines}
													/>
													<Input
														type="number"
														min={4}
														max={120}
														value={lineLength}
														onChange={(event) =>
															setLineLength(event.target.value)
														}
														disabled={!wrapLines}
														className="w-16 text-sm"
													/>
												</div>
											</div>
										)}
									</div>

									<div className="flex flex-col space-y-3 min-h-0">
										<Label htmlFor="base64-output" className="text-sm">
											转换结果
										</Label>
										<Textarea
											id="base64-output"
											value={output}
											readOnly
											className="flex-1 font-mono text-sm resize-none"
											placeholder="结果将在此显示"
										/>

										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={handleCopy}
												disabled={!output}
												className="flex-1"
											>
												{copied ? (
													<>
														<Check className="mr-2 h-4 w-4 text-green-600" />
														已复制
													</>
												) : (
													<>
														<Copy className="mr-2 h-4 w-4" />
														复制结果
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							</Tabs>

							{error && (
								<div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{error}
								</div>
							)}
						</CardContent>
					</Card>

					{/* 使用提示 - 紧凑版 */}
					<Card className="flex-shrink-0">
						<CardContent className="pt-3 space-y-1 text-xs text-muted-foreground">
							<p>• 编码/解码均采用 UTF-8，可处理多语言字符和 emoji。</p>
							<p>• 解码前自动移除空白字符，方便从日志、配置中直接粘贴。</p>
							<p>
								• 处理 JWT、URL Safe Base64 时，可在结果中手动替换 `+` `/` `=`。
							</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
