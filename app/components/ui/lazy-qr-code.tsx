import type { Extension, Options } from "qr-code-styling";
import { useEffect, useRef, useState } from "react";

interface LazyQRCodeProps extends Omit<Options, "data"> {
	data: string;
	onReady?: (qr: QrCodeInstance) => void;
}

type QrCodeInstance = {
	update: (options: Partial<Options>) => void;
	download: (options?: {
		name?: string;
		extension?: Extension;
	}) => Promise<void>;
	append: (container: HTMLElement) => void;
};

export function LazyQRCode({ data, onReady, ...options }: LazyQRCodeProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const qrRef = useRef<QrCodeInstance | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (!containerRef.current || !data) return;

		const loadQR = async () => {
			const QRCodeStyling = (await import("qr-code-styling")).default;

			if (!qrRef.current) {
				qrRef.current = new QRCodeStyling({
					...options,
					data,
					type: "svg",
				} as Options);
				if (containerRef.current) {
					qrRef.current.append(containerRef.current);
				}
				onReady?.(qrRef.current);
			} else {
				qrRef.current.update({ ...options, data });
			}
			setIsLoaded(true);
		};

		loadQR();
	}, [data, options, onReady]);

	if (!isLoaded) {
		return (
			<div
				ref={containerRef}
				className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse"
				style={{ width: options.width || 200, height: options.height || 200 }}
			>
				<span className="text-muted-foreground text-sm">加载中...</span>
			</div>
		);
	}

	return <div ref={containerRef} />;
}
