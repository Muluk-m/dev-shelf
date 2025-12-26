import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

interface RoiBestWarningCardProps {
	isRoiBestLink: boolean;
}

export function RoiBestWarningCard({ isRoiBestLink }: RoiBestWarningCardProps) {
	if (isRoiBestLink) return null;

	return (
		<Card className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
			<CardContent>
				<div className="flex items-start gap-3">
					<AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
							当前链接不是 RoiBest 链接
						</h3>
						<p className="text-sm text-yellow-800 dark:text-yellow-200">
							未检测到 RoiBest 系统的核心配置接口，该工具专为 RoiBest
							链接设计，当前分析结果可能不完整或不准确。
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
