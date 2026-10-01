import { DAYS_UZ_CYRL_SUN, DAYS_UZ_SUN, MONTHS_UZ, MONTHS_UZ_CYRL } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   «SANA» VIDJETI — kun nomi va sana matni (docs/doska-referens-koriklari.md R445).

   Oʻzbekcha (lotin va kirill) — oʻz nomlarimizdan (`localization.ts`):
   brauzerlarning bir qismida `uz` uchun ICU maʼlumoti yoʻq va «M10»
   chiqadi, ustiga ICU «1 октябр» deb yozadi, oʻzbek imlosida esa «1-октябр».
   Qolgan tillar — `Intl`. Brauzer tilni bilmasa (masalan qoraqalpoq), u
   jim inglizchaga tushib qoladi — shuning uchun natija tekshiriladi va
   bilmagan holda oʻzbekcha lotin nomlar olinadi: ular oʻquvchiga tanish.
   ════════════════════════════════════════════════════════════════════ */

export type DayLabel = { weekday: string; date: string };

function uzLabel(d: Date, withYear: boolean, cyrillic: boolean): DayLabel {
  const months = cyrillic ? MONTHS_UZ_CYRL : MONTHS_UZ;
  const days = cyrillic ? DAYS_UZ_CYRL_SUN : DAYS_UZ_SUN;
  const date = `${d.getDate()}-${months[d.getMonth()].toLowerCase()}`;
  // Oʻzbek tilidagi rasmiy tartib — yil oldinda (`formatFullDateUz`).
  const year = `${d.getFullYear()}-${cyrillic ? "йил" : "yil"}`;
  return { weekday: days[d.getDay()], date: withYear ? `${year} ${date}` : date };
}

/** Brauzer shu tilni haqiqatan biladimi — bilmasa `Intl` boshqa tilga tushadi. */
function intlKnows(locale: string): boolean {
  try {
    const resolved = new Intl.DateTimeFormat(locale).resolvedOptions().locale;
    return resolved.split("-")[0] === locale.split("-")[0];
  } catch {
    return false;
  }
}

const capitalize = (s: string, locale: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

export function dayLabel(d: Date, locale: string, withYear: boolean): DayLabel {
  if (locale === "uz-Cyrl") return uzLabel(d, withYear, true);
  if (locale === "uz" || !intlKnows(locale)) return uzLabel(d, withYear, false);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(d);
  // ICU maʼlumoti chala boʻlsa oy oʻrnida «M10» chiqadi.
  if (/M\d/.test(date)) return uzLabel(d, withYear, false);
  return { weekday: capitalize(weekday, locale), date };
}
