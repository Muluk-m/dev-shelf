import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../../locales/en.json";
import zhCN from "../../locales/zh-CN.json";

// Always initialize with zh-CN to match SSR output and avoid hydration mismatch.
// The actual user locale is synced from the Zustand store via useEffect in AppContent (root.tsx).
i18next.use(initReactI18next).init({
	resources: {
		"zh-CN": { translation: zhCN },
		en: { translation: en },
	},
	lng: "zh-CN",
	fallbackLng: "zh-CN",
	interpolation: { escapeValue: false },
	keySeparator: false,
});

export default i18next;
