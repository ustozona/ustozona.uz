import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

type Messages = Record<string, unknown>;

const isPlainObject = (v: unknown): v is Messages =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Tarjima yetishmasa — oʻzbekcha matn. Ilgari yangi kalit boshqa tilda
 * hali yoʻq boʻlsa, sahifada xom kalit chiqardi («Landing.hero.badge»).
 * Endi tanlangan til asosiy tilning ustiga yoziladi: bor kalit — oʻz
 * tilida, yoʻq kalit — oʻzbekcha.
 *
 * Massivlar birlashtirilmaydi, butunicha almashtiriladi: tildagi FAQ
 * roʻyxati asosiy tildagidan qisqa boʻlsa, qolgan savollar oʻzbekcha
 * boʻlib qoʻshilib ketmasin.
 */
function withFallback(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key];
    out[key] =
      isPlainObject(baseValue) && isPlainObject(value)
        ? withFallback(baseValue, value)
        : value;
  }
  return out;
}

/* Birlashtirish har soʻrovda takrorlanmasin — natija til boʻyicha
   saqlanadi. Kalit sifatida manba obyektlarning OʻZI tekshiriladi:
   devda JSON tahrirlansa modul qayta yuklanadi, obyekt yangi boʻladi
   va kesh oʻzi yangilanadi. */
const mergedCache = new Map<string, { base: Messages; own: Messages; value: Messages }>();

function mergedMessages(locale: string, base: Messages, own: Messages): Messages {
  const hit = mergedCache.get(locale);
  if (hit && hit.base === base && hit.own === own) return hit.value;
  const value = withFallback(base, own);
  mergedCache.set(locale, { base, own, value });
  return value;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const own = (await import(`../../messages/${locale}.json`)).default as Messages;
  const messages =
    locale === DEFAULT_LOCALE
      ? own
      : mergedMessages(
          locale,
          (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default as Messages,
          own,
        );

  return { locale, messages };
});
