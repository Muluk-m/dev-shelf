import { useI18n } from "~/hooks/use-i18n";
import { Button } from "~/components/ui/button";

export function LanguageToggle() {
	const { locale, setLocale } = useI18n();

	return (
		<Button
			variant="ghost"
			size="sm"
			className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
			onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
			title={locale === "zh-CN" ? "Switch to English" : "切换为中文"}
		>
			{locale === "zh-CN" ? "EN" : "中文"}
		</Button>
	);
}
