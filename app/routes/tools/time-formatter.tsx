import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";

type InputFormat =
  | "js"
  | "iso8601"
  | "iso9075"
  | "rfc3339"
  | "rfc7231"
  | "unix"
  | "timestamp"
  | "utc"
  | "objectid"
  | "excel";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatLocalISO8601(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const tzh = pad2(Math.floor(Math.abs(tz) / 60));
  const tzm = pad2(Math.abs(tz) % 60);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${tzh}:${tzm}`;
}

function formatISO9075(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function formatUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = pad2(date.getUTCMonth() + 1);
  const d = pad2(date.getUTCDate());
  const hh = pad2(date.getUTCHours());
  const mm = pad2(date.getUTCMinutes());
  const ss = pad2(date.getUTCSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss} GMT`;
}

function objectIdFromDate(date: Date) {
  const seconds = Math.floor(date.getTime() / 1000);
  const tsHex = seconds.toString(16).padStart(8, "0");
  return `${tsHex}0000000000000000`;
}

function parseISO9075(value: string): Date | null {
  // YYYY-MM-DD HH:mm:ss
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [_, y, mo, d, h, mi, s] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );
  return isNaN(date.getTime()) ? null : date;
}

function parseObjectId(value: string): Date | null {
  if (!/^[0-9a-fA-F]{24}$/.test(value)) return null;
  const seconds = parseInt(value.slice(0, 8), 16);
  const d = new Date(seconds * 1000);
  return isNaN(d.getTime()) ? null : d;
}

function parseExcelSerial(value: string): Date | null {
  const num = Number(value);
  if (!isFinite(num)) return null;
  // Excel (1900 date system) serial to JS time
  const ms = (num - 25569) * 86400000; // days to ms, 25569 = 1970-01-01
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

function parseByFormat(value: string, format: InputFormat): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    switch (format) {
      case "timestamp": {
        const n = Number(trimmed);
        if (!isFinite(n)) return null;
        const ms = n < 1e12 ? n * 1000 : n;
        const d = new Date(ms);
        return isNaN(d.getTime()) ? null : d;
      }
      case "unix": {
        const n = Number(trimmed);
        if (!isFinite(n)) return null;
        const d = new Date(n * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      case "iso9075":
        return parseISO9075(trimmed);
      case "objectid":
        return parseObjectId(trimmed);
      case "excel":
        return parseExcelSerial(trimmed);
      case "iso8601":
      case "rfc3339":
      case "rfc7231":
      case "utc":
      case "js": {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? null : d;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export default function DateTimeConverterPage() {
  const [input, setInput] = useState("1758688404399");
  const [format, setFormat] = useState<InputFormat>("timestamp");
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const { date, error } = useMemo(() => {
    const d = parseByFormat(input, format);
    if (!input.trim()) return { date: null as Date | null, error: "" };
    if (!d) {
      return {
        date: null as Date | null,
        error: "输入与所选格式不匹配或无法解析",
      };
    }
    return { date: d, error: "" };
  }, [input, format]);

  const results = useMemo(() => {
    if (!date) return null;
    const unix = Math.floor(date.getTime() / 1000).toString();
    const ts = date.getTime().toString();
    const rfc7231Str = date.toUTCString();
    return {
      jsLocale: date.toString(),
      iso8601: formatLocalISO8601(date),
      iso9075: formatISO9075(date),
      rfc3339: formatLocalISO8601(date),
      rfc7231: rfc7231Str,
      unix,
      timestamp: ts,
      utc: rfc7231Str,
      objectId: objectIdFromDate(date),
      excel: (date.getTime() / 86400000 + 25569).toString(),
    };
  }, [date]);

  const copy = async (text?: string, label?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
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
    } catch {
      // ignore
    }
  };

  const renderRow = (label: string, value?: string, placeholder?: string) => {
    const copyKey = `${label}-${value}`;
    const isCopied = copiedItems.has(copyKey);

    return (
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_40px] gap-2 items-center">
        <div className="text-sm text-muted-foreground">{label}</div>
        <Input readOnly value={value ?? ""} placeholder={placeholder} />
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="outline"
            className="cursor-pointer"
            disabled={!value}
            onClick={() => copy(value, label)}
          >
            {isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background flex flex-col">
      <main className="container mx-auto px-4 py-4 flex-1 flex flex-col">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">日期时间转换器</h1>
            <p className="text-sm text-muted-foreground">
              将日期和时间在多种不同格式之间转换
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={error ? "border-destructive" : undefined}
                />
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as InputFormat)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择输入格式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="js">JS locale date string</SelectItem>
                    <SelectItem value="iso8601">ISO 8601</SelectItem>
                    <SelectItem value="iso9075">ISO 9075</SelectItem>
                    <SelectItem value="rfc3339">RFC 3339</SelectItem>
                    <SelectItem value="rfc7231">RFC 7231</SelectItem>
                    <SelectItem value="unix">Unix timestamp</SelectItem>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                    <SelectItem value="utc">UTC format</SelectItem>
                    <SelectItem value="objectid">Mongo ObjectID</SelectItem>
                    <SelectItem value="excel">Excel date/time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {renderRow(
                  "JS locale date string",
                  results?.jsLocale,
                  "Invalid date..."
                )}
                {renderRow("ISO 8601", results?.iso8601, "Invalid date...")}
                {renderRow("ISO 9075", results?.iso9075, "Invalid date...")}
                {renderRow("RFC 3339", results?.rfc3339, "Invalid date...")}
                {renderRow("RFC 7231", results?.rfc7231, "Invalid date...")}
                {renderRow("Unix timestamp", results?.unix, "Invalid date...")}
                {renderRow("Timestamp", results?.timestamp, "Invalid date...")}
                {renderRow("UTC format", results?.utc, "Invalid date...")}
                {renderRow(
                  "Mongo ObjectID",
                  results?.objectId,
                  "Invalid date..."
                )}
                {renderRow(
                  "Excel date/time",
                  results?.excel,
                  "Invalid date..."
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
