/* ════════════════════════════════════════════════════════════════════
   XAT SHABLONLARI UCHUN UMUMIY QISMLAR

   ⚠️ Bu yerda dizayn tizimi tokenlari ISHLATILMAYDI. Pochta mijozi
   CSS oʻzgaruvchisini ham, tashqi stil faylini ham bilmaydi — hamma
   narsa inline va qotirilgan qiymat bilan yoziladi.
   ════════════════════════════════════════════════════════════════════ */

/** Brend sarigʻi — `src/assets/logo/brand-shield.tsx` bilan bir xil. */
const BREND_SARIQ = "#FBC02D";

/**
 * Foydalanuvchi kiritgan matnni HTML'ga qoʻyishdan oldin qalqonlaydi.
 *
 * Ism profildan keladi — ichida `<`, `&` yoki teg boʻlsa xat tuzilishi
 * buziladi (tugma va obunani bekor qilish havolasi ham yoʻqolishi
 * mumkin). HAR shablon foydalanuvchi matnini shu funksiyadan oʻtkazsin.
 */
export function qalqon(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Xat boshidagi brend belgisi.
 *
 * ⚠️ RASM ISHLATILMAYDI. Gmail va koʻp mijozlar tashqi rasmlarni
 * default holda bloklaydi — logo oʻrnida boʻsh quti qoladi va xat
 * buzuq koʻrinadi. Shuning uchun qalqon HTML bilan chiziladi:
 * sariq blok + `border-radius` (yuqorisi yumshoq, pasti yarim doira).
 *
 * `border-radius` ni tushunmaydigan eski mijozda (Outlook desktop) u
 * oddiy sariq kvadratga aylanadi — brend rangi baribir qoladi.
 */
export function brendSarlavha(): string {
  return `<div style="margin:0 0 24px">
    <span style="display:inline-block;width:26px;height:26px;background:${BREND_SARIQ};border-radius:18% 18% 50% 50% / 18% 18% 45% 45%;vertical-align:middle"></span>
    <span style="display:inline-block;margin-left:9px;font-size:17px;font-weight:600;color:#1f2937;letter-spacing:-0.2px;vertical-align:middle">Ustozona</span>
  </div>`;
}
