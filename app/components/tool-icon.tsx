import * as LucideIcons from "lucide-react";
import { Code } from "lucide-react";
import { cn } from "~/lib/utils";

function isUrl(str: string): boolean {
	return (
		str.startsWith("http://") ||
		str.startsWith("https://") ||
		str.startsWith("/") ||
		str.startsWith("data:")
	);
}

function getIconComponent(iconName: string) {
	const IconComponent = (LucideIcons as Record<string, any>)[iconName];
	return IconComponent || Code;
}

interface ToolIconProps {
	icon: string;
	className?: string;
}

export function ToolIcon({ icon, className }: ToolIconProps) {
	if (!icon) {
		return <Code className={className} />;
	}
	if (isUrl(icon)) {
		return (
			<img
				src={icon}
				alt=""
				className={cn(className, "object-contain")}
				loading="lazy"
			/>
		);
	}
	const IconComponent = getIconComponent(icon);
	return <IconComponent className={className} />;
}
