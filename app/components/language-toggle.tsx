import { Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useLocaleStore } from "~/stores/locale-store";

export function LanguageToggle() {
	const locale = useLocaleStore((s) => s.locale);
	const setLocale = useLocaleStore((s) => s.setLocale);

	return (
		<Button
			variant="ghost"
			size="sm"
			className="h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
			onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
			title={locale === "zh-CN" ? "Switch to English" : "切换为中文"}
		>
			<Globe className="h-3.5 w-3.5" />
			{locale === "zh-CN" ? "EN" : "中文"}
		</Button>
	);
}
