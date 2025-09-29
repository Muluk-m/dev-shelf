import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";

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
      new Set([...Object.keys(a), ...Object.keys(b)])
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

function highlightJson(node: DiffNode, onlyDiff: boolean, indent = 0): string {
  const pad = (n: number) => " ".repeat(n);
  const color = (t: string, cls: string) => `<span class="${cls}">${t}</span>`;

  const render = (n: DiffNode, level: number): string => {
    switch (n.type) {
      case "equal":
        if (onlyDiff) return "";
        return color(JSON.stringify(n.value, null, 2), "json-eq");
      case "added":
        return color(JSON.stringify(n.value, null, 2), "json-add");
      case "removed":
        return color(JSON.stringify(n.value, null, 2), "json-del");
      case "changed":
        return [
          color(JSON.stringify(n.before, null, 2), "json-del"),
          color(JSON.stringify(n.after, null, 2), "json-add"),
        ].join(" ");
      case "object": {
        const entries = Object.entries(n.children)
          .map(([k, v]) => {
            const inner = render(v, level + 2);
            if (onlyDiff && !inner) return "";
            return `${pad(level + 2)}${color(
              JSON.stringify(k),
              "json-key"
            )}: ${inner}`;
          })
          .filter(Boolean)
          .join(",\n");
        if (!entries) return onlyDiff ? "" : "{}";
        return `{"\n${entries}\n${pad(level)}}`;
      }
      case "array": {
        const items = n.children
          .map((c) => {
            const inner = render(c, level + 2);
            if (onlyDiff && !inner) return "";
            return `${pad(level + 2)}${inner}`;
          })
          .filter(Boolean)
          .join(",\n");
        if (!items) return onlyDiff ? "" : "[]";
        return `[\n${items}\n${pad(level)}]`;
      }
    }
  };

  return render(node, indent);
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

  const html = useMemo(() => {
    if (!node) return "";
    return highlightJson(node, onlyDiff, 0);
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        const obj = left.trim() ? JSON.parse(left) : null;
                        setLeft(JSON.stringify(obj, null, 2));
                      } catch {}
                    }}
                  >
                    格式化
                  </Button>
                </div>
                <Textarea
                  rows={18}
                  value={left}
                  onChange={(e) => setLeft(e.target.value)}
                  placeholder="Paste your first JSON here..."
                  className={`${
                    errorLeft ? "border-destructive" : ""
                  } font-mono max-h-[70vh] overflow-y-auto overflow-x-auto break-words whitespace-pre-wrap resize-y`}
                />
                {errorLeft && (
                  <div className="text-destructive text-xs">{errorLeft}</div>
                )}
              </CardContent>
            </Card>

            <Card className="w-[20vw] flex-shrink-0 flex-grow-0">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Your JSON to compare
                  </div>
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
                <Textarea
                  rows={18}
                  value={right}
                  onChange={(e) => setRight(e.target.value)}
                  placeholder="Paste your JSON to compare here..."
                  className={`${
                    errorRight ? "border-destructive" : ""
                  } font-mono max-h-[70vh] overflow-y-auto overflow-x-auto break-words whitespace-pre-wrap resize-y`}
                />
                {errorRight && (
                  <div className="text-destructive text-xs">{errorRight}</div>
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
                <div
                  className="text-sm overflow-auto leading-6 max-h-[70vh] whitespace-pre-wrap break-words font-mono max-w-full"
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      html || '<span class="text-muted-foreground">{ }</span>',
                  }}
                />
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
