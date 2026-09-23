export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "cloudsec-finops-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pt";
}

export function detectBrowserLocale(
  languages: readonly string[] = [],
): Locale {
  for (const language of languages) {
    if (language.toLowerCase().startsWith("pt")) {
      return "pt";
    }
  }
  return DEFAULT_LOCALE;
}

export function localeToHtmlLang(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "pt-BR";
    case "en":
      return "en";
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
