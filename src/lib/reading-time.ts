/* ════════════════════════════════════════════════════════════════════
   OʻQISH VAQTI — "5 daqiqalik oʻqish"

   Hisob-kitob Medium'ning ochiq eʼlon qilingan usuliga tayanadi, chunki
   "X min read" yorligʻini aynan u ommalashtirgan va oʻquvchi undan
   nimani kutishni biladi:

     · matn — 265 soʻz/daqiqa (umumiy blog meʼyori 200–265 oraligʻida;
       yuqori chekka tanlandi, chunki past baho oʻquvchini "uzun ekan"
       deb qoʻrqitadi, aslida esa maqola qisqaroq oʻqiladi)
     · rasm — kamayib boruvchi qoʻshimcha: birinchisiga 12 soniya,
       keyingisiga 11, 10 … 3 soniyada toʻxtaydi. Sabab: birinchi rasmga
       odam tikilib qaraydi, oʻntinchisiga esa koʻz yugurtirib oʻtadi.

   Natija HAR DOIM kamida 1 daqiqa — "0 daqiqalik oʻqish" maʼnosiz.
   ════════════════════════════════════════════════════════════════════ */

const WORDS_PER_MINUTE = 265;
const FIRST_IMAGE_SECONDS = 12;
const MIN_IMAGE_SECONDS = 3;

/** Rasmlar uchun jami soniya: 12 + 11 + 10 + … (3 dan pastga tushmaydi). */
function imageSeconds(count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.max(MIN_IMAGE_SECONDS, FIRST_IMAGE_SECONDS - i);
  }
  return total;
}

/**
 * Tiptap chiqargan HTML'dan oʻqish vaqtini (daqiqada) hisoblaydi.
 *
 * ⚠️ `<script>`/`<style>` ataylab OLIB TASHLANADI: teg ichidagi kod matn
 * emas, lekin oddiy `replace(/<[^>]+>/g, "")` uning MAZMUNINI qoldirib
 * ketadi va soʻz soniga qoʻshib yuboradi.
 */
export function readingMinutes(html: string): number {
  const imageCount = (html.match(/<img\b/gi) ?? []).length;

  const text = html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // HTML mavjudotlari (&nbsp; va h.k.) soʻz sifatida sanalmasin
    .replace(/&[a-z]+;|&#\d+;/gi, " ");

  const words = text.split(/\s+/).filter(Boolean).length;
  const seconds = (words / WORDS_PER_MINUTE) * 60 + imageSeconds(imageCount);
  return Math.max(1, Math.round(seconds / 60));
}

/** "Taxminiy oʻqish vaqti: 5 daqiqa" */
export function readingTimeLabelUz(html: string): string {
  return `Taxminiy oʻqish vaqti: ${readingMinutes(html)} daqiqa`;
}
