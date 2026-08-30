/* ════════════════════════════════════════════════════════════════════
   NASHR KOʻRINISHI UCHUN PROSE HTML TOZALASH

   Tiptap muharriri `editor.getHTML()` ni xom saqlaydi — foydalanuvchi
   matn boshida yoki oxirida qoldirgan boʻsh qatorlar `<p></p>` /
   `<p><br></p>` koʻrinishida hujjatga tushadi. Muharrirning oʻzida ular
   ATAYLAB saqlanadi (kursor qoʻyadigan joy kerak), lekin nashr qilingan
   sahifada ular sarlavha bilan matn orasida tushuntirib boʻlmaydigan
   boʻshliq qoldiradi.

   Shu sababli faqat RENDER paytida (ommaviy `blog/[slug]` sahifasi)
   kontent boshi/oxiridagi boʻsh xatboshilar olib tashlanadi. Bazadagi
   qiymat tegilmaydi — muharrir uni oʻzgarishsiz qayta yuklaydi.

   Server komponentida ishlaydi (DOM yoʻq), shuning uchun regex.
   ════════════════════════════════════════════════════════════════════ */

/** Bitta "boʻsh" xatboshi: ichida faqat boʻshliq, `&nbsp;` yoki `<br>`. */
const EMPTY_P_SOURCE = "<p[^>]*>(?:\\s|&nbsp;|&#160;|<br\\s*/?>)*</p>";
const LEADING_EMPTY_P = new RegExp(`^\\s*(?:${EMPTY_P_SOURCE})\\s*`, "i");
const TRAILING_EMPTY_P = new RegExp(`\\s*(?:${EMPTY_P_SOURCE})\\s*$`, "i");

/** Kontent boshi va oxiridagi boʻsh xatboshilarni olib tashlaydi. */
export function trimProseHtml(html: string): string {
  let out = html.trim();
  let prev: string;
  do {
    prev = out;
    out = out.replace(LEADING_EMPTY_P, "").replace(TRAILING_EMPTY_P, "");
  } while (out !== prev);
  return out;
}
