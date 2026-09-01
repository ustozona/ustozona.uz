import "server-only";
import { SITE_URL, abs } from "@/lib/site-url";

/* ════════════════════════════════════════════════════════════════════
   INDEXNOW — nashr qilingan zahoti qidiruv tizimiga xabar berish.

   Sitemap passiv: robot oʻzi kelguncha kutiladi. IndexNow esa aktiv —
   maqola nashr qilingan soniyada «shu manzilni qayta oʻqi» deb aytamiz.

   Nega Yandex endpoint'i: Oʻzbekistonda Yandex qidiruv trafigining
   ~39% ini ushlaydi. Protokol qoidasiga koʻra bitta ishtirokchiga
   yuborilgan URL qolgan HAMMASIGA tarqatiladi, yaʼni bu chaqiruv Bing,
   Seznam va Naverni ham qamrab oladi.

   ⚠️ Google IndexNow'ni QOʻLLAMAYDI. Unga sitemap + Search Console
   qoladi — bu yerdagi kod Googlega hech narsa bermaydi.

   Kalit sir EMAS: u ochiq fayl orqali tekshiriladi (`/indexnow-key.txt`),
   maqsadi — domenga egalikni isbotlash, maxfiylik emas. Shunga qaramay
   env'da turadi: fayl va soʻrov bitta manbadan oʻqisin, ajralib
   qolmasin.
   ════════════════════════════════════════════════════════════════════ */

/** Kalit talablari (Yandex hujjati): 8–128 belgi, faqat `a-zA-Z0-9-`. */
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) return null;
  if (!KEY_PATTERN.test(key)) {
    console.warn("[indexnow] INDEXNOW_KEY formati notoʻgʻri (8–128 ta a-zA-Z0-9-) — oʻtkazib yuborildi");
    return null;
  }
  return key;
}

/** Berilgan manzillarni indekslashga qoʻyadi. Hech qachon xato tashlamaydi:
 *  nashr qilish amali IndexNow ishlamagani uchun yiqilmasligi kerak. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = getIndexNowKey();
  if (!key || urls.length === 0) return;

  /* Lokal/preview'da yubormaymiz: `localhost` manzillari kalit
     tekshiruvidan oʻtmaydi va faqat 422 qaytaradi. */
  if (process.env.NODE_ENV !== "production") {
    console.log(`[indexnow] dev rejimi — yuborilmadi: ${urls.join(", ")}`);
    return;
  }

  try {
    const res = await fetch("https://yandex.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: abs("/indexnow-key.txt"),
        urlList: urls,
      }),
      /* Nashr qilish tugmasi begona servis sekinligi tufayli osilib
         qolmasin. Vercel funksiyasi tugagach kutilmagan promise
         oʻldiriladi, shuning uchun `await` qilinadi — lekin qisqa. */
      signal: AbortSignal.timeout(5000),
    });
    /* 200 = qabul qilindi, 202 = kalit tekshiruvi navbatda. Qolgani xato,
       lekin baribir faqat log: chaqiruvchiga taʼsir qilmaydi. */
    if (res.ok) return;
    console.warn(`[indexnow] ${res.status} — ${urls.length} ta manzil qabul qilinmadi`);
  } catch (err) {
    console.warn("[indexnow] yuborib boʻlmadi:", err);
  }
}
