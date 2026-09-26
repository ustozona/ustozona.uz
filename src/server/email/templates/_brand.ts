/* ════════════════════════════════════════════════════════════════════
   XAT SHABLONLARI UCHUN UMUMIY QISMLAR

   ⚠️ Bu yerda dizayn tizimi tokenlari ISHLATILMAYDI. Pochta mijozi
   CSS oʻzgaruvchisini ham, tashqi stil faylini ham bilmaydi — hamma
   narsa inline va qotirilgan qiymat bilan yoziladi.
   ════════════════════════════════════════════════════════════════════ */

/** Brend sarigʻi — `src/assets/logo/brand-shield.tsx` bilan bir xil. */
const BREND_SARIQ = "#FBC02D";

/* Aktivatsiya xatlarida beriladigan Telegram aloqasi.

   ⚠️ Bu `landing-nav.ts` dagi `TELEGRAM_HANDLE` (@ustozona_tms) EMAS.
   U — ommaviy brend kanali (eʼlonlar oqimi). Bu yerda esa odam
   toʻgʻridan-toʻgʻri yozadigan SHAXSIY aloqa kerak: yordam soʻragan
   oʻqituvchi kanalga emas, tirik odamga yozishi lozim.

   Handle oʻzgarsa faqat shu satr tahrirlanadi. */
export const YORDAM_TELEGRAM = "@maxdum";
export const YORDAM_TELEGRAM_URL = "https://t.me/maxdum";

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
 * Xat boshidagi brend belgisi: qalqon + «Ustozona», yonma-yon.
 *
 * ⚠️ RASM ISHLATILMAYDI. Gmail va koʻp mijozlar tashqi rasmlarni
 * default holda bloklaydi — logo oʻrnida boʻsh quti qoladi va xat
 * buzuq koʻrinadi. Shuning uchun qalqon HTML bilan chiziladi:
 * sariq blok + `border-radius` (yuqorisi yumshoq, pasti yarim doira).
 *
 * `border-radius` ni tushunmaydigan eski mijozda (Outlook desktop) u
 * oddiy sariq kvadratga aylanadi — brend rangi baribir qoladi.
 *
 * ⚠️ JADVAL ISHLATILADI, `display:inline-block` EMAS. 2026-09-07
 * sinovida Gmail inline-block'ni tashlab yubordi va qalqon bilan
 * yozuv ustma-ust tushdi. Jadval — pochta HTML'idagi yagona
 * ishonchli joylashuv vositasi; `vertical-align:middle` ikkisini
 * markazlari boʻyicha tekislaydi.
 *
 * Blok xat kengligi boʻyicha MARKAZDA turadi (matn esa chapda).
 * Markazlash ikki usul bilan berilgan — oʻrab turgan `text-align`
 * va jadvalning `margin:0 auto` — chunki mijozlar ikkisidan birini
 * tashlab yuborishi mumkin.
 */
export function brendSarlavha(): string {
  return `<div style="text-align:center;margin:0 0 24px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;border-collapse:collapse">
    <tr>
      <td style="vertical-align:middle;line-height:0;padding:0">
        <div style="width:26px;height:26px;background:${BREND_SARIQ};border-radius:18% 18% 50% 50% / 18% 18% 45% 45%"></div>
      </td>
      <td style="vertical-align:middle;padding:0 0 0 9px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:17px;font-weight:600;color:#1f2937;letter-spacing:-0.2px;line-height:26px">Ustozona</td>
    </tr>
  </table>
</div>`;
}
