export const LOCALES = ["uz", "en", "ru", "kaa", "ky", "kk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  en: "English",
  ru: "Русский",
  kaa: "Qaraqalpaqsha",
  ky: "Кыргызча",
  kk: "Қазақша",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
