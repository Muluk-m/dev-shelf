import {
	CheckCircle,
	LogIn,
	Mail,
	Monitor,
	QrCode,
	Server,
	X,
} from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

export function meta() {
	return [
		{ title: "快捷登录 | DevTools Platform" },
		{
			name: "description",
			content: "通过邮箱快速生成登录链接，一键登录测试环境",
		},
	];
}

interface LoginResponse {
	code: number;
	msg: string;
	data: {
		token: string;
		account: string;
		merchant_no: number;
	};
}

// 业务线配置
interface BusinessLine {
	id: string;
	name: string;
	apiConfig: {
		url: string;
		method: "GET" | "POST";
		getParams: (email: string, environment: string) => Record<string, unknown>;
	};
	loginUrlTemplate: string; // 使用 {environment} 作为占位符
	environments: Array<{ value: string; label: string }>;
}

const BUSINESS_LINES: BusinessLine[] = [
	{
		id: "roibest",
		name: "ROIBest",
		apiConfig: {
			url: "https://hook-admin-stg.roibest.com/index/account/email_auth_login",
			method: "GET",
			getParams: (email) => ({ email }),
		},
		loginUrlTemplate: "https://mis-{environment}.qiliangjia.one/#/login",
		environments: [
			{ value: "stg", label: "测试环境 (stg)" },
			{ value: "test-1", label: "测试环境 (test-1)" },
			{ value: "test-2", label: "测试环境 (test-2)" },
		],
	},
	{
		id: "deepclick",
		name: "DeepClick",
		apiConfig: {
			url: "https://console-api-test.deepclick.com/api/console/account/register_by_captcha",
			method: "POST",
			getParams: (email) => ({
				captcha_code: "Hmo2FGG",
				email: email,
				register_from: 0,
			}),
		},
		loginUrlTemplate:
			"https://console-{environment}-deepclick.qiliangjia.one/login",
		environments: [
			{ value: "test", label: "测试环境 (test)" },
			{ value: "test-1", label: "测试环境 (test-1)" },
			{ value: "test-2", label: "测试环境 (test-2)" },
			{ value: "test-3", label: "测试环境 (test-3)" },
		],
	},
];

// 登录模式
type LoginMode = "pc" | "qrcode";

// LocalStorage 键
const EMAIL_HISTORY_KEY = "quick-login-email-history";
const MAX_HISTORY_SIZE = 5;

// 管理邮箱历史记录
const getEmailHistory = (): string[] => {
	if (typeof window === "undefined") return [];
	try {
		const history = localStorage.getItem(EMAIL_HISTORY_KEY);
		return history ? JSON.parse(history) : [];
	} catch {
		return [];
	}
};

const saveEmailToHistory = (email: string) => {
	if (typeof window === "undefined") return;
	try {
		let history = getEmailHistory();
		// 移除重复的邮箱
		history = history.filter((e) => e !== email);
		// 添加到最前面
		history.unshift(email);
		// 只保留最近5个
		history = history.slice(0, MAX_HISTORY_SIZE);
		localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history));
	} catch (error) {
		console.error("保存邮箱历史失败:", error);
	}
};

const deleteEmailFromHistory = (email: string) => {
	if (typeof window === "undefined") return;
	try {
		let history = getEmailHistory();
		history = history.filter((e) => e !== email);
		localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history));
	} catch (error) {
		console.error("删除邮箱历史失败:", error);
	}
};

export default function QuickLoginPage() {
	const [businessLineId, setBusinessLineId] = useState<string>("roibest");
	const [email, setEmail] = useState("");
	const [emailHistory, setEmailHistory] = useState<string[]>([]);
	const [environment, setEnvironment] = useState<string>("stg");
	const [loginMode, setLoginMode] = useState<LoginMode>("pc");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loginUrl, setLoginUrl] = useState<string | null>(null);
	const qrCodeRef = useRef<HTMLDivElement>(null);
	const qrCodeInstance = useRef<QRCodeStyling | null>(null);

	// 获取当前选择的业务线配置
	const currentBusinessLine =
		BUSINESS_LINES.find((bl) => bl.id === businessLineId) || BUSINESS_LINES[0];

	// 加载邮箱历史
	useEffect(() => {
		setEmailHistory(getEmailHistory());
	}, []);

	// 当业务线切换时，重置环境选择为第一个
	useEffect(() => {
		if (currentBusinessLine.environments.length > 0) {
			setEnvironment(currentBusinessLine.environments[0].value);
		}
	}, [businessLineId, currentBusinessLine.environments]);

	// 生成二维码
	useEffect(() => {
		if (loginUrl && loginMode === "qrcode" && qrCodeRef.current) {
			// 清除旧的二维码
			if (qrCodeInstance.current) {
				qrCodeRef.current.innerHTML = "";
			}

			// 创建新的二维码
			qrCodeInstance.current = new QRCodeStyling({
				width: 280,
				height: 280,
				data: loginUrl,
				margin: 10,
				qrOptions: {
					typeNumber: 0,
					mode: "Byte",
					errorCorrectionLevel: "M",
				},
				imageOptions: {
					hideBackgroundDots: true,
					imageSize: 0.4,
					margin: 0,
				},
				dotsOptions: {
					type: "rounded",
					color: "#000000",
				},
				backgroundOptions: {
					color: "#ffffff",
				},
				cornersSquareOptions: {
					type: "square",
					color: "#000000",
				},
				cornersDotOptions: {
					type: "dot",
					color: "#000000",
				},
			});

			qrCodeInstance.current.append(qrCodeRef.current);
		}
	}, [loginUrl, loginMode]);

	const handleGenerateLoginLink = async () => {
		if (!email.trim()) {
			setError("请输入邮箱地址");
			return;
		}

		// 简单的邮箱格式验证
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("请输入有效的邮箱地址");
			return;
		}

		setLoading(true);
		setError(null);
		setLoginUrl(null);

		try {
			// 使用当前业务线的 API 配置
			const { apiConfig } = currentBusinessLine;
			const requestParams = apiConfig.getParams(email, environment);

			let response: Response;

			if (apiConfig.method === "GET") {
				// GET 请求：参数拼接到 URL
				const queryParams = new URLSearchParams(
					requestParams as Record<string, string>,
				);
				response = await fetch(`${apiConfig.url}?${queryParams.toString()}`);
			} else {
				// POST 请求：参数放在 body
				response = await fetch(apiConfig.url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestParams),
				});
			}

			if (!response.ok) {
				throw new Error(`请求失败: ${response.status} ${response.statusText}`);
			}

			const result: LoginResponse = await response.json();

			if (result.code !== 0) {
				throw new Error(result.msg || "登录失败");
			}

			// 保存邮箱到历史记录
			saveEmailToHistory(email);
			setEmailHistory(getEmailHistory());

			// 构建登录链接，使用当前业务线的登录 URL 模板
			const params = new URLSearchParams({
				token: result.data.token,
			});

			if (currentBusinessLine.id === "roibest") {
				params.set("account", email);
				params.set("merchant_no", result.data.merchant_no.toString());
			}

			const targetUrl = currentBusinessLine.loginUrlTemplate.replace(
				"{environment}",
				environment,
			);
			const generatedUrl = `${targetUrl}?${params.toString()}`;
			setLoginUrl(generatedUrl);

			// 如果是PC模式，直接打开链接
			if (loginMode === "pc") {
				window.open(generatedUrl, "_blank");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "未知错误");
		} finally {
			setLoading(false);
		}
	};

	const handleCopyLink = () => {
		if (loginUrl) {
			navigator.clipboard.writeText(loginUrl);
			// 可以添加 toast 提示
		}
	};

	const handleDownloadQRCode = () => {
		if (qrCodeInstance.current) {
			qrCodeInstance.current.download({
				name: `login-qrcode-${Date.now()}`,
				extension: "png",
			});
		}
	};

	const handleDeleteEmail = (emailToDelete: string) => {
		deleteEmailFromHistory(emailToDelete);
		setEmailHistory(getEmailHistory());
	};

	return (
		<div className="bg-background flex flex-col min-h-[60vh]">
			<div className="w-full flex-1 flex">
				<div className="mx-auto w-full px-4 py-6">
					<div className="mx-auto w-full max-w-[680px] sm:max-w-[720px] md:max-w-[860px]">
						<div className="text-center mb-6">
							<h1 className="text-2xl font-bold flex items-center justify-center gap-2">
								<LogIn className="h-6 w-6" />
								快捷登录工具
							</h1>
							<p className="text-sm text-muted-foreground mt-2">
								输入邮箱地址，快速生成测试环境登录链接
							</p>
						</div>

						<Card className="mb-4">
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Mail className="h-4 w-4" />
									生成登录链接
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* 业务线选择 */}
								<div className="space-y-2">
									<Label htmlFor="businessLine">业务线</Label>
									<Select
										value={businessLineId}
										onValueChange={setBusinessLineId}
										disabled={loading}
									>
										<SelectTrigger id="businessLine">
											<SelectValue placeholder="选择业务线" />
										</SelectTrigger>
										<SelectContent>
											{BUSINESS_LINES.map((bl) => (
												<SelectItem key={bl.id} value={bl.id}>
													{bl.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* 测试环境选择 */}
								<div className="space-y-2">
									<Label htmlFor="environment">测试环境</Label>
									<Select
										value={environment}
										onValueChange={setEnvironment}
										disabled={loading}
									>
										<SelectTrigger id="environment">
											<SelectValue placeholder="选择测试环境" />
										</SelectTrigger>
										<SelectContent>
											{currentBusinessLine.environments.map((env) => (
												<SelectItem key={env.value} value={env.value}>
													<div className="flex items-center gap-2">
														<Server className="h-4 w-4" />
														{env.label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{/* 登录模式选择 */}
								<div className="space-y-2">
									<Label>登录模式</Label>
									<RadioGroup
										value={loginMode}
										onValueChange={(value) => setLoginMode(value as LoginMode)}
										className="flex gap-4"
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="pc" id="mode-pc" />
											<Label
												htmlFor="mode-pc"
												className="flex items-center gap-2 cursor-pointer font-normal"
											>
												<Monitor className="h-4 w-4" />
												PC 端登录（自动跳转）
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="qrcode" id="mode-qrcode" />
											<Label
												htmlFor="mode-qrcode"
												className="flex items-center gap-2 cursor-pointer font-normal"
											>
												<QrCode className="h-4 w-4" />
												扫码登录（生成二维码）
											</Label>
										</div>
									</RadioGroup>
								</div>

								{/* 邮箱地址输入 */}
								<div className="space-y-2">
									<Label htmlFor="email">邮箱地址</Label>
									<Input
										id="email"
										type="email"
										placeholder="请输入邮箱地址，例如：user@pushplus.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleGenerateLoginLink();
											}
										}}
										disabled={loading}
									/>
									{/* 历史邮箱快捷选择 */}
									{emailHistory.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{emailHistory.map((historyEmail) => (
												<div
													key={historyEmail}
													className="relative inline-flex group"
												>
													<Button
														variant="outline"
														size="sm"
														type="button"
														onClick={() => setEmail(historyEmail)}
														className="text-xs pr-8"
														disabled={loading}
													>
														{historyEmail}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteEmail(historyEmail);
														}}
														className="absolute right-0 top-0 h-full w-6 hover:bg-destructive hover:text-destructive-foreground rounded-l-none"
														disabled={loading}
														title="删除"
													>
														<X className="h-3 w-3" />
													</Button>
												</div>
											))}
										</div>
									)}
								</div>

								<Button
									onClick={handleGenerateLoginLink}
									disabled={loading}
									className="w-full"
								>
									{loading
										? "生成中..."
										: loginMode === "pc"
											? "生成并打开登录页面"
											: "生成登录二维码"}
								</Button>

								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								{/* PC 模式成功提示 */}
								{loginUrl && loginMode === "pc" && (
									<div className="space-y-3 pt-2">
										<Alert>
											<AlertDescription className="text-sm flex items-center gap-2">
												<CheckCircle className="h-4 w-4 text-green-500" />
												登录链接已生成并自动打开！（业务线：
												{currentBusinessLine.name}，环境：
												{
													currentBusinessLine.environments.find(
														(e) => e.value === environment,
													)?.label
												}
												）
											</AlertDescription>
										</Alert>
										<div className="text-xs text-muted-foreground text-center">
											如果浏览器未自动打开，请检查弹窗拦截设置
										</div>
									</div>
								)}

								{/* 二维码模式显示 */}
								{loginUrl && loginMode === "qrcode" && (
									<div className="space-y-3 pt-2">
										<Alert>
											<AlertDescription className="text-sm">
												✅ 登录二维码已生成！（业务线：
												{currentBusinessLine.name}，环境：
												{
													currentBusinessLine.environments.find(
														(e) => e.value === environment,
													)?.label
												}
												）
											</AlertDescription>
										</Alert>

										{/* 二维码显示区域 */}
										<div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-muted/30">
											<div
												ref={qrCodeRef}
												className="bg-white p-2 rounded-lg"
											/>
											<div className="text-sm text-muted-foreground text-center">
												使用手机扫描二维码登录
											</div>
										</div>

										{/* 二维码操作按钮 */}
										<div className="flex gap-2">
											<Button
												variant="outline"
												onClick={handleDownloadQRCode}
												className="flex-1"
											>
												下载二维码
											</Button>
											<Button
												variant="outline"
												onClick={handleCopyLink}
												className="flex-1"
											>
												复制链接
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* <Card>
							<CardHeader>
								<CardTitle className="text-base">使用说明</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground space-y-2">
								<p>
									<strong>1. 选择业务线和环境：</strong>
									选择需要登录的业务线和测试环境
								</p>
								<p>
									<strong>2. 选择登录模式：</strong>
								</p>
								<ul className="list-disc list-inside pl-4 space-y-1">
									<li>
										PC 端登录：生成后自动在新标签页打开，适合在电脑上直接登录
									</li>
									<li>
										扫码登录：生成二维码，适合在手机上扫码登录或分享给他人
									</li>
								</ul>
								<p>
									<strong>3. 输入邮箱：</strong>
									输入有效的邮箱地址，可以从历史记录快速选择
								</p>
								<p>
									<strong>4. 生成登录：</strong>
									点击按钮生成登录链接或二维码
								</p>
								<div className="pt-2 border-t">
									<p className="text-amber-600 dark:text-amber-400">
										⚠️ 安全提示：
									</p>
									<ul className="list-disc list-inside pl-4 space-y-1 text-amber-600 dark:text-amber-400">
										<li>此工具仅用于测试环境，请勿在生产环境使用</li>
										<li>请勿将生成的登录链接或二维码分享给未授权人员</li>
										<li>邮箱历史记录仅保存在本地浏览器中</li>
									</ul>
								</div>
							</CardContent>
						</Card> */}
					</div>
				</div>
			</div>
		</div>
	);
}
