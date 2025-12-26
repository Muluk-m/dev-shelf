import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface ScreenshotCardProps {
	screenshot: string;
	title?: string;
}

export function ScreenshotCard({
	screenshot,
	title = "页面截图",
}: ScreenshotCardProps) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-2">
				<div className="rounded border overflow-hidden">
					<img
						src={`data:image/png;base64,${screenshot}`}
						alt={title}
						className="w-full h-auto"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
