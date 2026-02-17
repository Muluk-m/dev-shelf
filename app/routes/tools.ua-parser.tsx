import { Copy, Fingerprint } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";

type UaInfo = {
	browserName?: string;
	browserVersion?: string;
	engineName?: string;
	engineVersion?: string;
	osName?: string;
	osVersion?: string;
	deviceModel?: string;
	deviceType?: string;
	deviceVendor?: string;
	cpuArch?: string;
};

function parseUserAgent(ua: string): UaInfo {
	const parser = new UAParser(ua);
	const browser = parser.getBrowser();
	const engine = parser.getEngine();
	const os = parser.getOS();
	const device = parser.getDevice();
	const cpu = parser.getCPU();

	return {
		browserName: browser.name || undefined,
		browserVersion: browser.version || undefined,
		engineName: engine.name || undefined,
		engineVersion: engine.version || undefined,
		osName: os.name || undefined,
		osVersion: os.version || undefined,
		deviceModel: device.model || undefined,
		deviceType: device.type || undefined,
		deviceVendor: device.vendor || undefined,
		cpuArch: cpu.architecture || undefined,
	};
}

export function meta() {
	return [
		{ title: "User-Agent 解析器 | DevTools Platform" },
		{
			name: "description",
			content:
				"解析 User-Agent 字符串，获取浏览器、引擎、操作系统、CPU 和设备信息",
		},
	];
}

export default function UAParserPage() {
	const [ua, setUa] = useState<string>("");

	// 默认填入当前浏览器 UA，便于打开即用
	useEffect(() => {
		if (!ua && typeof navigator !== "undefined") {
			setUa(navigator.userAgent);
		}
	}, [ua]);

	const info = useMemo(() => parseUserAgent(ua), [ua]);

	const copyAsJson = async () => {
		if (!ua.trim()) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(info, null, 2));
			toast.success("已复制为 JSON");
		} catch {
			// ignore
		}
	};

	const Item = ({
		title,
		name,
		version,
		placeholders,
	}: {
		title: string;
		name?: string;
		version?: string;
		placeholders: string[];
	}) => (
		<Card>
			<CardHeader className="py-3">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				{!name && !version ? (
					<div className="text-sm text-muted-foreground space-y-1">
						{placeholders.map((t) => (
							<div key={t}>{t}</div>
						))}
					</div>
				) : (
					<div className="flex items-center gap-2 flex-wrap">
						{name ? <Badge variant="secondary">{name}</Badge> : null}
						{version ? <Badge variant="secondary">{version}</Badge> : null}
					</div>
				)}
			</CardContent>
		</Card>
	);

	return (
		<div className="bg-background flex flex-col min-h-[60vh]">
			<div className="w-full flex-1 flex">
				<div className="mx-auto w-full px-4 py-6">
					{/* 响应式居中内容区域宽度 */}
					<div className="mx-auto w-full max-w-[680px] sm:max-w-[720px] md:max-w-[860px] lg:max-w-[920px] xl:max-w-[980px] 2xl:max-w-[1100px]">
						<ToolPageHeader
							icon={<Fingerprint className="h-5 w-5" />}
							title="User-Agent 解析器"
							description="解析 User-Agent 字符串，获取浏览器、引擎、操作系统、CPU 和设备信息"
							actions={
								<Button
									variant="outline"
									size="sm"
									onClick={copyAsJson}
									disabled={!ua.trim()}
									className="gap-2"
								>
									<Copy className="h-4 w-4" />
									复制 JSON
								</Button>
							}
						/>

						<Card className="mb-4">
							<CardContent className="pt-4">
								<div className="mb-2 text-sm text-muted-foreground">
									User-Agent 字符串
								</div>
								<Textarea
									value={ua}
									onChange={(e) => setUa(e.target.value)}
									placeholder="在此输入或粘贴 UA 字符串"
									className="font-mono text-sm min-h-24"
								/>
							</CardContent>
						</Card>

						{/* 结果区块 */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Item
								title="Browser"
								name={info.browserName}
								version={info.browserVersion}
								placeholders={["无法获取浏览器名称", "无法获取浏览器版本"]}
							/>
							<Item
								title="引擎"
								name={info.engineName}
								version={info.engineVersion}
								placeholders={["无法获取引擎名称", "无法获取引擎版本"]}
							/>
							<Item
								title="操作系统"
								name={info.osName}
								version={info.osVersion}
								placeholders={["无法获取操作系统名称", "无法获取操作系统版本"]}
							/>
							<Item
								title="设备"
								name={info.deviceModel || info.deviceVendor}
								version={info.deviceType}
								placeholders={[
									"无法获取设备型号",
									"无法获取设备类型",
									"无法获取设备厂商",
								]}
							/>
							<Item
								title="CPU"
								name={info.cpuArch}
								version={undefined}
								placeholders={["无法获取 CPU 架构"]}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
