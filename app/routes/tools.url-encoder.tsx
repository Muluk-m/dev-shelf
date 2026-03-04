import { Check, Copy, Link, RefreshCw, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import type { BuiltinToolMeta } from "~/types/tool";
import type { Route } from "./+types/tools.url-encoder";

export const toolMeta: BuiltinToolMeta = {
	id: "url-encoder",
	name: "URL 编解码",
	description: "Encode and decode URLs with encodeURIComponent and decodeURIComponent",
	icon: "Link",
	category: "builtin",
	tags: ["url", "encode", "decode"],
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "URL Encoder/Decoder | DevShelf" },
		{
			name: "description",
			content:
				"Encode and decode URLs with encodeURIComponent and decodeURIComponent",
		},
	];
}

export default function URLEncoderPage() {
	const [mode, setMode] = useState<"encode" | "decode">("encode");
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState("");
	const [encodeComponent, setEncodeComponent] = useState(true);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!input.trim()) {
			setOutput("");
			setError("");
			return;
		}

		try {
			if (mode === "encode") {
				const result = encodeComponent
					? encodeURIComponent(input)
					: encodeURI(input);
				setOutput(result);
			} else {
				try {
					setOutput(decodeURIComponent(input));
				} catch {
					setOutput(decodeURI(input));
				}
			}
			setError("");
		} catch (err) {
			setError(`转换失败：${(err as Error).message}`);
			setOutput("");
		}
	}, [input, mode, encodeComponent]);

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
						icon={<Link className="h-5 w-5" />}
						title="URL 编解码工具"
						description="支持 URL 编码/解码、encodeURI 和 encodeURIComponent 两种模式，处理特殊字符和中文"
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
									<TabsTrigger value="encode">URL 编码</TabsTrigger>
									<TabsTrigger value="decode">URL 解码</TabsTrigger>
								</TabsList>

								<div className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-2 min-h-0 mt-4">
									<div className="flex flex-col space-y-3 min-h-0">
										<Label htmlFor="url-input" className="text-sm">
											{mode === "encode" ? "待编码文本" : "URL 编码字符串"}
										</Label>
										<Textarea
											id="url-input"
											value={input}
											onChange={(event) => setInput(event.target.value)}
											className="flex-1 font-mono text-sm resize-none"
											placeholder={
												mode === "encode"
													? "输入需要编码的 URL 或文本，例如：\nhttps://example.com/search?q=中文查询&type=all"
													: "输入需要解码的 URL 编码字符串，例如：\nhttps%3A//example.com/search%3Fq%3D%E4%B8%AD%E6%96%87%E6%9F%A5%E8%AF%A2"
											}
										/>

										{mode === "encode" && (
											<div className="flex items-center justify-between rounded-md border p-2">
												<div>
													<p className="text-sm font-medium">编码模式</p>
													<p className="text-xs text-muted-foreground">
														{encodeComponent
															? "encodeURIComponent - 编码所有特殊字符"
															: "encodeURI - 保留 URL 结构字符"}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Switch
														id="encode-component"
														checked={encodeComponent}
														onCheckedChange={setEncodeComponent}
													/>
													<Label htmlFor="encode-component" className="text-xs">
														Component
													</Label>
												</div>
											</div>
										)}
									</div>

									<div className="flex flex-col space-y-3 min-h-0">
										<Label htmlFor="url-output" className="text-sm">
											转换结果
										</Label>
										<Textarea
											id="url-output"
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
							<p>
								• <strong>encodeURIComponent</strong>
								：编码所有特殊字符，适用于查询参数、表单数据等。
							</p>
							<p>
								• <strong>encodeURI</strong>：保留 URL 结构字符（如
								:、/、?、#），适用于完整 URL 编码。
							</p>
							<p>• 解码时自动识别编码格式，优先使用 decodeURIComponent。</p>
							<p>• 支持中文、特殊符号和 emoji 的正确编解码。</p>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
