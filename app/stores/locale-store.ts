import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Locale = "zh-CN" | "en";

interface LocaleState {
	locale: Locale;
	setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set) => ({
			locale: "zh-CN",
			setLocale: (locale) => {
				import("~/lib/i18n").then(({ default: i18next }) => {
					i18next.changeLanguage(locale);
				});
				set({ locale });
			},
		}),
		{
			name: "locale",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
