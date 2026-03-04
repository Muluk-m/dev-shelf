import { useLocaleStore } from "~/stores/locale-store";
import { type TranslationKey, translations } from "~/i18n/translations";

/**
 * Returns a translation function `t` for the current locale.
 * Supports simple variable substitution: t('key', { count: 5 })
 * replaces {count} in the translation string.
 */
export function useI18n() {
	const { locale, setLocale } = useLocaleStore();

	const t = (key: TranslationKey, vars?: Record<string, string | number>): string => {
		const dict = translations[locale];
		let text = dict[key] ?? key;
		if (vars) {
			for (const [k, v] of Object.entries(vars)) {
				text = text.replace(`{${k}}`, String(v));
			}
		}
		return text;
	};

	return { t, locale, setLocale };
}
