import { Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/tiktok-pixel-tool";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "TikTok Pixel Tool | DevTools Platform" },
		{
			name: "description",
			content: "Test and debug TikTok Pixel events with custom parameters",
		},
	];
}

const TIKTOK_EVENTS = [
	"PageView",
	"ViewContent",
	"Search",
	"AddToCart",
	"InitiateCheckout",
	"AddPaymentInfo",
	"Purchase",
	"CompleteRegistration",
	"SubmitForm",
	"Contact",
	"Download",
	"ClickButton",
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW"];

interface ContentItem {
	content_id: string;
	content_name: string;
	quantity: number;
	price: number;
}

export default function TikTokPixelTool() {
	const [formData, setFormData] = useState({
		accessToken: "",
		pixelCode: "",
		testEventCode: "",
		event: "",
		userAgent: navigator.userAgent,
		ip: "",
		value: 0,
		currency: "USD",
		contents: [] as ContentItem[],
		customProperties: {} as Record<string, string>,
	});

	const [response, setResponse] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addContentItem = () => {
		setFormData((prev) => ({
			...prev,
			contents: [
				...prev.contents,
				{
					content_id: "",
					content_name: "",
					quantity: 1,
					price: 0,
				},
			],
		}));
	};

	const removeContentItem = (index: number) => {
		setFormData((prev) => ({
			...prev,
			contents: prev.contents.filter((_, i) => i !== index),
		}));
	};

	const updateContentItem = (
		index: number,
		field: keyof ContentItem,
		value: string | number,
	) => {
		setFormData((prev) => ({
			...prev,
			contents: prev.contents.map((item, i) =>
				i === index ? { ...item, [field]: value } : item,
			),
		}));
	};

	const addCustomProperty = () => {
		const key = prompt("输入属性名:");
		if (key && !formData.customProperties[key]) {
			setFormData((prev) => ({
				...prev,
				customProperties: { ...prev.customProperties, [key]: "" },
			}));
		}
	};

	const updateCustomProperty = (key: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			customProperties: { ...prev.customProperties, [key]: value },
		}));
	};

	const removeCustomProperty = (key: string) => {
		setFormData((prev) => {
			const newProps = { ...prev.customProperties };
			delete newProps[key];
			return { ...prev, customProperties: newProps };
		});
	};

	const activatePixel = async () => {
		if (!formData.accessToken || !formData.pixelCode || !formData.event) {
			setError("请填写必填字段：Access Token、Pixel Code 和 Event");
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		try {
			const payload = {
				pixel_code: formData.pixelCode,
				event: formData.event,
				event_id: crypto.randomUUID(),
				timestamp: Math.floor(Date.now() / 1000).toString(),
				context: {
					user_agent: formData.userAgent,
					ip: formData.ip || undefined,
					ad: {
						callback: "E.C.P",
					},
					page: {
						url: window.location.href,
						referrer: document.referrer,
					},
					user: {},
				},
				properties: {
					contents:
						formData.contents.length > 0 ? formData.contents : undefined,
					value: formData.value || undefined,
					currency: formData.currency,
					...formData.customProperties,
				},
				test_event_code: formData.testEventCode || undefined,
			};

			// 清理 undefined 值
			const cleanPayload = JSON.parse(JSON.stringify(payload));

			const response = await fetch(
				"https://business-api.tiktok.com/open_api/v1.3/pixel/track/",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Access-Token": formData.accessToken,
					},
					body: JSON.stringify(cleanPayload),
				},
			);

			const data = await response.json();
			setResponse({ status: response.status, data });
		} catch (err) {
			setError(err instanceof Error ? err.message : "请求失败");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			<ToolPageHeader
				icon={<Target className="h-5 w-5" />}
				title="TikTok Pixel 激活调试工具"
				description="手动填写参数并一键触发 TikTok Pixel 事件，用于调试和测试"
			/>
			<Card>
				<CardHeader>
					<CardTitle>配置参数</CardTitle>
					<CardDescription>
						填写 TikTok Pixel 相关参数以触发事件
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 基本参数区 */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">基本参数</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="accessToken">Access Token *</Label>
								<Input
									id="accessToken"
									type="password"
									placeholder="输入您的 Access Token"
									value={formData.accessToken}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											accessToken: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pixelCode">Pixel Code *</Label>
								<Input
									id="pixelCode"
									placeholder="输入 Pixel Code"
									value={formData.pixelCode}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											pixelCode: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="testEventCode">Test Event Code</Label>
								<Input
									id="testEventCode"
									placeholder="测试事件代码（可选）"
									value={formData.testEventCode}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											testEventCode: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="event">Event *</Label>
								<Select
									value={formData.event}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, event: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="选择事件类型" />
									</SelectTrigger>
									<SelectContent>
										{TIKTOK_EVENTS.map((event) => (
											<SelectItem key={event} value={event}>
												{event}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<Separator />

					{/* 上下文参数区 */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">上下文参数</h3>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="userAgent">User Agent</Label>
								<Textarea
									id="userAgent"
									rows={2}
									value={formData.userAgent}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											userAgent: e.target.value,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ip">IP 地址</Label>
								<Input
									id="ip"
									placeholder="127.0.0.1（可选）"
									value={formData.ip}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, ip: e.target.value }))
									}
								/>
							</div>
						</div>
					</div>

					<Separator />

					{/* 事件属性区 */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">事件属性</h3>

						{/* Contents 数组 */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>Contents（商品信息）</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addContentItem}
								>
									<Plus className="h-4 w-4 mr-1" />
									添加商品
								</Button>
							</div>

							{formData.contents.length > 0 && (
								<div className="space-y-2">
									<div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
										<div className="col-span-3">Content ID</div>
										<div className="col-span-3">商品名称</div>
										<div className="col-span-2">数量</div>
										<div className="col-span-3">价格</div>
										<div className="col-span-1">操作</div>
									</div>
									{formData.contents.map((item, index) => (
										<div key={index} className="grid grid-cols-12 gap-2">
											<Input
												className="col-span-3"
												placeholder="test001"
												value={item.content_id}
												onChange={(e) =>
													updateContentItem(index, "content_id", e.target.value)
												}
											/>
											<Input
												className="col-span-3"
												placeholder="Product A"
												value={item.content_name}
												onChange={(e) =>
													updateContentItem(
														index,
														"content_name",
														e.target.value,
													)
												}
											/>
											<Input
												className="col-span-2"
												type="number"
												min="1"
												value={item.quantity}
												onChange={(e) =>
													updateContentItem(
														index,
														"quantity",
														Number.parseInt(e.target.value, 10) || 1,
													)
												}
											/>
											<Input
												className="col-span-3"
												type="number"
												step="0.01"
												min="0"
												value={item.price}
												onChange={(e) =>
													updateContentItem(
														index,
														"price",
														parseFloat(e.target.value) || 0,
													)
												}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="col-span-1"
												onClick={() => removeContentItem(index)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Value 和 Currency */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="value">Value</Label>
								<Input
									id="value"
									type="number"
									step="0.01"
									min="0"
									placeholder="99.99"
									value={formData.value}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											value: parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="currency">Currency</Label>
								<Select
									value={formData.currency}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, currency: value }))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CURRENCIES.map((currency) => (
											<SelectItem key={currency} value={currency}>
												{currency}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* 自定义属性 */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label>自定义属性</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addCustomProperty}
								>
									<Plus className="h-4 w-4 mr-1" />
									添加属性
								</Button>
							</div>

							{Object.entries(formData.customProperties).length > 0 && (
								<div className="space-y-2">
									{Object.entries(formData.customProperties).map(
										([key, value]) => (
											<div key={key} className="flex gap-2">
												<Badge variant="secondary" className="min-w-fit">
													{key}
												</Badge>
												<Input
													value={value}
													onChange={(e) =>
														updateCustomProperty(key, e.target.value)
													}
													placeholder="属性值"
												/>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => removeCustomProperty(key)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										),
									)}
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* 操作区 */}
					<div className="space-y-4">
						<Button
							onClick={activatePixel}
							disabled={loading}
							className="w-full md:w-auto"
							size="lg"
						>
							{loading ? "激活中..." : "🚀 激活"}
						</Button>

						{error && (
							<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-destructive text-sm">{error}</p>
							</div>
						)}

						{response && (
							<div className="space-y-2">
								<Label>响应结果</Label>
								<div className="bg-muted rounded-lg p-4 overflow-auto">
									<div className="flex items-center gap-2 mb-2">
										<Badge
											variant={
												response.status === 200 ? "default" : "destructive"
											}
										>
											Status: {response.status}
										</Badge>
									</div>
									<pre className="text-sm overflow-x-auto">
										{JSON.stringify(response.data, null, 2)}
									</pre>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
