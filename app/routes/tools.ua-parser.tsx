import { Copy, Fingerprint } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import type { BuiltinToolMeta } from "~/types/tool";

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

export const toolMeta: BuiltinToolMeta = {
	id: "ua-parser",
	name: "User-Agent 解析器",
	description:
		"解析 User-Agent 字符串，获取浏览器、引擎、操作系统、CPU 和设备信息",
	icon: "Fingerprint",
	category: "builtin",
	tags: ["ua", "user-agent", "browser", "parse"],
};

export function meta() {
	return [
		{ title: "User-Agent 解析器 | DevShelf" },
		{
			name: "description",
			content:
				"解析 User-Agent 字符串，获取浏览器、引擎、操作系统、CPU 和设备信息",
		},
	];
}

export default function UAParserPage() {
	const { t } = useTranslation();
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
			toast.success(t("tools.uaParser.copiedJson"));
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
							title={t("tools.uaParser.title")}
							description={t("tools.uaParser.description")}
							actions={
								<Button
									variant="outline"
									size="sm"
									onClick={copyAsJson}
									disabled={!ua.trim()}
									className="gap-2"
								>
									<Copy className="h-4 w-4" />
									{t("tools.uaParser.copyJson")}
								</Button>
							}
						/>

						<Card className="mb-4">
							<CardContent className="pt-4">
								<div className="mb-2 text-sm text-muted-foreground">
									{t("tools.uaParser.inputLabel")}
								</div>
								<Textarea
									value={ua}
									onChange={(e) => setUa(e.target.value)}
									placeholder={t("tools.uaParser.placeholder")}
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
								placeholders={[
									t("tools.uaParser.browserName.na"),
									t("tools.uaParser.browserVersion.na"),
								]}
							/>
							<Item
								title={t("tools.uaParser.engine")}
								name={info.engineName}
								version={info.engineVersion}
								placeholders={[
									t("tools.uaParser.engineName.na"),
									t("tools.uaParser.engineVersion.na"),
								]}
							/>
							<Item
								title={t("tools.uaParser.os")}
								name={info.osName}
								version={info.osVersion}
								placeholders={[
									t("tools.uaParser.osName.na"),
									t("tools.uaParser.osVersion.na"),
								]}
							/>
							<Item
								title={t("tools.uaParser.device")}
								name={info.deviceModel || info.deviceVendor}
								version={info.deviceType}
								placeholders={[
									t("tools.uaParser.deviceModel.na"),
									t("tools.uaParser.deviceType.na"),
									t("tools.uaParser.deviceVendor.na"),
								]}
							/>
							<Item
								title="CPU"
								name={info.cpuArch}
								version={undefined}
								placeholders={[t("tools.uaParser.cpuArch.na")]}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
