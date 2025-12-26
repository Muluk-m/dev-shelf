import { Eye } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	channelMap,
	packageStatusMap,
	packageTypeMap,
	pixelTypeMap,
	preLoadMap,
} from "~/lib/pwa-link-health";
import type { ConfigV3Data } from "~/types/pwa-link-health";

// 状态颜色映射配置
const STATUS_COLORS = {
	packageStatus: {
		0: "bg-gray-500 text-white hover:bg-gray-600", // 未上传
		1: "bg-yellow-500 text-white hover:bg-yellow-600", // 部署中
		2: "bg-green-500 text-white hover:bg-green-600", // 部署完成
		3: "bg-red-500 text-white hover:bg-red-600", // 暂停使用
	},
	packageType: {
		1: "bg-blue-500 text-white hover:bg-blue-600", // 自研
		2: "bg-purple-500 text-white hover:bg-purple-600", // 包网
	},
	channel: {
		4: "bg-blue-500 text-white hover:bg-blue-600", // Facebook
		5: "bg-black text-white hover:bg-gray-800", // TikTok
		9: "bg-orange-500 text-white hover:bg-orange-600", // KWAI
		10: "bg-red-500 text-white hover:bg-red-600", // Google
	},
	pixelType: {
		1: "bg-green-600 text-white hover:bg-green-700", // Google GA
		2: "bg-orange-600 text-white hover:bg-orange-700", // Google GTM
	},
} as const;

export function renderColorBadge(value: string | number, field: string) {
	const numValue = Number(value);

	if (field === "theme_color" || field === "background_color") {
		return (
			<div className="flex items-center gap-2">
				<div
					className="w-6 h-6 rounded border"
					style={{ backgroundColor: String(value) }}
				/>
				<span className="font-mono text-xs">{String(value)}</span>
			</div>
		);
	}

	if (field === "package_status") {
		const text = packageStatusMap[numValue] || String(value);
		const color =
			STATUS_COLORS.packageStatus[
				numValue as keyof typeof STATUS_COLORS.packageStatus
			] || "";
		return (
			<Badge className={`font-normal px-2.5 py-0.5 ${color}`}>{text}</Badge>
		);
	}

	if (field === "package_type") {
		const text = packageTypeMap[numValue] || String(value);
		const color =
			STATUS_COLORS.packageType[
				numValue as keyof typeof STATUS_COLORS.packageType
			] || "";
		return (
			<Badge className={`font-normal px-2.5 py-0.5 ${color}`}>{text}</Badge>
		);
	}

	if (field === "pre_load") {
		const text = preLoadMap[numValue] || String(value);
		const color =
			numValue === 1
				? "bg-green-500 text-white hover:bg-green-600"
				: "bg-gray-500 text-white hover:bg-gray-600";
		return <Badge className={`font-normal ${color}`}>{text}</Badge>;
	}

	if (field === "linkInfo.is_pixel_report") {
		const isEnabled = String(value) === "1";
		const color = isEnabled
			? "bg-green-500 text-white hover:bg-green-600"
			: "bg-gray-500 text-white hover:bg-gray-600";
		return (
			<Badge className={`font-normal ${color}`}>
				{isEnabled ? "是" : "否"}
			</Badge>
		);
	}

	if (field === "linkInfo.rb_pixel_type") {
		const text = pixelTypeMap[numValue] || String(value);
		const color =
			STATUS_COLORS.pixelType[
				numValue as keyof typeof STATUS_COLORS.pixelType
			] || "bg-gray-500 text-white hover:bg-gray-600";
		return <Badge className={`font-normal ${color}`}>{text}</Badge>;
	}

	if (field === "linkInfo.channel_id") {
		const text = channelMap[numValue] || String(value);
		const color =
			STATUS_COLORS.channel[numValue as keyof typeof STATUS_COLORS.channel] ||
			"";
		return (
			<Badge className={`font-normal px-2.5 py-0.5 ${color}`}>{text}</Badge>
		);
	}

	return String(value);
}

export function renderFieldValue(
	field: string,
	value: unknown,
	_configV3Data: ConfigV3Data,
): ReactNode {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	// 特殊处理 language_json
	if (field === "language_json") {
		const languageJson = value as Record<string, unknown>;
		const languageCodes = Object.keys(languageJson);
		return languageCodes.length > 0 ? languageCodes.join(", ") : null;
	}

	// 特殊处理需要颜色的字段
	if (
		[
			"theme_color",
			"background_color",
			"package_status",
			"package_type",
			"pre_load",
			"linkInfo.is_pixel_report",
			"linkInfo.rb_pixel_type",
			"linkInfo.channel_id",
		].includes(field)
	) {
		return renderColorBadge(value as string | number, field);
	}

	// 特殊处理链接
	if (field === "package_link") {
		return (
			<a
				href={String(value)}
				target="_blank"
				rel="noopener noreferrer"
				className="text-blue-600 hover:underline break-all"
			>
				{String(value)}
			</a>
		);
	}

	// 特殊处理 linkInfo - 可折叠显示
	if (field === "linkInfo" && !field.includes(".")) {
		return <CollapsibleLinkInfo value={value} />;
	}

	// 对象类型显示 JSON
	if (typeof value === "object") {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}

	return String(value);
}

function CollapsibleLinkInfo({ value }: { value: unknown }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="text-xs flex-1 min-w-0 break-words font-medium">
			{expanded ? (
				<div className="space-y-1">
					<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64 border">
						{JSON.stringify(value, null, 2)}
					</pre>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setExpanded(false)}
						className="text-xs h-6"
					>
						收起
					</Button>
				</div>
			) : (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setExpanded(true)}
					className="text-xs h-6 text-muted-foreground"
				>
					<Eye className="w-3 h-3 mr-1" />
					点击查看详情
				</Button>
			)}
		</div>
	);
}
