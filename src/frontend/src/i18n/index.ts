import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";

// Locale imports — only English baseline is required for this build;
// additional locales are loaded as-needed stubs so the app never crashes
// if a translation key is missing (falls back to English).
const resources = {
  en: { translation: en },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "translation",
    ns: ["translation"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "myfinance-language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
