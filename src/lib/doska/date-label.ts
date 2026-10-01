import { DAYS_UZ_SUN, MONTHS_UZ } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   «SANA» VIDJETI — kun nomi va sana matni (docs/doska-referens-koriklari.md R445).

   Oʻzbekcha (lotin) — oʻz nomlarimizdan (`localization.ts`): brauzerlarning
   bir qismida `uz` uchun ICU maʼlumoti yoʻq va «M10» chiqadi. Qolgan tillar
   — `Intl`. Brauzer tilni bilmasa (masalan qoraqalpoq), u jim inglizchaga
   tushib qoladi — shuning uchun natija tekshiriladi va bilmagan holda
   oʻzbekcha lotin nomlar olinadi: ular oʻquvchiga tanish.
   ════════════════════════════════════════════════════════════════════ */

export type DayLabel = { weekday: string; date: string };

function uzLabel(d: Date, withYear: boolean): DayLabel {
  const date = `${d.getDate()}-${MONTHS_UZ[d.getMonth()].toLowerCase()}`;
  // Oʻzbek tilidagi rasmiy tartib — yil oldinda (`formatFullDateUz`).
  return { weekday: DAYS_UZ_SUN[d.getDay()], date: withYear ? `${d.getFullYear()}-yil ${date}` : date };
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
  if (locale === "uz" || !intlKnows(locale)) return uzLabel(d, withYear);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d);
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(d);
  // ICU maʼlumoti chala boʻlsa oy oʻrnida «M10» chiqadi.
  if (/M\d/.test(date)) return uzLabel(d, withYear);
  return { weekday: capitalize(weekday, locale), date };
}
