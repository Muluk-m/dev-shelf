import { GitCompare, RefreshCcw } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { BuiltinToolMeta } from "~/types/tool";
import type { Route } from "./+types/tools.json-diff";

export const toolMeta: BuiltinToolMeta = {
	id: "json-diff",
	name: "JSON Diff",
	description: "比较两个 JSON 对象并可视化差异",
	icon: "GitCompare",
	category: "builtin",
	tags: ["json", "diff", "compare"],
};

function safeJsonParse(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "JSON Diff | DevShelf" },
		{
			name: "description",
			content: "比较两个 JSON 对象并可视化差异",
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
					<span key={`ival-${i}`}>{renderNode(c, onlyDiff, level + 2)}</span>,
				);
				if (i !== items.length - 1) nodes.push(",\n");
			});
			nodes.push(`\n${pad(level)}]`);
			return <>{nodes}</>;
		}
	}
}

export default function JsonDiffTool() {
	const [left, setLeft] = useState<string>("");
	const [right, setRight] = useState<string>("");
	const [onlyDiff, setOnlyDiff] = useState<boolean>(false);

	const { node, errorLeft, errorRight } = useMemo(() => {
		let a: JsonValue = null;
		let b: JsonValue = null;
		let errL = "";
		let errR = "";
		try {
			a = left.trim() ? (JSON.parse(left) as JsonValue) : null;
		} catch (_e) {
			errL = "左侧 JSON 解析失败";
		}
		try {
			b = right.trim() ? (JSON.parse(right) as JsonValue) : null;
		} catch (_e) {
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

	const formatLeft = () => {
		try {
			const obj = left.trim() ? safeJsonParse(left) : null;
			setLeft(JSON.stringify(obj, null, 2));
		} catch {}
	};

	const formatRight = () => {
		try {
			const obj = right.trim() ? JSON.parse(right) : null;
			setRight(JSON.stringify(obj, null, 2));
		} catch {}
	};

	const swapInputs = () => {
		const temp = left;
		setLeft(right);
		setRight(temp);
	};

	return (
		<div className="bg-background flex flex-col min-h-[calc(100vh-4rem)]">
			<div className="container mx-auto px-4 py-4 flex-1 flex flex-col">
				<div className="max-w-7xl mx-auto w-full flex flex-col gap-6 flex-1">
					<ToolPageHeader
						icon={<GitCompare className="h-5 w-5" />}
						title="JSON Diff"
						description="比较两个 JSON 对象并查看差异"
					/>

					<div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
						<div className="flex flex-col gap-4 lg:w-1/2 flex-1 min-h-0">
							<Card className="flex-1 flex flex-col min-h-0">
								<CardHeader className="pb-3 flex-shrink-0">
									<CardTitle className="text-base flex items-center justify-between">
										<span>JSON A (原始)</span>
										<Button variant="ghost" size="sm" onClick={formatLeft}>
											格式化
										</Button>
									</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 flex flex-col pt-0 min-h-0">
									<Textarea
										value={left}
										onChange={(e) => setLeft(e.target.value)}
										placeholder="粘贴第一个 JSON..."
										className={`flex-1 font-mono text-sm resize-none min-h-[200px] ${
											errorLeft ? "border-destructive" : ""
										}`}
									/>
									{errorLeft && (
										<div className="text-destructive text-xs mt-2">
											{errorLeft}
										</div>
									)}
								</CardContent>
							</Card>

							<Card className="flex-1 flex flex-col min-h-0">
								<CardHeader className="pb-3 flex-shrink-0">
									<CardTitle className="text-base flex items-center justify-between">
										<span>JSON B (修改后)</span>
										<div className="flex gap-2">
											<Button variant="ghost" size="sm" onClick={formatRight}>
												格式化
											</Button>
											<Button variant="outline" size="sm" onClick={swapInputs}>
												<RefreshCcw className="h-3 w-3 mr-1" />
												交换
											</Button>
										</div>
									</CardTitle>
								</CardHeader>
								<CardContent className="flex-1 flex flex-col pt-0 min-h-0">
									<Textarea
										value={right}
										onChange={(e) => setRight(e.target.value)}
										placeholder="粘贴第二个 JSON..."
										className={`flex-1 font-mono text-sm resize-none min-h-[200px] ${
											errorRight ? "border-destructive" : ""
										}`}
									/>
									{errorRight && (
										<div className="text-destructive text-xs mt-2">
											{errorRight}
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						<Card className="lg:w-1/2 flex-1 flex flex-col min-h-0">
							<CardHeader className="pb-3 flex-shrink-0">
								<CardTitle className="text-base flex items-center justify-between">
									<span>差异结果</span>
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											仅显示差异
										</span>
										<Switch checked={onlyDiff} onCheckedChange={setOnlyDiff} />
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent className="flex-1 overflow-auto pt-0">
								<div className="flex gap-4 text-sm mb-4">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 bg-green-500/20 border border-green-500 rounded" />
										<span className="text-muted-foreground">新增</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded" />
										<span className="text-muted-foreground">删除</span>
									</div>
								</div>
								<pre
									className="text-sm overflow-auto leading-6 whitespace-pre-wrap break-words font-mono p-4 bg-muted/30 rounded-md"
									style={{
										fontFamily:
											"ui-monospace, SFMono-Regular, Menlo, monospace",
									}}
								>
									{rendered ?? (
										<span className="text-muted-foreground">
											在左侧输入两个 JSON 进行比较
										</span>
									)}
								</pre>
							</CardContent>
						</Card>
					</div>

					<style>{`
						.json-key { color: #6b7280; }
						.json-add { background: #16a34a22; color: #16a34a; padding: 0 2px; border-radius: 4px; }
						.json-del { background: #dc262622; color: #dc2626; padding: 0 2px; border-radius: 4px; }
						.json-eq { color: inherit; }
					`}</style>
				</div>
			</div>
		</div>
	);
}
