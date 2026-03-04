import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Locale } from "~/i18n/translations";

interface LocaleState {
	locale: Locale;
	setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set) => ({
			locale: "zh-CN",
			setLocale: (locale) => set({ locale }),
		}),
		{
			name: "locale",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
