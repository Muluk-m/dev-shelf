import { Target } from "lucide-react";
import { useEffect, useState } from "react";
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
import type { Route } from "./+types/facebook-pixel-tool";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Facebook Pixel Tool | DevTools Platform" },
		{
			name: "description",
			content:
				"Simple tool to activate Facebook Pixel events with Conversions API",
		},
	];
}

const FACEBOOK_EVENTS = [
	"PageView",
	"ViewContent",
	"Search",
	"AddToCart",
	"AddToWishlist",
	"InitiateCheckout",
	"AddPaymentInfo",
	"Purchase",
	"Lead",
	"CompleteRegistration",
	"Contact",
	"CustomizeProduct",
	"Donate",
	"FindLocation",
	"Schedule",
	"StartTrial",
	"SubmitApplication",
	"Subscribe",
];

const ACTION_SOURCES = [
	"website",
	"app",
	"email",
	"phone_call",
	"chat",
	"physical_store",
	"system_generated",
	"other",
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW", "BRL"];

const REPORT_TYPES = [
	{ value: "api", label: "API 上报（Conversions API）" },
	{ value: "sdk", label: "SDK 上报（Facebook Pixel SDK）" },
];

// 扩展 window 类型
declare global {
	interface Window {
		fbq?: any;
		_fbq?: any;
	}
}

export default function FacebookPixelTool() {
	const [formData, setFormData] = useState({
		reportType: "api",
		accessToken: "",
		pixelId: "",
		testEventCode: "",
		event: "",
		customEventName: "",
		actionSource: "website",
		eventSourceUrl: "",
		userAgent: "",
		clientIpAddress: "",
		externalId: "",
		fbp: "",
		fbc: "",
		value: 0,
		currency: "USD",
	});

	const [response, setResponse] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 在客户端设置默认值
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			eventSourceUrl: window.location.href,
			userAgent: navigator.userAgent,
		}));
	}, []);

	// 初始化 Facebook SDK
	const initFacebookSDK = (pixelId: string) => {
		if (window.fbq) {
			return; // 已经初始化
		}

		// 创建 fbq 函数
		// biome-ignore lint/complexity/useArrowFunction: fbq 需要引用自身
		const fbq: any = function (...args: any[]) {
			if (fbq.callMethod) {
				fbq.callMethod(...args);
			} else {
				fbq.queue.push(args);
			}
		};

		if (!window._fbq) window._fbq = fbq;
		fbq.push = fbq;
		fbq.loaded = true;
		fbq.version = "2.0";
		fbq.queue = [];
		window.fbq = fbq;

		// 动态加载 Facebook Pixel SDK
		const script = document.createElement("script");
		script.async = true;
		script.src = "https://connect.facebook.net/en_US/fbevents.js";
		document.head.appendChild(script);

		// 初始化 Pixel
		script.onload = () => {
			window.fbq("init", pixelId);
		};
	};

	// SDK 上报
	const activatePixelSDK = () => {
		if (!formData.pixelId) {
			setError("请填写 Pixel ID");
			return;
		}

		if (!formData.event && !formData.customEventName) {
			setError("请选择标准事件或输入自定义事件名称");
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		try {
			// 初始化 SDK
			initFacebookSDK(formData.pixelId);

			// 等待 SDK 加载完成
			setTimeout(() => {
				if (!window.fbq) {
					setError("Facebook SDK 加载失败");
					setLoading(false);
					return;
				}

				const eventData: any = {};
				if (formData.value) eventData.value = formData.value;
				if (formData.currency) eventData.currency = formData.currency;

				// 发送事件
				if (formData.customEventName) {
					// 自定义事件使用 trackSingleCustom
					window.fbq(
						"trackSingleCustom",
						formData.pixelId,
						formData.customEventName,
						eventData,
					);
					setResponse({
						type: "SDK",
						method: "trackSingleCustom",
						pixelId: formData.pixelId,
						event: formData.customEventName,
						data: eventData,
						message: "自定义事件已发送",
					});
				} else {
					// 标准事件使用 track
					window.fbq("track", formData.event, eventData);
					setResponse({
						type: "SDK",
						method: "track",
						event: formData.event,
						data: eventData,
						message: "标准事件已发送",
					});
				}

				setLoading(false);
			}, 1000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "SDK 上报失败");
			setLoading(false);
		}
	};

	// API 上报
	const activatePixelAPI = async () => {
		if (!formData.accessToken || !formData.pixelId || !formData.event) {
			setError("请填写必填字段：Access Token、Pixel ID 和 Event");
			return;
		}

		// 检查是否至少填写了一个客户信息参数
		const hasCustomerInfo =
			formData.clientIpAddress ||
			formData.externalId ||
			formData.fbp ||
			formData.fbc;

		if (!hasCustomerInfo) {
			setError(
				"请至少填写一个客户信息参数：Client IP Address、External ID、fbp Cookie 或 fbc Cookie",
			);
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

		try {
			// 构建 user_data（必须包含至少一个客户信息参数）
			const userData: any = {
				client_ip_address: formData.clientIpAddress || undefined,
				client_user_agent: formData.userAgent || undefined,
				external_id: formData.externalId || undefined,
				fbp: formData.fbp || undefined,
				fbc: formData.fbc || undefined,
			};

			// 构建 custom_data（可选）
			const customData: any = {};
			if (formData.value) customData.value = formData.value;
			if (formData.currency) customData.currency = formData.currency;

			// 构建请求 payload
			const payload = {
				data: [
					{
						event_name: formData.event,
						event_time: Math.floor(Date.now() / 1000),
						event_id: crypto.randomUUID(),
						event_source_url: formData.eventSourceUrl || undefined,
						action_source: formData.actionSource,
						user_data: userData,
						custom_data:
							Object.keys(customData).length > 0 ? customData : undefined,
						opt_out: false,
					},
				],
				test_event_code: formData.testEventCode || undefined,
			};

			// 清理 undefined 值
			const cleanPayload = JSON.parse(JSON.stringify(payload));

			// API 调用
			const apiUrl = `https://graph.facebook.com/v24.0/${formData.pixelId}/events?access_token=${formData.accessToken}`;

			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(cleanPayload),
			});

			const data = await response.json();
			setResponse({ status: response.status, data, payload: cleanPayload });
		} catch (err) {
			setError(err instanceof Error ? err.message : "请求失败");
		} finally {
			setLoading(false);
		}
	};

	const activatePixel = () => {
		if (formData.reportType === "sdk") {
			activatePixelSDK();
		} else {
			activatePixelAPI();
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			<ToolPageHeader
				icon={<Target className="h-5 w-5" />}
				title="Facebook Pixel 激活上报工具"
				description="简单快速地激活 Facebook Pixel 事件，并上报到 Facebook"
			/>
			<Card>
				<CardHeader>
					<CardTitle>配置参数</CardTitle>
					<CardDescription>
						填写必需参数即可激活 Facebook Pixel 事件
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* 上报类型选择 */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">上报类型</h3>
						<Select
							value={formData.reportType}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, reportType: value }))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{REPORT_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{formData.reportType === "api"
								? "使用 Conversions API 进行服务端上报，需要 Access Token"
								: "使用 Facebook Pixel SDK 进行客户端上报，无需 Access Token"}
						</p>
					</div>

					<Separator />

					{/* 基本参数 */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">基本参数</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{formData.reportType === "api" && (
								<div className="space-y-2 md:col-span-2">
									<Label htmlFor="accessToken">
										Access Token <span className="text-destructive">*</span>
									</Label>
									<Input
										id="accessToken"
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
							)}
							<div className="space-y-2">
								<Label htmlFor="pixelId">
									Pixel ID <span className="text-destructive">*</span>
								</Label>
								<Input
									id="pixelId"
									placeholder="输入 Pixel ID"
									value={formData.pixelId}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											pixelId: e.target.value,
										}))
									}
								/>
							</div>

							{formData.reportType === "sdk" ? (
								<>
									<div className="space-y-2">
										<Label htmlFor="event">
											标准事件 <span className="text-destructive">*</span>
										</Label>
										<Select
											value={formData.event}
											onValueChange={(value) =>
												setFormData((prev) => ({ ...prev, event: value }))
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="选择标准事件" />
											</SelectTrigger>
											<SelectContent>
												{FACEBOOK_EVENTS.map((event) => (
													<SelectItem key={event} value={event}>
														{event}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="customEventName">
											自定义事件名称（可选）
										</Label>
										<Input
											id="customEventName"
											placeholder="例如：MyCustomEvent"
											value={formData.customEventName}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													customEventName: e.target.value,
												}))
											}
										/>
										<p className="text-xs text-muted-foreground">
											如果填写自定义事件名称，将使用 trackSingleCustom 方法
										</p>
									</div>
								</>
							) : (
								<>
									<div className="space-y-2">
										<Label htmlFor="event">
											Event <span className="text-destructive">*</span>
										</Label>
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
												{FACEBOOK_EVENTS.map((event) => (
													<SelectItem key={event} value={event}>
														{event}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="actionSource">
											Action Source <span className="text-destructive">*</span>
										</Label>
										<Select
											value={formData.actionSource}
											onValueChange={(value) =>
												setFormData((prev) => ({
													...prev,
													actionSource: value,
												}))
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{ACTION_SOURCES.map((source) => (
													<SelectItem key={source} value={source}>
														{source}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2 md:col-span-2">
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
										<p className="text-xs text-muted-foreground">
											从 Events Manager 的 Test Events 工具获取
										</p>
									</div>
								</>
							)}
						</div>
					</div>

					<Separator />

					{/* 客户信息参数（API 模式下必填） */}
					{formData.reportType === "api" && (
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-semibold">
									客户信息参数
									<span className="text-destructive ml-1">*</span>
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									至少填写一个字段（Client IP、External ID 或 Cookie）
								</p>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="clientIpAddress">Client IP Address</Label>
									<Input
										id="clientIpAddress"
										placeholder="123.123.123.123"
										value={formData.clientIpAddress}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												clientIpAddress: e.target.value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										用户的 IP 地址（不加密）
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="externalId">External ID</Label>
									<Input
										id="externalId"
										placeholder="user_12345"
										value={formData.externalId}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												externalId: e.target.value,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										您系统中的用户 ID
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fbp">fbp Cookie</Label>
									<Input
										id="fbp"
										placeholder="fb.1.1234567890123.1234567890"
										value={formData.fbp}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, fbp: e.target.value }))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Facebook Browser Pixel Cookie
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fbc">fbc Cookie</Label>
									<Input
										id="fbc"
										placeholder="fb.1.1234567890123.AbCdEf..."
										value={formData.fbc}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, fbc: e.target.value }))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Facebook Click ID Cookie
									</p>
								</div>
							</div>
						</div>
					)}

					{formData.reportType === "api" && <Separator />}

					{/* 浏览器参数（仅 API 模式） */}
					{formData.reportType === "api" && (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">浏览器参数（可选）</h3>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="eventSourceUrl">Event Source URL</Label>
									<Input
										id="eventSourceUrl"
										placeholder="https://example.com/product"
										value={formData.eventSourceUrl}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												eventSourceUrl: e.target.value,
											}))
										}
									/>
								</div>
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
							</div>
						</div>
					)}

					<Separator />

					{/* 转化数据（可选） */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">转化数据（可选）</h3>
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
							{loading ? "激活中..." : "🚀 激活 Pixel"}
						</Button>

						{error && (
							<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
								<p className="text-destructive text-sm">{error}</p>
							</div>
						)}

						{response && (
							<div className="space-y-4">
								{response.type === "SDK" ? (
									/* SDK 上报结果 */
									<div className="space-y-2">
										<Label>上报结果</Label>
										<div className="bg-muted rounded-lg p-4">
											<div className="flex items-center gap-2 mb-4">
												<Badge variant="default">SDK 上报</Badge>
												<Badge variant="secondary">{response.method}</Badge>
											</div>
											<div className="space-y-2 text-sm">
												{response.pixelId && (
													<p>
														<strong>Pixel ID:</strong> {response.pixelId}
													</p>
												)}
												<p>
													<strong>Event:</strong> {response.event}
												</p>
												{response.data &&
													Object.keys(response.data).length > 0 && (
														<div>
															<strong>Event Data:</strong>
															<pre className="mt-2 text-xs bg-background p-2 rounded">
																{JSON.stringify(response.data, null, 2)}
															</pre>
														</div>
													)}
												<p className="text-green-600 font-medium mt-4">
													✓ {response.message}
												</p>
											</div>
										</div>
									</div>
								) : (
									/* API 上报结果 */
									<>
										{/* 发送的 Payload */}
										<div className="space-y-2">
											<Label>发送的数据（Payload）</Label>
											<div className="bg-muted rounded-lg p-4 overflow-auto max-h-96">
												<pre className="text-xs overflow-x-auto">
													{JSON.stringify(response.payload, null, 2)}
												</pre>
											</div>
										</div>

										{/* 响应结果 */}
										<div className="space-y-2">
											<Label>响应结果</Label>
											<div className="bg-muted rounded-lg p-4 overflow-auto">
												<div className="flex items-center gap-2 mb-2">
													<Badge
														variant={
															response.status === 200
																? "default"
																: "destructive"
														}
													>
														Status: {response.status}
													</Badge>
													{response.data.events_received !== undefined && (
														<Badge variant="outline">
															收到 {response.data.events_received} 个事件
														</Badge>
													)}
													{response.data.messages && (
														<Badge variant="secondary">
															{response.data.messages[0]}
														</Badge>
													)}
												</div>
												<pre className="text-sm overflow-x-auto">
													{JSON.stringify(response.data, null, 2)}
												</pre>
											</div>
										</div>
									</>
								)}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 使用提示 */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">使用提示</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-muted-foreground">
					{formData.reportType === "sdk" ? (
						/* SDK 模式提示 */
						<>
							<p>
								<strong className="text-foreground">SDK 上报：</strong>
								使用 Facebook Pixel SDK 在浏览器端上报事件
							</p>
							<p>
								<strong className="text-foreground">必填字段：</strong>Pixel
								ID，以及至少选择一个标准事件或填写自定义事件名称
							</p>
							<p>
								<strong className="text-foreground">trackSingleCustom：</strong>
								如果填写自定义事件名称，将使用 trackSingleCustom
								方法发送自定义事件
							</p>
							<p>
								<strong className="text-foreground">标准事件：</strong>
								如果只选择标准事件，将使用 track 方法发送标准事件
							</p>
							<p>
								<strong className="text-foreground">SDK 自动处理：</strong>
								SDK 会自动收集浏览器信息（UA、Cookie 等）
							</p>
						</>
					) : (
						/* API 模式提示 */
						<>
							<p>
								<strong className="text-foreground">API 上报：</strong>
								使用 Conversions API 进行服务端上报
							</p>
							<p>
								<strong className="text-foreground">必填字段：</strong>Access
								Token、Pixel ID、Event、Action Source
							</p>
							<p>
								<strong className="text-destructive">客户信息参数：</strong>
								必须至少填写一个（Client IP、External ID、fbp 或 fbc），否则
								Facebook 会返回错误
							</p>
							<p>
								<strong className="text-foreground">推荐填写：</strong>Client IP
								Address（用户的 IP 地址）+ fbp Cookie，可提高匹配质量
							</p>
							<p>
								<strong className="text-foreground">测试事件：</strong>在 Events
								Manager &gt; Test Events 中获取 Test Event Code
							</p>
							<p>
								<strong className="text-foreground">获取 Cookie：</strong>
								在浏览器开发者工具的 Application &gt; Cookies 中查找 _fbp 和
								_fbc
							</p>
						</>
					)}
					<p>
						<strong className="text-foreground">官方文档：</strong>
						<a
							href="https://developers.facebook.com/docs/marketing-api/conversions-api/parameters"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							Conversions API 参数说明
						</a>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
