"use client";

import { useAccessibility } from "./accessibility-context";
import { translations, TranslationKey, LanguageCode } from "./translations";

export function useTranslation() {
  const { settings } = useAccessibility();
  const language = settings.language as LanguageCode;

  const t = (key: TranslationKey): string => {
    const translation = translations[language]?.[key];

    // Fallback to English if translation not found
    if (!translation) {
      return translations.en[key] || key;
    }

    return translation;
  };

  return { t, language };
}
