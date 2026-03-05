import { JSONPath } from "jsonpath-plus";
import {
	Braces,
	Copy,
	Download,
	Edit3,
	GitCompare,
	Search,
	Upload,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import type { BuiltinToolMeta } from "~/types/tool";
import type { Route } from "./+types/tools.json-formatter";

export const toolMeta: BuiltinToolMeta = {
	id: "json-formatter",
	name: "JSON 工具箱",
	description: "格式化、查询、对比和可视化 JSON 数据",
	icon: "Braces",
	category: "builtin",
	tags: ["json", "format", "validate", "query"],
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "JSON 工具箱 | DevShelf" },
		{
			name: "description",
			content: "格式化、查询、对比和可视化 JSON 数据",
		},
	];
}

// JSON diff types
type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [k: string]: JsonValue };

type DiffNode =
	| { type: "equal"; value: JsonValue }
	| { type: "added"; value: JsonValue }
	| { type: "removed"; value: JsonValue }
	| { type: "changed"; before: JsonValue; after: JsonValue }
	| { type: "object"; children: Record<string, DiffNode> }
	| { type: "array"; children: DiffNode[] };

function isObject(v: JsonValue): v is { [k: string]: JsonValue } {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function diffJson(a: JsonValue, b: JsonValue): DiffNode {
	if (Array.isArray(a) && Array.isArray(b)) {
		const len = Math.max(a.length, b.length);
		const children: DiffNode[] = [];
		for (let i = 0; i < len; i++) {
			if (i in a && i in b) children.push(diffJson(a[i], b[i]));
			else if (i in a) children.push({ type: "removed", value: a[i] });
			else children.push({ type: "added", value: b[i]! });
		}
		return { type: "array", children };
	}

	if (isObject(a) && isObject(b)) {
		const keys = Array.from(
			new Set([...Object.keys(a), ...Object.keys(b)]),
		).sort();
		const children: Record<string, DiffNode> = {};
		for (const k of keys) {
			if (k in a && k in b) children[k] = diffJson(a[k], b[k]);
			else if (k in a) children[k] = { type: "removed", value: a[k] };
			else children[k] = { type: "added", value: b[k] };
		}
		return { type: "object", children };
	}

	if (a === b) return { type: "equal", value: a };
	return { type: "changed", before: a, after: b };
}

function hasRenderable(n: DiffNode, onlyDiff: boolean): boolean {
	switch (n.type) {
		case "equal":
			return !onlyDiff;
		case "added":
		case "removed":
		case "changed":
			return true;
		case "object":
			return Object.values(n.children).some((c) => hasRenderable(c, onlyDiff));
		case "array":
			return n.children.some((c) => hasRenderable(c, onlyDiff));
	}
}

function renderDiffNode(
	n: DiffNode,
	onlyDiff: boolean,
	level: number,
): ReactNode {
	const pad = (n: number) => " ".repeat(n);
	const json = (v: JsonValue) => JSON.stringify(v, null, 2);

	switch (n.type) {
		case "equal":
			if (onlyDiff) return null;
			return <span className="json-eq">{json(n.value)}</span>;
		case "added":
			return <span className="json-add">{json(n.value)}</span>;
		case "removed":
			return <span className="json-del">{json(n.value)}</span>;
		case "changed":
			return (
				<>
					<span className="json-del">{json(n.before)}</span>{" "}
					<span className="json-add">{json(n.after)}</span>
				</>
			);
		case "object": {
			const entries = Object.entries(n.children).filter(([_, v]) =>
				hasRenderable(v, onlyDiff),
			);
			if (entries.length === 0) return onlyDiff ? null : "{}";
			const nodes: ReactNode[] = ["{\n"];
			entries.forEach(([k, v], idx) => {
				nodes.push(<span key={`pad-${idx}`}>{pad(level + 2)}</span>);
				nodes.push(
					<span key={`key-${idx}`} className="json-key">
						{JSON.stringify(k)}
					</span>,
				);
				nodes.push(": ");
				nodes.push(
					<span key={`val-${idx}`}>
						{renderDiffNode(v, onlyDiff, level + 2)}
					</span>,
				);
				if (idx !== entries.length - 1) nodes.push(",\n");
			});
			nodes.push(`\n${pad(level)}}`);
			return <>{nodes}</>;
		}
		case "array": {
			const items = n.children.filter((c) => hasRenderable(c, onlyDiff));
			if (items.length === 0) return onlyDiff ? null : "[]";
			const nodes: ReactNode[] = ["[\n"];
			items.forEach((c, i) => {
				nodes.push(<span key={`ipad-${i}`}>{pad(level + 2)}</span>);
				nodes.push(
					<span key={`ival-${i}`}>
						{renderDiffNode(c, onlyDiff, level + 2)}
					</span>,
				);
				if (i !== items.length - 1) nodes.push(",\n");
			});
			nodes.push(`\n${pad(level)}]`);
			return <>{nodes}</>;
		}
	}
}

// Client-only wrapper for ReactJson
function JsonViewer({ src, ...props }: any) {
	const [ReactJson, setReactJson] = useState<any>(null);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
		import("react-json-view").then((mod) => {
			setReactJson(() => mod.default);
		});
	}, []);

	if (!isClient || !ReactJson) {
		return (
			<div className="p-4 text-sm text-muted-foreground">Loading viewer...</div>
		);
	}

	return <ReactJson src={src} {...props} />;
}

export default function JsonFormatterPage() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [error, setError] = useState("");
	const [isEditingInput, setIsEditingInput] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);
	const [activeTab, setActiveTab] = useState("format");

	// JSONPath query state
	const [jsonPathQuery, setJsonPathQuery] = useState("");
	const [queryResult, setQueryResult] = useState<any>(null);
	const [queryError, setQueryError] = useState("");

	// Find & Replace state
	const [searchText, setSearchText] = useState("");
	const [replaceText, setReplaceText] = useState("");
	const [searchOptions, setSearchOptions] = useState({
		caseSensitive: false,
		regex: false,
		searchIn: "all" as "keys" | "values" | "all",
	});
	const [matchedCount, setMatchedCount] = useState(0);
	const [highlightedJson, setHighlightedJson] = useState("");

	// JSON Diff state
	const [leftJson, setLeftJson] = useState("");
	const [rightJson, setRightJson] = useState("");
	const [onlyShowDiff, setOnlyShowDiff] = useState(false);

	// Parse input JSON for tree view and query
	const parsedJson = useMemo(() => {
		if (!input.trim()) return null;
		try {
			return JSON.parse(input);
		} catch {
			return null;
		}
	}, [input]);

	// Initialize from URL params or clipboard
	useEffect(() => {
		const initializeInput = async () => {
			// 1. Check URL parameters first (priority)
			const jsonParam = searchParams.get("json") || searchParams.get("data");
			if (jsonParam) {
				try {
					// Try to decode and parse URL parameter
					const decoded = decodeURIComponent(jsonParam);
					// Validate it's valid JSON
					JSON.parse(decoded);
					setInput(decoded);
					setIsInitialized(true);
					return;
				} catch (err) {
					console.warn("Invalid JSON in URL parameter:", err);
				}
			}

			// 2. Try to read from clipboard if no URL param
			try {
				const clipboardText = await navigator.clipboard.readText();
				if (clipboardText.trim()) {
					// Try to parse as JSON
					JSON.parse(clipboardText);
					setInput(clipboardText);
				}
			} catch (err) {
				// Silently fail if clipboard access denied or invalid JSON
				console.debug("Could not read from clipboard:", err);
			} finally {
				setIsInitialized(true);
			}
		};

		if (!isInitialized) {
			initializeInput();
		}
	}, [searchParams, isInitialized]);

	// Auto-format JSON when input changes
	useEffect(() => {
		if (!input.trim()) {
			setOutput("");
			setError("");
			return;
		}

		try {
			const parsed = JSON.parse(input);
			const formatted = JSON.stringify(parsed, null, 2);
			setOutput(formatted);
			setError("");
		} catch (err) {
			setError(
				t("tools.jsonFormatter.error.parse", {
					message: (err as Error).message,
				}),
			);
			setOutput("");
		}
	}, [input]);

	// Execute JSONPath query
	useEffect(() => {
		if (!jsonPathQuery.trim() || !parsedJson) {
			setQueryResult(null);
			setQueryError("");
			return;
		}

		try {
			const result = JSONPath({ path: jsonPathQuery, json: parsedJson });
			setQueryResult(result);
			setQueryError("");
		} catch (err) {
			setQueryError(
				t("tools.jsonFormatter.error.query", {
					message: (err as Error).message,
				}),
			);
			setQueryResult(null);
		}
	}, [jsonPathQuery, parsedJson]);

	const minifyJson = () => {
		try {
			const parsed = JSON.parse(input);
			const minified = JSON.stringify(parsed);
			setOutput(minified);
			setError("");
		} catch (err) {
			setError(
				t("tools.jsonFormatter.error.parse", {
					message: (err as Error).message,
				}),
			);
			setOutput("");
		}
	};

	const copyToClipboard = async (text: string) => {
		if (text) {
			await navigator.clipboard.writeText(text);
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

	const triggerFileUpload = () => {
		if (typeof document !== "undefined") {
			document.getElementById("file-upload")?.click();
		}
	};

	const applyExampleQuery = (query: string) => {
		setJsonPathQuery(query);
	};

	// Find & Replace functions
	const performSearch = () => {
		if (!input.trim() || !searchText) {
			setMatchedCount(0);
			setHighlightedJson(input);
			return;
		}

		try {
			const parsed = JSON.parse(input);
			let count = 0;

			const searchInJson = (obj: any, path = ""): any => {
				if (typeof obj === "object" && obj !== null) {
					if (Array.isArray(obj)) {
						return obj.map((item, index) =>
							searchInJson(item, `${path}[${index}]`),
						);
					}
					const result: any = {};
					for (const [key, value] of Object.entries(obj)) {
						const newPath = path ? `${path}.${key}` : key;

						// Check if key matches
						if (searchOptions.searchIn !== "values") {
							if (matchesSearch(key)) {
								count++;
							}
						}

						// Check if value matches
						if (
							searchOptions.searchIn !== "keys" &&
							typeof value === "string"
						) {
							if (matchesSearch(value)) {
								count++;
							}
						}

						result[key] = searchInJson(value, newPath);
					}
					return result;
				}

				if (
					searchOptions.searchIn !== "keys" &&
					typeof obj === "string" &&
					matchesSearch(obj)
				) {
					count++;
				}

				return obj;
			};

			searchInJson(parsed);
			setMatchedCount(count);

			// Highlight matches in the formatted JSON
			const formatted = JSON.stringify(parsed, null, 2);
			setHighlightedJson(formatted);
		} catch {
			setMatchedCount(0);
			setHighlightedJson(input);
		}
	};

	const matchesSearch = (text: string): boolean => {
		if (searchOptions.regex) {
			try {
				const flags = searchOptions.caseSensitive ? "g" : "gi";
				const regex = new RegExp(searchText, flags);
				return regex.test(text);
			} catch {
				return false;
			}
		}

		const searchLower = searchOptions.caseSensitive
			? searchText
			: searchText.toLowerCase();
		const textLower = searchOptions.caseSensitive ? text : text.toLowerCase();
		return textLower.includes(searchLower);
	};

	const performReplace = (replaceAll = false) => {
		if (!input.trim() || !searchText) return;

		try {
			const parsed = JSON.parse(input);

			const replaceInJson = (obj: any): any => {
				if (typeof obj === "object" && obj !== null) {
					if (Array.isArray(obj)) {
						return obj.map((item) => replaceInJson(item));
					}

					const result: any = {};
					for (let [key, value] of Object.entries(obj)) {
						// Replace in key
						if (searchOptions.searchIn !== "values") {
							const newKey = replaceInString(key, replaceAll);
							key = newKey;
						}

						// Replace in value
						if (
							searchOptions.searchIn !== "keys" &&
							typeof value === "string"
						) {
							value = replaceInString(value, replaceAll);
						}

						result[key] = replaceInJson(value);
					}
					return result;
				}

				if (searchOptions.searchIn !== "keys" && typeof obj === "string") {
					return replaceInString(obj, replaceAll);
				}

				return obj;
			};

			const replaced = replaceInJson(parsed);
			const formatted = JSON.stringify(replaced, null, 2);
			setInput(formatted);
			performSearch(); // Update search results
		} catch {
			// Invalid JSON, do nothing
		}
	};

	const replaceInString = (text: string, replaceAll: boolean): string => {
		if (searchOptions.regex) {
			try {
				const flags = searchOptions.caseSensitive
					? replaceAll
						? "g"
						: ""
					: replaceAll
						? "gi"
						: "i";
				const regex = new RegExp(searchText, flags);
				return text.replace(regex, replaceText);
			} catch {
				return text;
			}
		}

		if (replaceAll) {
			if (searchOptions.caseSensitive) {
				return text.split(searchText).join(replaceText);
			}
			const regex = new RegExp(
				searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
				"gi",
			);
			return text.replace(regex, replaceText);
		}

		// Replace first occurrence
		const index = searchOptions.caseSensitive
			? text.indexOf(searchText)
			: text.toLowerCase().indexOf(searchText.toLowerCase());

		if (index === -1) return text;

		return (
			text.substring(0, index) +
			replaceText +
			text.substring(index + searchText.length)
		);
	};

	// Trigger search when search text or options change
	useEffect(() => {
		performSearch();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchText, searchOptions, input]);

	// Compute JSON diff
	const { diffNode, leftError, rightError } = useMemo(() => {
		if (!leftJson.trim() || !rightJson.trim()) {
			return {
				diffNode: null as DiffNode | null,
				leftError: "",
				rightError: "",
			};
		}

		let a: JsonValue = null;
		let b: JsonValue = null;
		let errL = "";
		let errR = "";

		try {
			a = JSON.parse(leftJson) as JsonValue;
		} catch (_e) {
			errL = t("tools.jsonFormatter.error.leftParse");
		}

		try {
			b = JSON.parse(rightJson) as JsonValue;
		} catch (_e) {
			errR = t("tools.jsonFormatter.error.rightParse");
		}

		if (errL || errR) {
			return {
				diffNode: null as DiffNode | null,
				leftError: errL,
				rightError: errR,
			};
		}

		return { diffNode: diffJson(a, b), leftError: "", rightError: "" };
	}, [leftJson, rightJson]);

	const renderedDiff = useMemo(() => {
		if (!diffNode) return null;
		return renderDiffNode(diffNode, onlyShowDiff, 0);
	}, [diffNode, onlyShowDiff]);

	// Quick action: copy input to diff left
	const copyInputToDiffLeft = () => {
		if (input.trim()) {
			setLeftJson(input);
			setActiveTab("diff");
		}
	};

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
				<div className="max-w-7xl mx-auto flex flex-col h-full space-y-4 w-full">
					<ToolPageHeader
						icon={<Braces className="h-5 w-5" />}
						title={t("tools.jsonFormatter.title")}
						description={t("tools.jsonFormatter.description")}
					/>

					{/* 主功能 Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="flex-1 flex flex-col min-h-0"
					>
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="format" className="flex items-center gap-2">
								<Edit3 className="h-4 w-4" />
								<span className="hidden sm:inline">
									{t("tools.jsonFormatter.tabs.format")}
								</span>
							</TabsTrigger>
							<TabsTrigger value="query" className="flex items-center gap-2">
								<Search className="h-4 w-4" />
								<span className="hidden sm:inline">
									{t("tools.jsonFormatter.tabs.query")}
								</span>
							</TabsTrigger>
							<TabsTrigger value="search" className="flex items-center gap-2">
								<Search className="h-4 w-4" />
								<span className="hidden sm:inline">
									{t("tools.jsonFormatter.tabs.search")}
								</span>
							</TabsTrigger>
							<TabsTrigger value="diff" className="flex items-center gap-2">
								<GitCompare className="h-4 w-4" />
								<span className="hidden sm:inline">
									{t("tools.jsonFormatter.tabs.diff")}
								</span>
							</TabsTrigger>
						</TabsList>

						{/* Tab 1: Format */}
						<TabsContent
							value="format"
							className="flex-1 flex flex-col min-h-0 space-y-4"
						>
							<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
								{/* 输入区域 */}
								<Card className="flex flex-col min-h-0">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center justify-between text-base">
											<span>{t("tools.jsonFormatter.input.title")}</span>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setIsEditingInput(!isEditingInput)}
												>
													<Edit3 className="h-4 w-4 mr-2" />
													{isEditingInput
														? t("tools.jsonFormatter.input.preview")
														: t("tools.jsonFormatter.input.edit")}
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={triggerFileUpload}
												>
													<Upload className="h-4 w-4 mr-2" />
													{t("tools.jsonFormatter.input.upload")}
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
									<CardContent className="flex-1 flex flex-col pt-0 space-y-3 min-h-0">
										{isEditingInput ? (
											<Textarea
												value={input}
												onChange={(e) => setInput(e.target.value)}
												placeholder={t("tools.jsonFormatter.input.placeholder")}
												className="flex-1 font-mono text-sm resize-none min-h-[400px]"
											/>
										) : (
											<div className="flex-1 relative rounded-md overflow-hidden border min-h-[400px]">
												<SyntaxHighlighter
													language="json"
													style={vscDarkPlus}
													customStyle={{
														margin: 0,
														fontSize: "0.875rem",
														lineHeight: "1.5",
														height: "100%",
													}}
													showLineNumbers
												>
													{input || "{}"}
												</SyntaxHighlighter>
											</div>
										)}
										<div className="flex gap-2">
											<Button
												onClick={minifyJson}
												variant="outline"
												className="flex-1"
												disabled={!input.trim()}
											>
												{t("tools.jsonFormatter.input.minify")}
											</Button>
											<Button
												onClick={copyInputToDiffLeft}
												variant="outline"
												className="flex-1"
												disabled={!input.trim()}
											>
												<GitCompare className="h-4 w-4 mr-2" />
												{t("tools.jsonFormatter.input.compare")}
											</Button>
										</div>
									</CardContent>
								</Card>

								{/* 输出区域 */}
								<Card className="flex flex-col min-h-0">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center justify-between text-base">
											<span>{t("tools.jsonFormatter.output.title")}</span>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => copyToClipboard(output)}
													disabled={!output}
												>
													<Copy className="h-4 w-4 mr-2" />
													{t("tools.jsonFormatter.output.copy")}
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={downloadJson}
													disabled={!output}
												>
													<Download className="h-4 w-4 mr-2" />
													{t("tools.jsonFormatter.output.download")}
												</Button>
											</div>
										</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 overflow-auto">
										{error && (
											<div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm mb-3">
												{error}
											</div>
										)}
										{parsedJson ? (
											<div className="p-4 bg-muted/30 rounded-md">
												<JsonViewer
													src={parsedJson}
													theme="monokai"
													iconStyle="triangle"
													displayDataTypes={false}
													displayObjectSize={true}
													enableClipboard={true}
													collapsed={2}
													name={false}
													style={{
														backgroundColor: "transparent",
														fontSize: "0.875rem",
													}}
												/>
											</div>
										) : (
											<div className="flex items-center justify-center h-full text-muted-foreground">
												<p>{t("tools.jsonFormatter.output.placeholder")}</p>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Tab 2: JSONPath Query */}
						<TabsContent
							value="query"
							className="flex-1 flex flex-col min-h-0 space-y-4"
						>
							<Card className="flex-shrink-0">
								<CardHeader className="pb-3">
									<CardTitle className="text-base">
										{t("tools.jsonFormatter.query.title")}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="jsonpath-input">
											{t("tools.jsonFormatter.query.label")}
										</Label>
										<Input
											id="jsonpath-input"
											value={jsonPathQuery}
											onChange={(e) => setJsonPathQuery(e.target.value)}
											placeholder="例如: $.users[0].name"
											className="font-mono"
										/>
									</div>

									{queryError && (
										<div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm">
											{queryError}
										</div>
									)}

									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">
											{t("tools.jsonFormatter.query.examples")}
										</Label>
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => applyExampleQuery("$")}
											>
												$ - 根对象
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => applyExampleQuery("$..*")}
											>
												$..* - 所有元素
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => applyExampleQuery("$..name")}
											>
												$..name - 所有 name 字段
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => applyExampleQuery("$[0]")}
											>
												$[0] - 第一个元素
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="flex-1 flex flex-col min-h-0">
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center justify-between text-base">
										<span>{t("tools.jsonFormatter.query.result")}</span>
										{queryResult && (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													copyToClipboard(JSON.stringify(queryResult, null, 2))
												}
											>
												<Copy className="h-4 w-4 mr-2" />
												{t("tools.jsonFormatter.query.copy")}
											</Button>
										)}
									</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 overflow-auto">
									{queryResult !== null ? (
										<div className="p-4 bg-muted/30 rounded-md">
											<JsonViewer
												src={queryResult}
												theme="monokai"
												iconStyle="triangle"
												displayDataTypes={false}
												enableClipboard={true}
												collapsed={1}
												name={false}
												style={{
													backgroundColor: "transparent",
													fontSize: "0.875rem",
												}}
											/>
										</div>
									) : (
										<div className="flex items-center justify-center h-full text-muted-foreground">
											<p>{t("tools.jsonFormatter.query.resultPlaceholder")}</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Tab 4: Find & Replace */}
						<TabsContent
							value="search"
							className="flex-1 flex flex-col min-h-0 space-y-4"
						>
							<Card className="flex-shrink-0">
								<CardHeader className="pb-3">
									<CardTitle className="text-base">
										{t("tools.jsonFormatter.search.title")}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="search-input">
												{t("tools.jsonFormatter.search.findLabel")}
											</Label>
											<Input
												id="search-input"
												value={searchText}
												onChange={(e) => setSearchText(e.target.value)}
												placeholder={t(
													"tools.jsonFormatter.search.findPlaceholder",
												)}
												className="font-mono"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="replace-input">
												{t("tools.jsonFormatter.search.replaceLabel")}
											</Label>
											<Input
												id="replace-input"
												value={replaceText}
												onChange={(e) => setReplaceText(e.target.value)}
												placeholder={t(
													"tools.jsonFormatter.search.replacePlaceholder",
												)}
												className="font-mono"
											/>
										</div>
									</div>

									<div className="space-y-3">
										<div className="flex flex-wrap gap-4">
											<div className="flex items-center space-x-2">
												<Checkbox
													id="case-sensitive"
													checked={searchOptions.caseSensitive}
													onCheckedChange={(checked) =>
														setSearchOptions({
															...searchOptions,
															caseSensitive: checked as boolean,
														})
													}
												/>
												<Label
													htmlFor="case-sensitive"
													className="cursor-pointer"
												>
													{t("tools.jsonFormatter.search.caseSensitive")}
												</Label>
											</div>

											<div className="flex items-center space-x-2">
												<Checkbox
													id="regex"
													checked={searchOptions.regex}
													onCheckedChange={(checked) =>
														setSearchOptions({
															...searchOptions,
															regex: checked as boolean,
														})
													}
												/>
												<Label htmlFor="regex" className="cursor-pointer">
													{t("tools.jsonFormatter.search.regex")}
												</Label>
											</div>
										</div>

										<div className="space-y-2">
											<Label>{t("tools.jsonFormatter.search.scope")}</Label>
											<RadioGroup
												value={searchOptions.searchIn}
												onValueChange={(value) =>
													setSearchOptions({
														...searchOptions,
														searchIn: value as "keys" | "values" | "all",
													})
												}
											>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="all" id="search-all" />
													<Label
														htmlFor="search-all"
														className="cursor-pointer"
													>
														{t("tools.jsonFormatter.search.scopeAll")}
													</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="keys" id="search-keys" />
													<Label
														htmlFor="search-keys"
														className="cursor-pointer"
													>
														{t("tools.jsonFormatter.search.scopeKeys")}
													</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="values" id="search-values" />
													<Label
														htmlFor="search-values"
														className="cursor-pointer"
													>
														{t("tools.jsonFormatter.search.scopeValues")}
													</Label>
												</div>
											</RadioGroup>
										</div>
									</div>

									<div className="flex items-center justify-between">
										<div className="text-sm text-muted-foreground">
											{t("tools.jsonFormatter.search.matchCount", {
												count: matchedCount,
											})}
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => performReplace(false)}
												disabled={!searchText || matchedCount === 0}
											>
												{t("tools.jsonFormatter.search.replace")}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => performReplace(true)}
												disabled={!searchText || matchedCount === 0}
											>
												{t("tools.jsonFormatter.search.replaceAll")}
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card className="flex-1 flex flex-col min-h-0">
								<CardHeader className="pb-3">
									<CardTitle className="text-base">
										{t("tools.jsonFormatter.search.previewTitle")}
									</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 overflow-auto">
									{highlightedJson ? (
										<div className="relative rounded-md overflow-hidden border">
											<SyntaxHighlighter
												language="json"
												style={vscDarkPlus}
												customStyle={{
													margin: 0,
													fontSize: "0.875rem",
													lineHeight: "1.5",
												}}
												showLineNumbers
											>
												{highlightedJson}
											</SyntaxHighlighter>
										</div>
									) : (
										<div className="flex items-center justify-center h-full text-muted-foreground">
											<p>
												{t("tools.jsonFormatter.search.previewPlaceholder")}
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Tab 4: JSON Diff */}
						<TabsContent
							value="diff"
							className="flex-1 flex flex-col min-h-0 space-y-4"
						>
							<div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
								{/* Left JSON Input */}
								<Card className="flex flex-col min-h-0">
									<CardHeader className="pb-3">
										<CardTitle className="text-base">
											{t("tools.jsonFormatter.diff.leftTitle")}
										</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 flex flex-col pt-0 space-y-3 min-h-0">
										<Textarea
											value={leftJson}
											onChange={(e) => setLeftJson(e.target.value)}
											placeholder={t(
												"tools.jsonFormatter.diff.leftPlaceholder",
											)}
											className={`flex-1 font-mono text-sm resize-none min-h-[300px] ${
												leftError ? "border-destructive" : ""
											}`}
										/>
										{leftError && (
											<div className="text-destructive text-xs">
												{leftError}
											</div>
										)}
									</CardContent>
								</Card>

								{/* Right JSON Input */}
								<Card className="flex flex-col min-h-0">
									<CardHeader className="pb-3">
										<CardTitle className="text-base">
											{t("tools.jsonFormatter.diff.rightTitle")}
										</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 flex flex-col pt-0 space-y-3 min-h-0">
										<Textarea
											value={rightJson}
											onChange={(e) => setRightJson(e.target.value)}
											placeholder={t(
												"tools.jsonFormatter.diff.rightPlaceholder",
											)}
											className={`flex-1 font-mono text-sm resize-none min-h-[300px] ${
												rightError ? "border-destructive" : ""
											}`}
										/>
										{rightError && (
											<div className="text-destructive text-xs">
												{rightError}
											</div>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Diff Result */}
							<Card className="flex-1 flex flex-col min-h-0">
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center justify-between text-base">
										<span>{t("tools.jsonFormatter.diff.result")}</span>
										<div className="flex items-center gap-2">
											<span className="text-sm text-muted-foreground">
												{t("tools.jsonFormatter.diff.onlyDiff")}
											</span>
											<Switch
												checked={onlyShowDiff}
												onCheckedChange={setOnlyShowDiff}
											/>
										</div>
									</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 overflow-auto">
									{renderedDiff ? (
										<div className="space-y-4">
											<div className="flex gap-4 text-sm">
												<div className="flex items-center gap-2">
													<div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded" />
													<span>{t("tools.jsonFormatter.diff.added")}</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded" />
													<span>{t("tools.jsonFormatter.diff.removed")}</span>
												</div>
											</div>

											<pre
												className="text-sm overflow-auto leading-6 whitespace-pre-wrap break-words font-mono p-4 bg-muted/30 rounded-md"
												style={{
													fontFamily:
														"ui-monospace, SFMono-Regular, Menlo, monospace",
												}}
											>
												{renderedDiff}
											</pre>
										</div>
									) : (
										<div className="flex items-center justify-center h-full text-muted-foreground">
											<p>{t("tools.jsonFormatter.diff.placeholder")}</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>

			{/* CSS styles for diff highlighting */}
			<style>{`
				.json-key { color: #6b7280; }
				.json-add { background: #16a34a22; color: #16a34a; padding: 0 2px; border-radius: 4px; }
				.json-del { background: #dc262622; color: #dc2626; padding: 0 2px; border-radius: 4px; text-decoration: line-through; }
				.json-eq { color: inherit; }
			`}</style>
		</div>
	);
}
