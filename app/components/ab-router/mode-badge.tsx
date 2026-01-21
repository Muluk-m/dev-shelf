import { Shield, ShieldAlert, Zap } from "lucide-react";
import type { LinkMode } from "~/types/ab-router";

const modeConfig = {
	all_open: {
		label: "全开放",
		className:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
		icon: Zap,
	},
	review: {
		label: "审核模式",
		className:
			"bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
		icon: Shield,
	},
	final_link: {
		label: "全审核",
		className:
			"bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
		icon: ShieldAlert,
	},
};

interface ModeBadgeProps {
	mode: LinkMode;
	size?: "sm" | "default";
}

export function ModeBadge({ mode, size = "default" }: ModeBadgeProps) {
	const config = modeConfig[mode] || modeConfig.review;
	const Icon = config.icon;

	const sizeClasses = {
		sm: "px-2 py-0.5 text-[10px] gap-1",
		default: "px-2.5 py-1 text-xs gap-1.5",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses[size]}`}
		>
			<Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
			{config.label}
		</span>
	);
}
