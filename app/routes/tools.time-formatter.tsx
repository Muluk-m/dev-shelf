import { Check, Clock, Copy, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ToolPageHeader } from "~/components/tool-page-header";
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
import type { Route } from "./+types/tools.time-formatter";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "日期时间转换器 | DevTools Platform" },
		{
			name: "description",
			content: "将日期和时间在多种不同格式之间转换",
		},
	];
}

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

function objectIdFromDate(date: Date) {
	const seconds = Math.floor(date.getTime() / 1000);
	const tsHex = seconds.toString(16).padStart(8, "0");
	return `${tsHex}0000000000000000`;
}

function parseISO9075(value: string): Date | null {
	const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
	if (!m) return null;
	const [_, y, mo, d, h, mi, s] = m;
	const date = new Date(
		Number(y),
		Number(mo) - 1,
		Number(d),
		Number(h),
		Number(mi),
		Number(s),
	);
	return Number.isNaN(date.getTime()) ? null : date;
}

function parseObjectId(value: string): Date | null {
	if (!/^[0-9a-fA-F]{24}$/.test(value)) return null;
	const seconds = parseInt(value.slice(0, 8), 16);
	const d = new Date(seconds * 1000);
	return Number.isNaN(d.getTime()) ? null : d;
}

function parseExcelSerial(value: string): Date | null {
	const num = Number(value);
	if (!Number.isFinite(num)) return null;
	const ms = (num - 25569) * 86400000;
	const d = new Date(ms);
	return Number.isNaN(d.getTime()) ? null : d;
}

function parseByFormat(value: string, format: InputFormat): Date | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	try {
		switch (format) {
			case "timestamp": {
				const n = Number(trimmed);
				if (!Number.isFinite(n)) return null;
				const ms = n < 1e12 ? n * 1000 : n;
				const d = new Date(ms);
				return Number.isNaN(d.getTime()) ? null : d;
			}
			case "unix": {
				const n = Number(trimmed);
				if (!Number.isFinite(n)) return null;
				const d = new Date(n * 1000);
				return Number.isNaN(d.getTime()) ? null : d;
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
				return Number.isNaN(d.getTime()) ? null : d;
			}
			default:
				return null;
		}
	} catch {
		return null;
	}
}

export default function DateTimeConverterPage() {
	const [input, setInput] = useState("");
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

	const setNow = () => {
		setInput(Date.now().toString());
		setFormat("timestamp");
	};

	const clear = () => {
		setInput("");
	};

	const copy = async (text?: string, label?: string) => {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`${label} 已复制到剪贴板`);
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
			<div className="grid grid-cols-1 md:grid-cols-[200px_1fr_40px] gap-2 items-center">
				<div className="text-sm text-muted-foreground">{label}</div>
				<Input
					readOnly
					value={value ?? ""}
					placeholder={placeholder}
					className="font-mono text-sm"
				/>
				<div className="flex justify-end">
					<Button
						size="icon"
						variant="ghost"
						className="cursor-pointer"
						disabled={!value}
						onClick={() => copy(value, label)}
					>
						{isCopied ? (
							<Check className="h-4 w-4 text-green-600" />
						) : (
							<Copy className="h-4 w-4" />
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
					<ToolPageHeader
						icon={<Clock className="h-5 w-5" />}
						title="日期时间转换器"
						description="将日期和时间在多种不同格式之间转换"
						actions={
							<Button
								variant="outline"
								size="sm"
								onClick={setNow}
								className="gap-2"
							>
								<RefreshCcw className="h-4 w-4" />
								当前时间
							</Button>
						}
					/>

					<Card>
						<CardContent className="pt-6 space-y-4">
							<div className="flex gap-3">
								<Input
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="输入时间戳、日期字符串..."
									className={`flex-1 font-mono ${error ? "border-destructive" : undefined}`}
								/>
								<Select
									value={format}
									onValueChange={(v) => setFormat(v as InputFormat)}
								>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="选择格式" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="timestamp">Timestamp (ms)</SelectItem>
										<SelectItem value="unix">Unix (s)</SelectItem>
										<SelectItem value="iso8601">ISO 8601</SelectItem>
										<SelectItem value="iso9075">ISO 9075</SelectItem>
										<SelectItem value="rfc3339">RFC 3339</SelectItem>
										<SelectItem value="rfc7231">RFC 7231</SelectItem>
										<SelectItem value="utc">UTC</SelectItem>
										<SelectItem value="objectid">Mongo ObjectID</SelectItem>
										<SelectItem value="excel">Excel</SelectItem>
										<SelectItem value="js">JS Locale</SelectItem>
									</SelectContent>
								</Select>
								{input && (
									<Button variant="ghost" size="icon" onClick={clear}>
										<span className="text-muted-foreground text-sm">✕</span>
									</Button>
								)}
							</div>

							{error && (
								<div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{error}
								</div>
							)}

							<div className="space-y-2">
								{renderRow("Timestamp (ms)", results?.timestamp)}
								{renderRow("Unix (s)", results?.unix)}
								{renderRow("ISO 8601", results?.iso8601)}
								{renderRow("ISO 9075", results?.iso9075)}
								{renderRow("RFC 3339", results?.rfc3339)}
								{renderRow("RFC 7231", results?.rfc7231)}
								{renderRow("UTC", results?.utc)}
								{renderRow("Mongo ObjectID", results?.objectId)}
								{renderRow("Excel", results?.excel)}
								{renderRow("JS Locale", results?.jsLocale)}
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
