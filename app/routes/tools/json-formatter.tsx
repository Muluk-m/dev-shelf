import { Copy, Download, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";

export default function JsonFormatterPage() {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState("");

	const formatJson = () => {
		try {
			const parsed = JSON.parse(input);
			const formatted = JSON.stringify(parsed, null, 2);
			setOutput(formatted);
			setError("");
		} catch (err) {
			setError(`JSON 格式错误: ${(err as Error).message}`);
			setOutput("");
		}
	};

	const minifyJson = () => {
		try {
			const parsed = JSON.parse(input);
			const minified = JSON.stringify(parsed);
			setOutput(minified);
			setError("");
		} catch (err) {
			setError(`JSON 格式错误: ${(err as Error).message}`);
			setOutput("");
		}
	};

	const copyToClipboard = async () => {
		if (output) {
			await navigator.clipboard.writeText(output);
		}
	};

	const downloadJson = () => {
		if (output) {
			const blob = new Blob([output], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "formatted.json";
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				setInput(content);
			};
			reader.readAsText(file);
		}
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h1 className="text-3xl font-bold">JSON 格式化工具</h1>
				<p className="text-muted-foreground mt-2">
					格式化、压缩和验证 JSON 数据，支持语法高亮和错误检测
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 输入区域 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>输入 JSON</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										document.getElementById("file-upload")?.click()
									}
								>
									<Upload className="h-4 w-4 mr-2" />
									上传文件
								</Button>
								<input
									id="file-upload"
									type="file"
									accept=".json,.txt"
									onChange={handleFileUpload}
									className="hidden"
								/>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="在此输入或粘贴 JSON 数据..."
							className="min-h-[400px] font-mono"
						/>
						<div className="flex gap-2 mt-4">
							<Button onClick={formatJson} className="flex-1">
								格式化
							</Button>
							<Button onClick={minifyJson} variant="outline" className="flex-1">
								压缩
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* 输出区域 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>格式化结果</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={copyToClipboard}
									disabled={!output}
								>
									<Copy className="h-4 w-4 mr-2" />
									复制
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={downloadJson}
									disabled={!output}
								>
									<Download className="h-4 w-4 mr-2" />
									下载
								</Button>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						{error && (
							<div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
								{error}
							</div>
						)}
						<Textarea
							value={output}
							readOnly
							placeholder="格式化后的 JSON 将显示在这里..."
							className="min-h-[400px] font-mono"
						/>
					</CardContent>
				</Card>
			</div>

			{/* 使用说明 */}
			<Card>
				<CardHeader>
					<CardTitle>使用说明</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="format" className="w-full">
						<TabsList>
							<TabsTrigger value="format">格式化</TabsTrigger>
							<TabsTrigger value="minify">压缩</TabsTrigger>
							<TabsTrigger value="validate">验证</TabsTrigger>
						</TabsList>
						<TabsContent value="format" className="mt-4">
							<p className="text-sm text-muted-foreground">
								将压缩的 JSON 数据格式化为易读的形式，添加适当的缩进和换行。
							</p>
						</TabsContent>
						<TabsContent value="minify" className="mt-4">
							<p className="text-sm text-muted-foreground">
								移除 JSON 中的所有空白字符，生成最小化的 JSON 字符串。
							</p>
						</TabsContent>
						<TabsContent value="validate" className="mt-4">
							<p className="text-sm text-muted-foreground">
								验证 JSON 数据的语法是否正确，如有错误会显示具体的错误信息。
							</p>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
