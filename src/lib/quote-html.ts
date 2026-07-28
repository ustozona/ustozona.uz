import DOMPurify from "dompurify";

/* ════════════════════════════════════════════════════════════════════
   IQTIBOS HTML — foydalanuvchi formatlagan matnni xavfsiz render qilish.

   Iqtibos matni Tiptap mini-muharrirda yoziladi va localStorage'da HTML
   sifatida saqlanadi. localStorage foydalanuvchi qoʻlida (DevTools orqali
   tahrirlanishi mumkin), shuning uchun render'dan oldin doim tozalanadi.

   Ruxsat etilgan teglar ATAYLAB tor: faqat matn-ichi bezaklari. Havola,
   rasm, roʻyxat, sarlavha — hech biri yoʻq, chunki iqtibos bir-ikki
   qatorlik matn, hujjat emas. Atributlar butunlay taqiqlangan — demak
   highlight bitta (jadval orqali beriladigan) rangda boʻladi.

   Faqat brauzerda ishlatiladi (DOMPurify DOM talab qiladi).
   ════════════════════════════════════════════════════════════════════ */

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "s", "mark", "br"];

/** Iqtibos HTML'ini render uchun tozalaydi (allowlist tashqarisi olib tashlanadi). */
export function sanitizeQuoteHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

/** HTML'dan formatsiz matn ajratadi — `Quote.text` (a11y/fallback) uchun. */
export function quoteHtmlToPlain(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = sanitizeQuoteHtml(html);
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Muharrir boʻshmi — `<p></p>`, `<br>` kabi "koʻrinmas" HTML ham boʻsh sanaladi. */
export function isQuoteHtmlEmpty(html: string): boolean {
  return quoteHtmlToPlain(html).length === 0;
}
