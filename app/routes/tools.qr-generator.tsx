import { Download, QrCode } from "lucide-react";
import QRCodeStyling, { type Extension, type Options } from "qr-code-styling";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ToolPageHeader } from "~/components/tool-page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import type { BuiltinToolMeta } from "~/types/tool";
import type { Route } from "./+types/tools.qr-generator";

export const toolMeta: BuiltinToolMeta = {
	id: "qr-generator",
	name: "二维码生成器",
	description: "生成可自定义样式的二维码，支持多种形状、渐变色和下载格式",
	icon: "QrCode",
	category: "builtin",
	tags: ["qr", "qrcode", "generate"],
};

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "二维码生成器 | DevShelf" },
		{
			name: "description",
			content: "生成可自定义样式的二维码，支持多种形状、渐变色和下载格式",
		},
	];
}

type DotsShape =
	| "square"
	| "dots"
	| "rounded"
	| "classy"
	| "classy-rounded"
	| "extra-rounded";
type CornerShape = "square" | "dot";

export default function QRCodeMaker() {
	const { t } = useTranslation();
	const [text, setText] = useState<string>("https://example.com");
	const [size, setSize] = useState<number>(300);
	const [margin, setMargin] = useState<number>(10);
	const [bgColor, setBgColor] = useState<string>("#ffffff");
	const [fgColor, setFgColor] = useState<string>("#000000");
	const [dotsShape, setDotsShape] = useState<DotsShape>("rounded");
	const [cornersSquareShape, setCornersSquareShape] =
		useState<CornerShape>("square");
	const [cornersDotShape, setCornersDotShape] = useState<CornerShape>("dot");
	const [gradient, setGradient] = useState<boolean>(false);
	const [gradStart, setGradStart] = useState<string>("#000000");
	const [gradEnd, setGradEnd] = useState<string>("#1abc9c");
	const [downloadExt, setDownloadExt] = useState<
		"png" | "jpeg" | "svg" | "webp"
	>("png");

	const containerRef = useRef<HTMLDivElement | null>(null);
	const qrRef = useRef<QRCodeStyling | null>(null);

	const options = useMemo<Options>(() => {
		const dotsOptions: Options["dotsOptions"] = {
			type: dotsShape,
			color: gradient ? undefined : fgColor,
			gradient: gradient
				? {
						type: "linear",
						rotation: 0,
						colorStops: [
							{ offset: 0, color: gradStart },
							{ offset: 1, color: gradEnd },
						],
					}
				: undefined,
		};

		const backgroundOptions: Options["backgroundOptions"] = {
			color: bgColor,
		};

		return {
			width: size,
			height: size,
			margin,
			type: "svg" as const,
			data: text || " ",
			qrOptions: {
				errorCorrectionLevel: "H",
				typeNumber: 0,
				mode: "Byte",
			},
			backgroundOptions,
			dotsOptions,
			cornersSquareOptions: { type: cornersSquareShape, color: fgColor },
			cornersDotOptions: { type: cornersDotShape, color: fgColor },
		};
	}, [
		bgColor,
		cornersDotShape,
		cornersSquareShape,
		dotsShape,
		fgColor,
		gradEnd,
		gradStart,
		gradient,
		margin,
		size,
		text,
	]);

	const download = async () => {
		await qrRef.current?.download({ name: "qrcode", extension: downloadExt });
	};

	useEffect(() => {
		if (!qrRef.current) {
			qrRef.current = new QRCodeStyling(options);
			if (containerRef.current) {
				qrRef.current.append(containerRef.current);
			}
		} else {
			qrRef.current.update(options);
		}
	}, [options]);

	return (
		<div className="bg-background flex flex-col min-h-[calc(100vh-4rem)]">
			<div className="container mx-auto px-4 py-4 flex-1 flex flex-col">
				<div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
					<ToolPageHeader
						icon={<QrCode className="h-5 w-5" />}
						title={t("tools.qrGenerator.title")}
						description={t("tools.qrGenerator.description")}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
						<Card className="flex flex-col">
							<CardHeader className="pb-4">
								<CardTitle className="text-base">
									{t("tools.qrGenerator.config.title")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6 flex-1">
								<div className="space-y-2">
									<Label htmlFor="text">{t("tools.qrGenerator.content")}</Label>
									<Input
										id="text"
										value={text}
										onChange={(e) => setText(e.target.value)}
										placeholder="https://..."
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="size">{t("tools.qrGenerator.size")}</Label>
										<Input
											id="size"
											type="number"
											min={160}
											max={1024}
											value={size}
											onChange={(e) =>
												setSize(
													Math.max(
														160,
														Math.min(1024, Number(e.target.value) || 300),
													),
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="margin">
											{t("tools.qrGenerator.margin")}
										</Label>
										<Input
											id="margin"
											type="number"
											min={0}
											max={64}
											value={margin}
											onChange={(e) =>
												setMargin(
													Math.max(
														0,
														Math.min(64, Number(e.target.value) || 0),
													),
												)
											}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="bgColor">
											{t("tools.qrGenerator.bgColor")}
										</Label>
										<div className="flex gap-2">
											<Input
												id="bgColor"
												type="color"
												value={bgColor}
												onChange={(e) => setBgColor(e.target.value)}
												className="w-12 h-9 p-1 cursor-pointer"
											/>
											<Input
												value={bgColor}
												onChange={(e) => setBgColor(e.target.value)}
												className="font-mono text-sm"
											/>
										</div>
									</div>
									<div className="space-y-2">
										<Label htmlFor="fgColor">
											{t("tools.qrGenerator.fgColor")}
										</Label>
										<div className="flex gap-2">
											<Input
												id="fgColor"
												type="color"
												value={fgColor}
												onChange={(e) => setFgColor(e.target.value)}
												className="w-12 h-9 p-1 cursor-pointer"
											/>
											<Input
												value={fgColor}
												onChange={(e) => setFgColor(e.target.value)}
												className="font-mono text-sm"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label htmlFor="gradient">
											{t("tools.qrGenerator.gradient")}
										</Label>
										<Switch
											id="gradient"
											checked={gradient}
											onCheckedChange={setGradient}
										/>
									</div>
									{gradient && (
										<div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-primary/20">
											<div className="space-y-2">
												<Label className="text-xs text-muted-foreground">
													{t("tools.qrGenerator.gradStart")}
												</Label>
												<div className="flex gap-2">
													<Input
														type="color"
														value={gradStart}
														onChange={(e) => setGradStart(e.target.value)}
														className="w-10 h-8 p-1 cursor-pointer"
													/>
													<Input
														value={gradStart}
														onChange={(e) => setGradStart(e.target.value)}
														className="font-mono text-xs"
													/>
												</div>
											</div>
											<div className="space-y-2">
												<Label className="text-xs text-muted-foreground">
													{t("tools.qrGenerator.gradEnd")}
												</Label>
												<div className="flex gap-2">
													<Input
														type="color"
														value={gradEnd}
														onChange={(e) => setGradEnd(e.target.value)}
														className="w-10 h-8 p-1 cursor-pointer"
													/>
													<Input
														value={gradEnd}
														onChange={(e) => setGradEnd(e.target.value)}
														className="font-mono text-xs"
													/>
												</div>
											</div>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label>{t("tools.qrGenerator.dotsShape")}</Label>
									<Select
										value={dotsShape}
										onValueChange={(value) => setDotsShape(value as DotsShape)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="square">Square - 方形</SelectItem>
											<SelectItem value="dots">Dots - 圆点</SelectItem>
											<SelectItem value="rounded">Rounded - 圆角</SelectItem>
											<SelectItem value="classy">Classy - 优雅</SelectItem>
											<SelectItem value="classy-rounded">
												Classy Rounded - 圆角优雅
											</SelectItem>
											<SelectItem value="extra-rounded">
												Extra Rounded - 超圆
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>{t("tools.qrGenerator.cornerOuter")}</Label>
										<Select
											value={cornersSquareShape}
											onValueChange={(value) =>
												setCornersSquareShape(value as CornerShape)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="square">Square</SelectItem>
												<SelectItem value="dot">Dot</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>{t("tools.qrGenerator.cornerInner")}</Label>
										<Select
											value={cornersDotShape}
											onValueChange={(value) =>
												setCornersDotShape(value as CornerShape)
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="square">Square</SelectItem>
												<SelectItem value="dot">Dot</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="flex flex-col">
							<CardHeader className="pb-4">
								<CardTitle className="text-base">
									{t("tools.qrGenerator.preview")}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
								<div
									ref={containerRef}
									className="rounded-xl shadow-sm ring-1 ring-border/50 bg-background p-4"
									style={{ minWidth: 200, minHeight: 200 }}
								/>

								<div className="flex items-center gap-3 w-full max-w-xs">
									<Select
										value={downloadExt}
										onValueChange={(value) =>
											setDownloadExt(value as Extension)
										}
									>
										<SelectTrigger className="w-28">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="png">PNG</SelectItem>
											<SelectItem value="jpeg">JPEG</SelectItem>
											<SelectItem value="svg">SVG</SelectItem>
											<SelectItem value="webp">WebP</SelectItem>
										</SelectContent>
									</Select>
									<Button onClick={download} className="flex-1 gap-2">
										<Download className="h-4 w-4" />
										{t("tools.qrGenerator.download")}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
