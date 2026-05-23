import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", englishName: "English" },
  { code: "hi", name: "हिन्दी", englishName: "Hindi" },
  { code: "bn", name: "বাংলা", englishName: "Bengali" },
  { code: "te", name: "తెలుగు", englishName: "Telugu" },
  { code: "mr", name: "मराठी", englishName: "Marathi" },
  { code: "ta", name: "தமிழ்", englishName: "Tamil" },
  { code: "ur", name: "اردو", englishName: "Urdu" },
  { code: "gu", name: "ગુજરાતી", englishName: "Gujarati" },
  { code: "kn", name: "ಕನ್ನಡ", englishName: "Kannada" },
  { code: "or", name: "ଓଡ଼ିଆ", englishName: "Odia" },
  { code: "ml", name: "മലയാളം", englishName: "Malayalam" },
  { code: "pa", name: "ਪੰਜਾਬੀ", englishName: "Punjabi" },
  { code: "as", name: "অসমীয়া", englishName: "Assamese" },
  { code: "mai", name: "मैथिली", englishName: "Maithili" },
  { code: "sat", name: "ᱥᱟᱱᱛᱟᱲᱤ", englishName: "Santali" },
  { code: "ks", name: "کٲشُر", englishName: "Kashmiri" },
  { code: "ne", name: "नेपाली", englishName: "Nepali" },
  { code: "sd", name: "سنڌي", englishName: "Sindhi" },
  { code: "kok", name: "कोंकणी", englishName: "Konkani" },
  { code: "doi", name: "डोगरी", englishName: "Dogri" },
  { code: "mni", name: "মৈতৈলোন্", englishName: "Manipuri" },
  { code: "brx", name: "बड़ो", englishName: "Bodo" },
  { code: "sa", name: "संस्कृतम्", englishName: "Sanskrit" },
];

const STORAGE_KEY = "myfinance-language";

export function useLanguage() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "en";
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== i18n.language) {
      i18n.changeLanguage(stored);
    }
  }, [i18n]);

  const setLanguage = useCallback(
    (code: string) => {
      const isSupported = SUPPORTED_LANGUAGES.some((l) => l.code === code);
      const safeCode = isSupported ? code : "en";
      localStorage.setItem(STORAGE_KEY, safeCode);
      setCurrentLanguageState(safeCode);
      i18n.changeLanguage(safeCode);
    },
    [i18n],
  );

  return { currentLanguage, setLanguage, SUPPORTED_LANGUAGES };
}
