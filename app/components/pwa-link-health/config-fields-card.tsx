import { Link } from "lucide-react";
import {
	displayFields,
	fieldTranslations,
	importantFields,
	nestedFieldTranslations,
} from "~/lib/pwa-link-health";
import type { ConfigV3Data } from "~/types/pwa-link-health";
import { renderFieldValue } from "./field-renderers";

interface ConfigFieldsCardProps {
	configV3Data: ConfigV3Data;
}

export function ConfigFieldsCard({ configV3Data }: ConfigFieldsCardProps) {
	const renderField = (field: string, isPrimary: boolean) => {
		// 处理嵌套字段路径（如 "linkInfo.is_pixel_report"）
		let value: unknown;
		let fieldLabel: string;

		if (field.includes(".")) {
			const parts = field.split(".");
			let current: any = configV3Data;
			for (const part of parts) {
				if (current && typeof current === "object" && part in current) {
					current = current[part];
				} else {
					current = undefined;
					break;
				}
			}
			value = current;
			fieldLabel = nestedFieldTranslations[field] || field;
		} else {
			value = configV3Data?.[field as keyof ConfigV3Data];
			fieldLabel = fieldTranslations[field as keyof ConfigV3Data];
		}

		const displayValue = renderFieldValue(field, value, configV3Data);
		if (!displayValue) return null;

		// 特殊处理 linkInfo 完整对象
		if (field === "linkInfo" && !field.includes(".")) {
			return (
				<div key={field} className="md:col-span-2 lg:col-span-3 min-w-0 w-full">
					<div className="flex items-center gap-1.5 py-0.5 min-w-0 w-full">
						<div
							className={`text-xs flex-shrink-0 ${
								isPrimary
									? "font-semibold text-foreground"
									: "text-muted-foreground"
							}`}
						>
							{fieldLabel}:
						</div>
						<div
							className={`text-xs flex-1 min-w-0 break-words ${
								isPrimary ? "font-semibold text-foreground" : "font-medium"
							}`}
						>
							{displayValue}
						</div>
					</div>
				</div>
			);
		}

		return (
			<div
				key={field}
				className="flex items-center gap-1.5 py-1.5 min-w-0 w-full"
			>
				<span
					className={`text-xs flex-shrink-0 ${
						isPrimary
							? "font-semibold text-foreground"
							: "text-muted-foreground"
					}`}
				>
					{fieldLabel}:
				</span>
				<div
					className={`text-xs flex-1 min-w-0 break-words break-all ${
						isPrimary ? "font-medium text-foreground" : "text-muted-foreground"
					}`}
				>
					{typeof displayValue === "string" && displayValue.length > 100 ? (
						<pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32 border">
							{displayValue}
						</pre>
					) : (
						displayValue
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="space-y-3">
			<div className="text-sm font-semibold mb-2 flex items-center gap-2">
				<Link className="h-4 w-4" />
				链接详情
			</div>

			{/* 重要信息 */}
			<div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50 p-3">
				<div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
					重要信息
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
					{displayFields
						.filter((field) => importantFields.includes(field))
						.map((field) => renderField(field, true))
						.filter(Boolean)}
				</div>
			</div>

			{/* 次要信息 */}
			<div>
				<div className="text-xs text-muted-foreground mb-2">其他信息</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm overflow-hidden">
					{displayFields
						.filter((field) => !importantFields.includes(field))
						.map((field) => renderField(field, false))
						.filter(Boolean)}
				</div>
			</div>
		</div>
	);
}
