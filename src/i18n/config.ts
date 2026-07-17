export const LOCALES = ["uz", "kaa", "ky", "kk", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  kaa: "Qaraqalpaqsha",
  ky: "Кыргызча",
  kk: "Қазақша",
  ru: "Русский",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
