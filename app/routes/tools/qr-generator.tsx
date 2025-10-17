import QRCodeStyling, { type Extension, type Options } from "qr-code-styling";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

type DotsShape =
	| "square"
	| "dots"
	| "rounded"
	| "classy"
	| "classy-rounded"
	| "extra-rounded";
type CornerShape = "square" | "dot";

export default function QRCodeMaker() {
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
	const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
	const [logo, setLogo] = useState<string | null>(null);
	const [logoSize, setLogoSize] = useState<number>(0.25);
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
			image: backgroundImage ?? undefined,
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
			image: logo ?? undefined,
			imageOptions: {
				imageSize: logo ? logoSize : 0,
				crossOrigin: "anonymous",
				margin: 4,
				hideBackgroundDots: true,
			},
			dotsOptions,
			cornersSquareOptions: { type: cornersSquareShape, color: fgColor },
			cornersDotOptions: { type: cornersDotShape, color: fgColor },
		};
	}, [
		bgColor,
		backgroundImage,
		cornersDotShape,
		cornersSquareShape,
		dotsShape,
		fgColor,
		gradEnd,
		gradStart,
		gradient,
		logo,
		logoSize,
		margin,
		size,
		text,
	]);

	const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		const reader = new FileReader();
		reader.onload = () => setLogo(String(reader.result));
		reader.readAsDataURL(f);
	};

	const handleGenerate = () => {
		if (!qrRef.current) {
			qrRef.current = new QRCodeStyling(options);
			if (containerRef.current) {
				qrRef.current.append(containerRef.current);
			}
		} else {
			qrRef.current.update(options);
		}
	};

	const download = async () => {
		await qrRef.current?.download({ name: "qrcode", extension: downloadExt });
	};

	useEffect(() => {
		handleGenerate();
	}, [options]);

	return (
		<div className="max-w-4xl mx-auto ">
			<h1>二维码生成器（可自定义样式）</h1>
			<p style={{ color: "#666" }}>
				支持背景色、渐变、方块形状、背景图片、Logo、中间图标等。
			</p>

			<div className="flex flex-nowrap justify-between mt-12">
				<Card>
					<div className="min-w-96">
						<CardContent className="flex items-center justify-start mb-4">
							<Label htmlFor="text" className="min-w-[100px] justify-end mr-4">
								URL / 文本
							</Label>
							<Input
								id="text"
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder="https://..."
							/>
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label htmlFor="size" className="min-w-[100px] justify-end mr-4">
								尺寸
							</Label>
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
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label
								htmlFor="margin"
								className="min-w-[100px] justify-end mr-4"
							>
								边距
							</Label>
							<Input
								id="margin"
								type="number"
								min={0}
								max={64}
								value={margin}
								onChange={(e) =>
									setMargin(
										Math.max(0, Math.min(64, Number(e.target.value) || 0)),
									)
								}
							/>
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label
								htmlFor="bgColor"
								className="min-w-[100px] justify-end mr-4"
							>
								背景色
							</Label>
							<Input
								className="w-[100px]"
								id="bgColor"
								type="color"
								value={bgColor}
								onChange={(e) => setBgColor(e.target.value)}
							/>
						</CardContent>
						<CardContent className="flex items-center justify-start mb-4">
							<Label
								htmlFor="fgColor"
								className="min-w-[100px] justify-end mr-4"
							>
								前景色
							</Label>
							<Input
								className="w-[100px]"
								id="fgColor"
								type="color"
								value={fgColor}
								onChange={(e) => setFgColor(e.target.value)}
							/>
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label
								htmlFor="gradient"
								className="min-w-[100px] justify-end mr-4"
							>
								渐变
							</Label>
							<Input
								className="w-[20px] mr-2"
								id="gradient"
								type="checkbox"
								checked={gradient}
								onChange={(e) => setGradient(e.target.checked)}
							/>
							{gradient && (
								<>
									<Input
										className="w-[100px]"
										type="color"
										value={gradStart}
										onChange={(e) => setGradStart(e.target.value)}
									/>
									<span>→</span>
									<Input
										className="w-[100px]"
										type="color"
										value={gradEnd}
										onChange={(e) => setGradEnd(e.target.value)}
									/>
								</>
							)}
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label className="min-w-[100px] justify-end mr-4">方块形状</Label>
							<Select
								value={dotsShape}
								onValueChange={(value) => setDotsShape(value as DotsShape)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="square">square</SelectItem>
									<SelectItem value="dots">dots</SelectItem>
									<SelectItem value="rounded">rounded</SelectItem>
									<SelectItem value="classy">classy</SelectItem>
									<SelectItem value="classy-rounded">classy-rounded</SelectItem>
									<SelectItem value="extra-rounded">extra-rounded</SelectItem>
								</SelectContent>
							</Select>
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label className="min-w-[100px] justify-end mr-4">
								定位角(外)形状
							</Label>
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
									<SelectItem value="square">square</SelectItem>
									<SelectItem value="dot">dot</SelectItem>
								</SelectContent>
							</Select>
						</CardContent>

						<CardContent className="flex items-center justify-start mb-4">
							<Label className="min-w-[100px] justify-end mr-4">
								定位角(内)形状
							</Label>
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
									<SelectItem value="square">square</SelectItem>
									<SelectItem value="dot">dot</SelectItem>
								</SelectContent>
							</Select>
						</CardContent>

						{/* <CardContent className="flex items-center justify-start mb-4">
            <Label htmlFor="logo" className="min-w-[100px] justify-end mr-4">
              Logo / 中心图
            </Label>
            <Input type="file" accept="image/*" onChange={handleLogo} />
          </CardContent> */}

						{/* <CardContent className="flex items-center justify-start mb-4">
            <Label
              htmlFor="logoSize"
              className="min-w-[100px] justify-end mr-4"
            >
              Logo大小
            </Label>
            <Input
              className="w-[100px] justify-end mr-2"
              id="logoSize"
              type="number"
              min={0}
              max={0.5}
              step={0.05}
              value={logoSize}
              onChange={(e) =>
                setLogoSize(
                  Math.max(0, Math.min(0.5, Number(e.target.value) || 0.25))
                )
              }
            />
            <Button
              onClick={() => {
                setLogo(null);
                setLogoSize(0.25);
              }}
            >
              移除
            </Button>
          </CardContent> */}
					</div>
				</Card>
				<CardContent>
					<div
						ref={containerRef}
						style={{
							width: size,
							height: size,
							background: "#fff",
							borderRadius: 12,
							boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
							display: "grid",
							placeItems: "center",
						}}
					/>
					{/* <Select
            value={downloadExt}
            onValueChange={(value) => setDownloadExt(value as Extension)}
          >
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="webp">WEBP</SelectItem>
            </SelectContent>
          </Select> */}

					<div className="flex items-center justify-start mt-4 gap-4">
						<Label htmlFor="downloadExt">下载格式: </Label>
						<Select
							value={downloadExt}
							onValueChange={(value) => setDownloadExt(value as Extension)}
						>
							<SelectTrigger>
								<SelectValue placeholder="选择下载格式" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="png">PNG</SelectItem>
								<SelectItem value="jpeg">JPEG</SelectItem>
								<SelectItem value="svg">SVG</SelectItem>
								<SelectItem value="webp">WEBP</SelectItem>
							</SelectContent>
						</Select>
						<Button onClick={download}>下载</Button>
					</div>
				</CardContent>
			</div>
		</div>
	);
}
