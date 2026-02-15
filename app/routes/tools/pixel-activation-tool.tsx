import { Target } from "lucide-react";
import FacebookPixelTool from "~/components/pixel-tools/facebook-pixel-tool";
import TikTokPixelTool from "~/components/pixel-tools/tiktok-pixel-tool";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function meta() {
	return [
		{ title: "广告 Pixel 激活工具 | DevTools Platform" },
		{
			name: "description",
			content:
				"统一的广告 Pixel 激活工具，支持 Facebook、TikTok 等多个广告渠道",
		},
	];
}

const AD_CHANNELS = [
	{
		value: "facebook",
		label: "Facebook Pixel",
		description: "Facebook / Meta 广告像素追踪",
		icon: "https://static.xx.fbcdn.net/rsrc.php/y1/r/ay1hV6OlegS.ico",
	},
	{
		value: "tiktok",
		label: "TikTok Pixel",
		description: "TikTok 广告像素追踪",
		icon: "https://www.tiktok.com/favicon.ico",
	},
];

export default function PixelActivationTool() {
	return (
		<div className="max-w-6xl mx-auto p-2 space-y-6">
			<ToolPageHeader
				icon={<Target className="h-5 w-5" />}
				title="广告 Pixel 激活工具"
				description="统一的多渠道广告像素激活和测试工具，支持 Facebook、TikTok 等主流广告平台"
			/>

			<Tabs defaultValue="facebook" className="w-full">
				<TabsList className="inline-flex h-9 items-center justify-center rounded-[6px] bg-muted p-1">
					{AD_CHANNELS.map((channel) => (
						<TabsTrigger
							key={channel.value}
							value={channel.value}
							className="inline-flex items-center gap-2 px-4"
						>
							<img
								src={channel.icon}
								alt={channel.label}
								className="w-4 h-4 rounded-2xl"
							/>
							<span className="font-medium">{channel.label}</span>
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="facebook" className="mt-4">
					<FacebookPixelTool embedded />
				</TabsContent>

				<TabsContent value="tiktok" className="mt-4">
					<TikTokPixelTool embedded />
				</TabsContent>
			</Tabs>
		</div>
	);
}
