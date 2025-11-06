import { safeJsonParse } from "@qlj/common-utils/common";
import { Edit3 } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/json-diff";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "JSON Diff | DevTools Platform" },
		{
			name: "description",
			content: "Compare and visualize differences between JSON objects",
		},
	];
}

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

function diff(a: JsonValue, b: JsonValue): DiffNode {
	if (Array.isArray(a) && Array.isArray(b)) {
		const len = Math.max(a.length, b.length);
		const children: DiffNode[] = [];
		for (let i = 0; i < len; i++) {
			if (i in a && i in b) children.push(diff(a[i], b[i]));
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
			if (k in a && k in b) children[k] = diff(a[k], b[k]);
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

function renderNode(n: DiffNode, onlyDiff: boolean, level: number): ReactNode {
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
					<span key={`val-${idx}`}>{renderNode(v, onlyDiff, level + 2)}</span>,
				);
				if (idx !== entries.length - 1) nodes.push(",\n");
			});
			nodes.push("\n" + pad(level) + "}");
			return <>{nodes}</>;
		}
		case "array": {
			const items = n.children.filter((c) => hasRenderable(c, onlyDiff));
			if (items.length === 0) return onlyDiff ? null : "[]";
			const nodes: ReactNode[] = ["[\n"];
			items.forEach((c, i) => {
				nodes.push(<span key={`ipad-${i}`}>{pad(level + 2)}</span>);
				nodes.push(
					<span key={`ival-${i}`}>{renderNode(c, onlyDiff, level + 2)}</span>,
				);
				if (i !== items.length - 1) nodes.push(",\n");
			});
			nodes.push("\n" + pad(level) + "]");
			return <>{nodes}</>;
		}
	}
}

export default function JsonDiffTool() {
	const [left, setLeft] = useState<string>("");
	const [right, setRight] = useState<string>("");
	const [onlyDiff, setOnlyDiff] = useState<boolean>(false);
	const [isEditingLeft, setIsEditingLeft] = useState<boolean>(true);
	const [isEditingRight, setIsEditingRight] = useState<boolean>(true);

	const { node, errorLeft, errorRight } = useMemo(() => {
		let a: JsonValue = null;
		let b: JsonValue = null;
		let errL = "";
		let errR = "";
		try {
			a = left.trim() ? (JSON.parse(left) as JsonValue) : null;
		} catch (e) {
			errL = "左侧 JSON 解析失败";
		}
		try {
			b = right.trim() ? (JSON.parse(right) as JsonValue) : null;
		} catch (e) {
			errR = "右侧 JSON 解析失败";
		}

		if (errL || errR)
			return {
				node: null as DiffNode | null,
				errorLeft: errL,
				errorRight: errR,
			};
		return { node: diff(a, b), errorLeft: "", errorRight: "" };
	}, [left, right]);

	const rendered = useMemo(() => {
		if (!node) return null;
		return renderNode(node, onlyDiff, 0);
	}, [node, onlyDiff]);

	return (
		<div className="bg-background flex flex-col">
			<main className="container mx-auto px-4 py-4 flex-1 flex flex-col">
				<div className="w-full flex flex-col gap-6">
					<div className="space-y-1">
						<h1 className="text-2xl font-bold">JSON diff</h1>
						<p className="text-sm text-muted-foreground">
							比较两个 JSON 对象并查看差异
						</p>
					</div>

					<div className="flex content-start gap-4">
						<Card className="w-[20vw] flex-shrink-0 flex-grow-0">
							<CardContent className="pt-4">
								<div className="flex items-center justify-between mb-4">
									<div className="text-sm text-muted-foreground">
										Your first JSON
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsEditingLeft(!isEditingLeft)}
										>
											<Edit3 className="h-3 w-3 mr-1" />
											{isEditingLeft ? "预览" : "编辑"}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												try {
													const obj = left.trim() ? safeJsonParse(left) : null;
													setLeft(JSON.stringify(obj, null, 2));
												} catch {}
											}}
										>
											格式化
										</Button>
									</div>
								</div>
								{isEditingLeft ? (
									<Textarea
										rows={18}
										value={left}
										onChange={(e) => setLeft(e.target.value)}
										placeholder="Paste your first JSON here..."
										className={`${
											errorLeft ? "border-destructive" : ""
										} font-mono max-h-[70vh] overflow-y-auto overflow-x-auto break-words whitespace-pre-wrap resize-y`}
									/>
								) : (
									<div className="relative rounded-md overflow-hidden border max-h-[70vh] overflow-y-auto">
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
											{left || "{}"}
										</SyntaxHighlighter>
									</div>
								)}
								{errorLeft && (
									<div className="text-destructive text-xs mt-2">{errorLeft}</div>
								)}
							</CardContent>
						</Card>

						<Card className="w-[20vw] flex-shrink-0 flex-grow-0">
							<CardContent className="pt-4">
								<div className="flex items-center justify-between mb-4">
									<div className="text-sm text-muted-foreground">
										Your JSON to compare
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setIsEditingRight(!isEditingRight)}
										>
											<Edit3 className="h-3 w-3 mr-1" />
											{isEditingRight ? "预览" : "编辑"}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												try {
													const obj = right.trim() ? JSON.parse(right) : null;
													setRight(JSON.stringify(obj, null, 2));
												} catch {}
											}}
										>
											格式化
										</Button>
									</div>
								</div>
								{isEditingRight ? (
									<Textarea
										rows={18}
										value={right}
										onChange={(e) => setRight(e.target.value)}
										placeholder="Paste your JSON to compare here..."
										className={`${
											errorRight ? "border-destructive" : ""
										} font-mono max-h-[70vh] overflow-y-auto overflow-x-auto break-words whitespace-pre-wrap resize-y`}
									/>
								) : (
									<div className="relative rounded-md overflow-hidden border max-h-[70vh] overflow-y-auto">
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
											{right || "{}"}
										</SyntaxHighlighter>
									</div>
								)}
								{errorRight && (
									<div className="text-destructive text-xs mt-2">{errorRight}</div>
								)}
							</CardContent>
						</Card>

						<Card className="lg:sticky lg:top-6 w-[30vw] flex-shrink-0 flex-grow-0">
							<CardContent className="pt-4">
								<div className="flex items-center justify-between mb-4">
									<div className="text-sm text-muted-foreground">结果</div>
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											Only show differences
										</span>
										<Switch checked={onlyDiff} onCheckedChange={setOnlyDiff} />
									</div>
								</div>
								<pre
									className="text-sm overflow-auto leading-6 max-h-[70vh] whitespace-pre-wrap break-words font-mono max-w-full"
									style={{
										fontFamily:
											"ui-monospace, SFMono-Regular, Menlo, monospace",
									}}
								>
									{rendered ?? (
										<span className="text-muted-foreground">{`{ }`}</span>
									)}
								</pre>
							</CardContent>
						</Card>
					</div>

					{/* inline styles for coloring */}
					<style>{`
            .json-key { color: #6b7280; }
            .json-add { background: #16a34a22; color: #16a34a; padding: 0 2px; border-radius: 4px; }
            .json-del { background: #dc262622; color: #dc2626; padding: 0 2px; border-radius: 4px; }
            .json-eq { color: inherit; }
          `}</style>
				</div>
			</main>
		</div>
	);
}
